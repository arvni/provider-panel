<?php

namespace App\Http\Controllers\Webhook;

use App\Enums\OrderStatus;
use App\Http\Controllers\Controller;
use App\Http\Controllers\Webhook\Concerns\HandlesCollectRequests;
use App\Models\CollectRequest;
use App\Models\Material;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Patient;
use App\Models\Sample;
use App\Models\User;
use Carbon\Carbon;
use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;
use Throwable;

/**
 * Controller for handling order import webhooks from the main server
 */
class OrderImportController extends Controller
{
    use HandlesCollectRequests;

    /**
     * Handle incoming order import webhook
     *
     * @throws Throwable
     */
    public function import(Request $request): JsonResponse
    {
        // Signature is verified upstream by the verify.webhook middleware.
        try {
            // Validate the incoming webhook payload
            $validator = $this->validateWebhookPayload($request);

            if ($validator->fails()) {
                Log::warning('Order import webhook validation failed', [
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

            Log::info('Order import webhook received', [
                'order_id' => $data['order']['id'] ?? null,
                'server_id' => $data['order']['server_id'] ?? null,
            ]);

            // Process the order import in a database transaction
            $result = DB::transaction(function () use ($data) {
                return $this->processOrderImport($data);
            });

            Log::info('Order import successful', [
                'local_order_id' => $result['order_id'],
                'server_id' => $data['order']['server_id'] ?? null,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Order imported successfully',
                'data' => [
                    'order_id' => $result['order_id'],
                    'order_items_count' => $result['order_items_count'],
                    'samples_count' => $result['samples_count'],
                ],
            ], 200);

        } catch (ValidationException $e) {
            Log::error('Order import validation exception', [
                'errors' => $e->errors(),
                'message' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $e->errors(),
            ], 422);

        } catch (Exception $e) {
            Log::error('Order import failed', [
                'error' => $e->getMessage(),
                'order_id' => $request->input('order.id'),
                'server_id' => $request->input('order.server_id'),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to import order',
            ], 500);
        }
    }

    /**
     * Validate the webhook payload
     */
    private function validateWebhookPayload(Request $request): \Illuminate\Contracts\Validation\Validator
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
            'order.patients.*.id' => 'required|string',
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
            'order.orderItems.*.patients.*.id' => 'required|string',
            'order.orderItems.*.patients.*.nationality' => 'required|string',
            'order.orderItems.*.patients.*.dateOfBirth' => 'required|date',
            'order.orderItems.*.patients.*.gender' => 'required|in:-1,0,1',
            'order.orderItems.*.patients.*.fullName' => 'required|string',
            'order.orderItems.*.patients.*.is_main' => 'required|boolean',
            'order.created_at' => 'nullable',
            'order.updated_at' => 'nullable',

            // Optional collect request block (id is the collect request's server id)
            'collect_request' => 'nullable|array',
            'collect_request.id' => 'required_with:collect_request|integer',
            'collect_request.status' => 'required_with:collect_request|string',
            'collect_request.barcode' => 'nullable|string',
            'collect_request.preferred_date' => 'nullable|date',
            'collect_request.logistic_information' => 'nullable|array',
            'collect_request.sample_collector' => 'nullable|array',

            // User/referrer info
            'referrer_id' => 'required|integer|exists:users,referrer_id',
        ]);
    }

    /**
     * Process the order import
     */
    private function processOrderImport(array $data): array
    {
        $orderData = $data['order'];
        $userId = User::where('referrer_id', $data['referrer_id'])->first()->id;
        if (! $userId) {
            abort(422, 'data missing referrer not found');
        }

        // Upsert the collect request up front (existence check by server_id,
        // create if missing) so each sample can resolve its own collect request.
        $collectRequest = ! empty($data['collect_request'])
            ? $this->upsertCollectRequest($data['collect_request'], $userId)
            : null;

        // Match by server_id, falling back to the provider's own order id carried
        // back as referrer_order_id (a provider-originated order may not have its
        // server_id stamped yet) so we never create a duplicate.
        $existingOrder = Order::where('server_id', $orderData['id'])->first();

        if (! $existingOrder && ! empty($orderData['referrer_order_id'])) {
            $existingOrder = Order::where('id', $orderData['referrer_order_id'])
                ->where('user_id', $userId)
                ->first();
        }

        if ($existingOrder) {
            Log::info('Order already exists, updating', [
                'local_order_id' => $existingOrder->id,
                'server_id' => $orderData['id'],
            ]);

            $result = $this->updateExistingOrder($existingOrder, $orderData, $userId);

            if ($collectRequest) {
                // Update path does not re-create samples, so tag the order's
                // existing samples (those not already on another request).
                $this->linkCollectRequest($existingOrder, $collectRequest, tagSamples: true);
            }

            return $result;
        }

        // Create or find main patient
        $mainPatient = $this->createOrUpdatePatient($orderData['main_patient'], $userId);

        // Create or find all patients
        $patientIds = [$mainPatient->id];
        if (! empty($orderData['patients'])) {
            foreach ($orderData['patients'] as $patientData) {
                $patient = $this->createOrUpdatePatient($patientData, $userId);
                if (! in_array($patient->id, $patientIds)) {
                    $patientIds[] = $patient->id;
                }
            }
        }

        // Create the order
        $order = Order::create([
            'user_id' => $userId,
            'server_id' => $orderData['id'],
            'status' => $orderData['status'],
            'step' => 'finalize',
            'orderForms' => $orderData['orderForms'] ?? [],
            'consents' => $orderData['consents'] ?? [],
            'files' => [],
            'main_patient_id' => $mainPatient->id,
            'patient_ids' => $patientIds,
            'created_at' => Carbon::parse($orderData['created_at'] ?? now()),
            'updated_at' => Carbon::parse($orderData['updated_at'] ?? now()),
            'sent_at' => $orderData['status'] === OrderStatus::SENT->value ? now() : null,
            'reported_at' => $orderData['status'] === OrderStatus::REPORTED->value ? now() : null,
        ]);

        Log::info('Order created', ['order_id' => $order->id]);

        // Process order items
        $orderItemsCount = 0;
        $samplesCount = 0;

        foreach ($orderData['orderItems'] as $orderItemData) {
            $result = $this->createOrderItem($order, $orderItemData, $userId, $collectRequest);
            $orderItemsCount++;
            $samplesCount += $result['samples_count'];
        }

        // Samples were tagged per-sample during creation; just link the order.
        if ($collectRequest) {
            $this->linkCollectRequest($order, $collectRequest, tagSamples: false);
        }

        return [
            'order_id' => $order->id,
            'order_items_count' => $orderItemsCount,
            'samples_count' => $samplesCount,
        ];
    }

    /**
     * Create an order item with samples and patients
     */
    private function createOrderItem(Order $order, array $orderItemData, int $userId, ?CollectRequest $collectRequest = null): array
    {
        $test = $this->findOrCreateTest($orderItemData['test']);

        // Create order item
        $orderItem = OrderItem::create([
            'order_id' => $order->id,
            'test_id' => $test->id,
            'server_id' => $orderItemData['id'],
        ]);

        Log::info('Order item created', ['order_item_id' => $orderItem->id]);

        // Attach samples to order item
        $samplesCount = 0;
        foreach ($orderItemData['samples'] as $sampleData) {
            // The sample's own collect_request_id (server id) wins; fall back to
            // the order's collect request when the sample omits it.
            $sampleCollectRequestId = $this->resolveSampleCollectRequestId($sampleData, $collectRequest);
            $sample = $this->createSample($sampleData, $userId, $sampleCollectRequestId);
            $orderItem->Samples()->syncWithoutDetaching([$sample->id]);
            $samplesCount++;
        }

        // Attach patients to order item
        foreach ($orderItemData['patients'] as $patientData) {
            $patient = $this->createOrUpdatePatient($patientData, $userId);
            $orderItem->Patients()->attach($patient->id, [
                'is_main' => $patientData['is_main'] ?? false,
            ]);
        }

        return [
            'order_item_id' => $orderItem->id,
            'samples_count' => $samplesCount,
        ];
    }

    /**
     * Create a sample
     */
    private function createSample(array $sampleData, int $userId, ?int $collectRequestId = null): Sample
    {
        $sampleType = $this->findOrCreateSampleType($sampleData['sampleType']);
        $patient = Patient::where('server_id', $sampleData['patientId'])->first();

        // Find material by barcode if provided. LIS carries the sample barcode
        // in the `sampleId` field, so match the material against that.
        $materialId = null;
        if (! empty($sampleData['sampleId'])) {
            $material = Material::where('barcode', $sampleData['sampleId'])->first();
            if ($material) {
                $materialId = $material->id;
            }
        }

        $query = Sample::where('sample_type_id', $sampleType->id);

        if (isset($sampleData['sampleId'])) {
            $query->where('sampleId', $sampleData['sampleId']);
        } else {
            $query = null;
        }
        $sample = null;
        if ($query) {
            $sample = $query->first();
        }
        if (! $sample) {
            // Create sample
            $sample = Sample::create([
                'sampleId' => $sampleData['sampleId'] ?? null,
                'sample_type_id' => $sampleType->id,
                'material_id' => $materialId,
                'patient_id' => $patient?->id ?? null,
                'collectionDate' => $sampleData['collectionDate'] ?? null,
                'collect_request_id' => $collectRequestId,
            ]);
        } elseif (! is_null($collectRequestId) && $sample->collect_request_id !== $collectRequestId) {
            // Keep an existing sample's collect request in sync.
            $sample->update(['collect_request_id' => $collectRequestId]);
        }

        Log::info('Sample created', ['sample_id' => $sample->id]);

        return $sample;
    }

    /**
     * Update existing order
     */
    private function updateExistingOrder(Order $order, array $orderData, int $userId): array
    {
        // Stamp the server_id so a provider-originated order matched via
        // referrer_order_id is matchable by server_id from now on.
        $updateFields = [
            'status' => $orderData['status'],
            'server_id' => $orderData['id'],
        ];

        if ($orderData['status'] === OrderStatus::SENT->value && is_null($order->sent_at)) {
            $updateFields['sent_at'] = now();
        }

        if ($orderData['status'] === OrderStatus::REPORTED->value && is_null($order->reported_at)) {
            $updateFields['reported_at'] = now();
        }

        // Update order status and other fields
        $order->update($updateFields);

        Log::info('Order updated', ['order_id' => $order->id]);

        // Count existing items and samples
        $orderItemsCount = $order->OrderItems()->count();
        $samplesCount = $order->OrderItems()->with('Samples')->get()->sum(function ($item) {
            return $item->Samples->count();
        });

        return [
            'order_id' => $order->id,
            'order_items_count' => $orderItemsCount,
            'samples_count' => $samplesCount,
        ];
    }
}
