<?php

namespace App\Http\Controllers\Webhook;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Webhook\Concerns\HandlesCollectRequests;
use App\Models\Order;
use App\Models\Patient;
use App\Models\User;
use Illuminate\Contracts\Validation\Validator as ValidatorContract;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Throwable;

/**
 * Handle patient sync webhooks from the main server.
 *
 * Fired when a patient (or relative) is added to a referrer order on the main
 * server. The patient is upserted for the referrer's provider user (keyed by
 * server_id, falling back to id_no) and, when the referrer order has already
 * been synced to a local order, linked to that order — promoted to the order's
 * main patient when the payload flags it as such.
 */
class PatientWebhookController extends Controller
{
    use HandlesCollectRequests;

    /**
     * Handle the incoming patient webhook.
     *
     * @throws Throwable
     */
    public function store(Request $request): JsonResponse
    {
        // Signature is verified upstream by the verify.webhook middleware.
        $validator = $this->validatePayload($request);
        if ($validator->fails()) {
            Log::warning('Patient webhook validation failed', [
                'errors' => $validator->errors()->toArray(),
                'order_id' => $request->input('order_id'),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $data = $validator->validated();

        $user = User::where('referrer_id', $data['referrer_id'])->first();
        if (! $user) {
            Log::warning('Patient webhook referrer not found', ['referrer_id' => $data['referrer_id']]);

            return response()->json(['success' => false, 'message' => 'Referrer not found'], 422);
        }

        try {
            $result = DB::transaction(function () use ($data, $user) {
                $patient = $this->createOrUpdatePatient($data['patient'], $user->id);

                $order = $this->linkToOrder(
                    $data['order_id'] ?? null,
                    $user->id,
                    $patient,
                    (bool) ($data['patient']['is_main'] ?? false),
                );

                return ['patient' => $patient, 'order' => $order];
            });
        } catch (Throwable $e) {
            Log::error('Patient webhook processing failed', [
                'order_id' => $data['order_id'] ?? null,
                'referrer_id' => $data['referrer_id'],
                'error' => $e->getMessage(),
            ]);
            throw $e;
        }

        return response()->json([
            'success' => true,
            'patient_id' => $result['patient']->id,
            'order_id' => $result['order']?->id,
        ]);
    }

    /**
     * Validate the incoming payload, mirroring the patient block of the order webhooks.
     */
    private function validatePayload(Request $request): ValidatorContract
    {
        return Validator::make($request->all(), [
            'order_id' => 'nullable|integer',
            'referrer_id' => 'required|integer|exists:users,referrer_id',

            'patient' => 'required|array',
            'patient.id' => 'nullable',
            'patient.fullName' => 'required|string',
            'patient.nationality' => 'required',
            'patient.dateOfBirth' => 'nullable|date',
            'patient.gender' => 'required|in:-1,0,1',
            'patient.idNo' => 'nullable|string',
            'patient.id_no' => 'nullable|string',
            'patient.is_main' => 'nullable|boolean',
        ]);
    }

    /**
     * Link the patient to the referrer's local order when it has already synced.
     *
     * The order may not exist yet (the patient can be created before the order
     * reaches the provider); in that case the upsert above still stands and the
     * later order webhook will carry the patient in its own payload.
     */
    private function linkToOrder(?int $orderId, int $userId, Patient $patient, bool $isMain): ?Order
    {
        if (! $orderId) {
            return null;
        }

        $order = Order::where('id', $orderId)->where('user_id', $userId)->first();
        if (! $order) {
            return null;
        }

        $patientIds = $order->patient_ids ?? [];
        if (! in_array($patient->id, $patientIds, true)) {
            $patientIds[] = $patient->id;
        }

        $order->patient_ids = array_values($patientIds);
        if ($isMain) {
            $order->main_patient_id = $patient->id;
        }

        if ($order->isDirty()) {
            $order->save();
        }

        return $order;
    }
}
