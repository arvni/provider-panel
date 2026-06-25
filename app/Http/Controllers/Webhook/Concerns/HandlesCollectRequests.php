<?php

namespace App\Http\Controllers\Webhook\Concerns;

use App\Enums\CollectRequestStatus;
use App\Enums\OrderStatus;
use App\Models\CollectRequest;
use App\Models\Order;
use App\Models\Patient;
use App\Models\Sample;
use App\Models\SampleType;
use App\Models\Test;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;

/**
 * Shared sync helpers for the order import/update and patient webhooks.
 *
 * All ids received from these webhooks are server ids: the collect request is
 * keyed by its server id, a sample may carry its own collect_request_id (also a
 * server id) that takes precedence over the order's collect request, and
 * patients/tests/sample types are matched against their server id too. The
 * patient/test/sample-type helpers live here so a record synced through any of
 * the webhooks resolves to the same local row.
 */
trait HandlesCollectRequests
{
    /**
     * Create or update a patient, keyed by server_id then id_no.
     *
     * Existing rows are refreshed (saved only when something actually changed)
     * so patient data stays in step with the server across every webhook.
     */
    protected function createOrUpdatePatient(array $patientData, int $userId): Patient
    {
        $query = Patient::where('user_id', $userId);

        if (! empty($patientData['id'])) {
            $query->where('server_id', $patientData['id']);
        } elseif (! empty($patientData['id_no']) || ! empty($patientData['idNo'])) {
            $query->where('id_no', $patientData['id_no'] ?? $patientData['idNo']);
        } else {
            // No unique identifier to match on: always create a new patient.
            $query = null;
        }

        $patient = $query ? $query->first() : null;

        $attributes = [
            'user_id' => $userId,
            'server_id' => $patientData['id'] ?? null,
            'fullName' => $patientData['fullName'],
            'nationality' => $patientData['nationality'],
            'dateOfBirth' => ! empty($patientData['dateOfBirth'])
                ? Carbon::parse($patientData['dateOfBirth'])->format('Y-m-d')
                : null,
            'gender' => $patientData['gender'],
            'reference_id' => $patientData['reference_id'] ?? null,
            'id_no' => $patientData['id_no'] ?? $patientData['idNo'] ?? null,
        ];

        if ($patient) {
            $patient->fill($attributes);
            if ($patient->isDirty()) {
                $patient->save();
            }

            return $patient;
        }

        return Patient::create($attributes);
    }

    /**
     * Find a test by server_id, creating a placeholder when it is not synced yet.
     *
     * turnaroundTime is required by the schema, so it must be set on the
     * placeholder (the server's value when present, otherwise a sane default).
     */
    protected function findOrCreateTest(array $testData): Test
    {
        $test = Test::where('server_id', $testData['id'])->first();

        if (! $test) {
            Log::warning('Test not found by server_id, creating placeholder', [
                'server_id' => $testData['id'],
                'test_name' => $testData['name'] ?? null,
            ]);

            $test = Test::create([
                'server_id' => $testData['id'],
                'name' => $testData['name'],
                'code' => $testData['code'],
                'shortName' => $testData['shortName'] ?? $testData['code'],
                'turnaroundTime' => $testData['turnaroundTime'] ?? 1,
                'gender' => $testData['gender'] ?? [],
            ]);
        }

        return $test;
    }

    /**
     * Find a sample type by server_id, creating a placeholder when missing.
     */
    protected function findOrCreateSampleType(array $sampleTypeData): SampleType
    {
        $sampleType = SampleType::where('server_id', $sampleTypeData['id'])->first();

        if (! $sampleType) {
            Log::warning('Sample type not found by server_id, creating placeholder', [
                'server_id' => $sampleTypeData['id'],
                'sample_type_name' => $sampleTypeData['name'] ?? null,
            ]);

            $sampleType = SampleType::create([
                'server_id' => $sampleTypeData['id'],
                'name' => $sampleTypeData['name'],
                'sample_id_required' => $sampleTypeData['sample_id_required'] ?? false,
            ]);
        }

        return $sampleType;
    }

    /**
     * Upsert the collect request, keyed by its server id.
     *
     * The id received from the webhook is the collect request's server id; look
     * up the local record by it and create one when it does not exist yet.
     */
    protected function upsertCollectRequest(array $crData, int $userId): CollectRequest
    {
        $collectRequest = CollectRequest::where('server_id', $crData['id'])->first();

        // Logistic information is stored spread at the top level of details, as
        // the collect-request detail page reads details.barcodes,
        // details.temperature_logs, details.starting_location, etc.
        $details = array_merge(
            $collectRequest?->details ?? [],
            $crData['logistic_information'] ?? [],
            [
                'barcode' => $crData['barcode'] ?? ($collectRequest?->details['barcode'] ?? null),
                'sample_collector' => $crData['sample_collector'] ?? ($collectRequest?->details['sample_collector'] ?? null),
            ]
        );

        $status = CollectRequestStatus::tryFrom($crData['status']) ?? $collectRequest?->status;

        // preferred_date is a DATE column; the webhook may send a full ISO
        // datetime with offset (e.g. 2026-05-03T12:56:00+04:00), so normalise it.
        $preferredDate = $crData['preferred_date'] ?? $collectRequest?->preferred_date;
        if (! empty($preferredDate)) {
            $preferredDate = Carbon::parse($preferredDate)->format('Y-m-d');
        }

        $attributes = [
            'user_id' => $userId,
            'server_id' => $crData['id'],
            'status' => $status,
            'preferred_date' => $preferredDate,
            'details' => $details,
        ];

        if ($collectRequest) {
            $collectRequest->update($attributes);

            return $collectRequest;
        }

        return CollectRequest::create($attributes);
    }

    /**
     * Resolve the local collect request id for a sample.
     *
     * A sample may carry its own collect_request_id, which is the collect
     * request's server id; resolve it against a local record. When the sample
     * does not carry one, fall back to the order's collect request.
     */
    protected function resolveSampleCollectRequestId(array $sampleData, ?CollectRequest $collectRequest): ?int
    {
        if (empty($sampleData['collect_request_id'])) {
            return $collectRequest?->id;
        }

        $serverId = $sampleData['collect_request_id'];

        if ($collectRequest && (int) $collectRequest->server_id === (int) $serverId) {
            return $collectRequest->id;
        }

        return CollectRequest::where('server_id', $serverId)->value('id') ?? $collectRequest?->id;
    }

    /**
     * Link the order to its collect request, optionally tagging the order's
     * samples, and mirror the request status onto the order's lifecycle.
     *
     * Pass $tagSamples when the caller has not already tagged samples
     * per-sample (e.g. the import update path, which does not re-create them).
     */
    protected function linkCollectRequest(Order $order, CollectRequest $collectRequest, bool $tagSamples = false): void
    {
        $order->update(['collect_request_id' => $collectRequest->id]);

        if ($tagSamples) {
            // Tag this order's samples that are not already on another request.
            Sample::whereHas('OrderItems', fn ($query) => $query->where('order_id', $order->id))
                ->whereNull('collect_request_id')
                ->update(['collect_request_id' => $collectRequest->id]);
        }

        if ($collectRequest->status === CollectRequestStatus::PICKED_UP && is_null($order->sent_at)) {
            $order->update(['sent_at' => now()]);
        } elseif ($collectRequest->status === CollectRequestStatus::RECEIVED) {
            $updates = ['received_at' => $order->received_at ?? now()];
            // Only advance the order status; never move it backwards (e.g. an
            // order already at "processing" must not regress to "received").
            if (! $order->status->isAtOrAfter(OrderStatus::RECEIVED)) {
                $updates['status'] = OrderStatus::RECEIVED->value;
            }
            $order->update($updates);
        }
    }
}
