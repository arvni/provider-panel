<?php

namespace App\Http\Controllers\Webhook;

use App\Enums\OrderStatus;
use App\Http\Controllers\Controller;
use App\Http\Controllers\Webhook\Concerns\HandlesCollectRequests;
use App\Models\CollectRequest;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Patient;
use App\Models\Sample;
use App\Models\User;
use Carbon\Carbon;
use Exception;
use Illuminate\Contracts\Validation\Validator as ValidatorContract;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Throwable;

/**
 * Handle order update webhooks from the main server.
 *
 * Unlike the import webhook, this endpoint is an upsert: it looks the order up
 * (by server_id, falling back to the provider's local order id carried in
 * referrer_order_id) and updates it when found, or creates it when it does not
 * yet exist. It always re-syncs the order's items and samples, and — when a
 * collect_request block is present — upserts that request and re-tags the
 * order's samples that belong to it.
 */
class OrderUpdateWebhookController extends Controller
{
    use HandlesCollectRequests;

    /**
     * Handle the incoming order update webhook.
     *
     * @throws Throwable
     */
    public function update(Request $request): JsonResponse
    {
        // Signature is verified upstream by the verify.webhook middleware.
        $validator = $this->validatePayload($request);
        if ($validator->fails()) {
            Log::warning('Order update webhook validation failed', [
                'errors' => $validator->errors()->toArray(),
                'order_id' => $request->input('order.id'),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $data = $validator->validated();

        try {
            $result = DB::transaction(fn () => $this->process($data));

            Log::info('Order update webhook processed', $result);

            return response()->json([
                'success' => true,
                'message' => $result['created'] ? 'Order created' : 'Order updated',
                'data' => $result,
            ]);
        } catch (Exception $e) {
            Log::error('Order update webhook failed', [
                'error' => $e->getMessage(),
                'order_id' => $data['order']['id'] ?? null,
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to update order',
            ], 500);
        }
    }

    /**
     * Validate the webhook payload.
     */
    private function validatePayload(Request $request): ValidatorContract
    {
        return Validator::make($request->all(), [
            'order' => 'required|array',
            'order.id' => 'required|integer',
            'order.referrer_order_id' => 'nullable|integer',
            'order.status' => 'required|string',
            'order.orderForms' => 'nullable|array',
            'order.consents' => 'nullable|array',
            'order.files' => 'nullable|array',

            // Main patient
            'order.main_patient' => 'required|array',
            'order.main_patient.id' => 'nullable|integer',
            'order.main_patient.fullName' => 'required|string',
            'order.main_patient.nationality' => 'required',
            'order.main_patient.dateOfBirth' => 'required|date',
            'order.main_patient.gender' => 'required|in:-1,0,1',
            'order.main_patient.reference_id' => 'nullable|string',
            'order.main_patient.id_no' => 'nullable|string',
            'order.main_patient.idNo' => 'nullable|string',

            // All patients
            'order.patients' => 'nullable|array',
            'order.patients.*.id' => 'required',
            'order.patients.*.fullName' => 'required|string',
            'order.patients.*.nationality' => 'required',
            'order.patients.*.dateOfBirth' => 'required|date',
            'order.patients.*.gender' => 'required|in:-1,0,1',
            'order.patients.*.id_no' => 'nullable|string',
            'order.patients.*.idNo' => 'nullable|string',

            // Order items
            'order.orderItems' => 'required|array|min:1',
            'order.orderItems.*.id' => 'required',
            'order.orderItems.*.test_id' => 'required|integer',
            'order.orderItems.*.test.id' => 'required|integer',
            'order.orderItems.*.test.name' => 'required|string',
            'order.orderItems.*.test.code' => 'required|string',

            // Samples
            'order.orderItems.*.samples' => 'required|array|min:1',
            'order.orderItems.*.samples.*.sampleId' => 'nullable|string',
            'order.orderItems.*.samples.*.sample_type_id' => 'required|integer',
            'order.orderItems.*.samples.*.sampleType' => 'required|array',
            'order.orderItems.*.samples.*.sampleType.id' => 'required|integer',
            'order.orderItems.*.samples.*.sampleType.name' => 'required|string',
            'order.orderItems.*.samples.*.patientId' => 'required',
            'order.orderItems.*.samples.*.collectionDate' => 'nullable|date',
            // Server id of the collect request this sample belongs to (optional).
            'order.orderItems.*.samples.*.collect_request_id' => 'nullable|integer',

            // Patients per order item
            'order.orderItems.*.patients' => 'required|array|min:1',
            'order.orderItems.*.patients.*.id' => 'required',
            'order.orderItems.*.patients.*.nationality' => 'required|string',
            'order.orderItems.*.patients.*.dateOfBirth' => 'required|date',
            'order.orderItems.*.patients.*.gender' => 'required|in:-1,0,1',
            'order.orderItems.*.patients.*.fullName' => 'required|string',
            'order.orderItems.*.patients.*.is_main' => 'required|boolean',

            'order.created_at' => 'nullable',
            'order.updated_at' => 'nullable',

            // Optional collect request block
            'collect_request' => 'nullable|array',
            'collect_request.id' => 'required_with:collect_request|integer',
            'collect_request.status' => 'required_with:collect_request|string',
            'collect_request.barcode' => 'nullable|string',
            'collect_request.preferred_date' => 'nullable|date',
            'collect_request.logistic_information' => 'nullable|array',
            'collect_request.sample_collector' => 'nullable|array',

            // Referrer / user info
            'referrer_id' => 'required|integer|exists:users,referrer_id',
        ]);
    }

    /**
     * Process the upsert for the order, its items/samples and the collect request.
     */
    private function process(array $data): array
    {
        $orderData = $data['order'];

        $user = User::where('referrer_id', $data['referrer_id'])->first();
        if (! $user) {
            abort(422, 'Referrer not found');
        }

        $created = false;
        $order = $this->findOrder($orderData, $user->id);
        if (! $order) {
            $created = true;
        }

        $order = $this->upsertOrder($order, $orderData, $user->id);

        // Upsert the collect request first so each sample can resolve its own
        // collect_request_id (a server id) against a local record.
        $collectRequest = null;
        if (! empty($data['collect_request'])) {
            $collectRequest = $this->upsertCollectRequest($data['collect_request'], $user->id);
        }

        // Re-sync items and samples; each sample is tagged to its collect request
        // individually (by the sample's own server-side collect_request_id, or the
        // order's request when the sample does not carry one).
        $sync = $this->syncOrderItems($order, $orderData, $user->id, $collectRequest);

        if ($collectRequest) {
            $this->linkCollectRequest($order, $collectRequest);
        }

        return [
            'created' => $created,
            'order_id' => $order->id,
            'order_items_count' => $sync['order_items_count'],
            'samples_count' => $sync['samples_count'],
            'collect_request_id' => $collectRequest?->id,
        ];
    }

    /**
     * Locate the existing order by server_id, falling back to the provider's
     * own order id carried back as referrer_order_id.
     */
    private function findOrder(array $orderData, int $userId): ?Order
    {
        $order = Order::where('server_id', $orderData['id'])->first();

        if (! $order && ! empty($orderData['referrer_order_id'])) {
            $order = Order::where('id', $orderData['referrer_order_id'])
                ->where('user_id', $userId)
                ->first();
        }

        return $order;
    }

    /**
     * Create the order when missing, otherwise update its mutable fields.
     */
    private function upsertOrder(?Order $order, array $orderData, int $userId): Order
    {
        $mainPatient = $this->createOrUpdatePatient($orderData['main_patient'], $userId);

        $patientIds = [$mainPatient->id];
        foreach ($orderData['patients'] ?? [] as $patientData) {
            $patient = $this->createOrUpdatePatient($patientData, $userId);
            if (! in_array($patient->id, $patientIds)) {
                $patientIds[] = $patient->id;
            }
        }

        $status = $orderData['status'];

        $attributes = [
            'user_id' => $userId,
            'server_id' => $orderData['id'],
            'status' => $status,
            'orderForms' => $orderData['orderForms'] ?? [],
            'consents' => $orderData['consents'] ?? [],
            'main_patient_id' => $mainPatient->id,
            'patient_ids' => $patientIds,
            'updated_at' => Carbon::parse($orderData['updated_at'] ?? now()),
        ];

        // Stamp lifecycle timestamps only on the first transition into each state.
        if ($status === OrderStatus::SENT->value && is_null($order?->sent_at)) {
            $attributes['sent_at'] = now();
        }
        if ($status === OrderStatus::RECEIVED->value && is_null($order?->received_at)) {
            $attributes['received_at'] = now();
        }
        if ($status === OrderStatus::REPORTED->value && is_null($order?->reported_at)) {
            $attributes['reported_at'] = now();
        }

        if ($order) {
            $order->update($attributes);

            return $order;
        }

        return Order::create([
            ...$attributes,
            'step' => 'finalize',
            'files' => [],
            'created_at' => Carbon::parse($orderData['created_at'] ?? now()),
        ]);
    }

    /**
     * Re-sync the order's items, their samples and per-item patients.
     *
     * @return array{order_items_count:int, samples_count:int}
     */
    private function syncOrderItems(Order $order, array $orderData, int $userId, ?CollectRequest $collectRequest): array
    {
        $orderItemsCount = 0;
        $sampleIds = [];

        foreach ($orderData['orderItems'] as $orderItemData) {
            $test = $this->findOrCreateTest($orderItemData['test']);

            // Find this order's item by server_id, otherwise create it.
            $orderItem = OrderItem::where('order_id', $order->id)
                ->where('server_id', $orderItemData['id'])
                ->first();

            if ($orderItem) {
                if ($orderItem->test_id !== $test->id) {
                    $orderItem->update(['test_id' => $test->id]);
                }
            } else {
                $orderItem = OrderItem::create([
                    'order_id' => $order->id,
                    'test_id' => $test->id,
                    'server_id' => $orderItemData['id'],
                ]);
            }

            $orderItemsCount++;

            foreach ($orderItemData['samples'] as $sampleData) {
                // The sample's own collect_request_id (server id) wins; fall back
                // to the order's collect request when the sample omits it.
                $sampleCollectRequestId = $this->resolveSampleCollectRequestId($sampleData, $collectRequest);

                $sample = $this->createOrUpdateSample($sampleData, $userId, $sampleCollectRequestId);
                $orderItem->Samples()->syncWithoutDetaching([$sample->id]);
                $sampleIds[$sample->id] = $sample->id;
            }

            foreach ($orderItemData['patients'] as $patientData) {
                $patient = $this->createOrUpdatePatient($patientData, $userId);
                $orderItem->Patients()->syncWithoutDetaching([
                    $patient->id => ['is_main' => $patientData['is_main'] ?? false],
                ]);
            }
        }

        return [
            'order_items_count' => $orderItemsCount,
            'samples_count' => count($sampleIds),
        ];
    }

    /**
     * Create or update a sample, keyed by sampleId + local sample type.
     */
    private function createOrUpdateSample(array $sampleData, int $userId, ?int $collectRequestId): Sample
    {
        $sampleType = $this->findOrCreateSampleType($sampleData['sampleType']);

        $patient = Patient::where('server_id', $sampleData['patientId'])->first();

        $sample = null;
        if (! empty($sampleData['sampleId'])) {
            $sample = Sample::where('sample_type_id', $sampleType->id)
                ->where('sampleId', $sampleData['sampleId'])
                ->first();
        }

        $attributes = [
            'sampleId' => $sampleData['sampleId'] ?? null,
            'sample_type_id' => $sampleType->id,
            'patient_id' => $patient?->id,
            'collectionDate' => $sampleData['collectionDate'] ?? null,
        ];

        // Only (re)assign the collect request when we resolved one, so a webhook
        // that omits it never clears an existing link.
        if (! is_null($collectRequestId)) {
            $attributes['collect_request_id'] = $collectRequestId;
        }

        if ($sample) {
            $sample->fill($attributes);
            if ($sample->isDirty()) {
                $sample->save();
            }

            return $sample;
        }

        return Sample::create($attributes);
    }
}
