<?php

namespace App\Http\Controllers\Webhook;

use App\Http\Controllers\Controller;
use App\Models\Material;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Patient;
use App\Models\Sample;
use App\Models\SampleType;
use App\Models\Test;
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
    /**
     * Handle incoming order import webhook
     *
     * @param Request $request
     * @return JsonResponse
     * @throws Throwable
     */
    public function import(Request $request): JsonResponse
    {
        try {
            // Validate the incoming webhook payload
            $validator = $this->validateWebhookPayload($request);

            if ($validator->fails()) {
                Log::warning('Order import webhook validation failed', [
                    'errors' => $validator->errors()->toArray(),
                    'payload' => $request->all()
                ]);

                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $data = $validator->validated();

            Log::info('Order import webhook received', [
                'order_id' => $data['order']['id'] ?? null,
                'server_id' => $data['order']['server_id'] ?? null
            ]);

            // Process the order import in a database transaction
//           = DB::transaction(function () use ($data) {
            $result = $this->processOrderImport($data);
//            });

            Log::info('Order import successful', [
                'local_order_id' => $result['order_id'],
                'server_id' => $data['order']['server_id'] ?? null
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Order imported successfully',
                'data' => [
                    'order_id' => $result['order_id'],
                    'order_items_count' => $result['order_items_count'],
                    'samples_count' => $result['samples_count']
                ]
            ], 200);

        } catch (ValidationException $e) {
            Log::error('Order import validation exception', [
                'errors' => $e->errors(),
                'message' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $e->errors()
            ], 422);

        } catch (Exception $e) {
            Log::error('Order import failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'payload' => $request->all()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to import order: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Validate the webhook payload
     *
     * @param Request $request
     * @return \Illuminate\Contracts\Validation\Validator
     */
    private function validateWebhookPayload(Request $request): \Illuminate\Contracts\Validation\Validator
    {
        return Validator::make($request->all(), [
            'order' => 'required|array',
            'order.id' => 'required|integer',
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
            'order.orderItems.*.samples.*.collectionDate' => 'required|date',

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
            // User/referrer info
            'referrer_id' => 'required|integer|exists:users,referrer_id',
        ]);
    }

    /**
     * Process the order import
     *
     * @param array $data
     * @return array
     */
    private function processOrderImport(array $data): array
    {
        $orderData = $data['order'];
        $userId = User::where("referrer_id", $data['referrer_id'])->first()->id;
        if (!$userId)
            abort(422, "data missing referrer not found");
        // Check if order already exists by server_id
        $existingOrder = Order::where('server_id', $orderData['id'])->first();

        if ($existingOrder) {
            Log::info('Order already exists, updating', [
                'local_order_id' => $existingOrder->id,
                'server_id' => $orderData['id']
            ]);

            return $this->updateExistingOrder($existingOrder, $orderData, $userId);
        }

        // Create or find main patient
        $mainPatient = $this->createOrUpdatePatient($orderData['main_patient'], $userId);

        // Create or find all patients
        $patientIds = [$mainPatient->id];
        if (!empty($orderData['patients'])) {
            foreach ($orderData['patients'] as $patientData) {
                $patient = $this->createOrUpdatePatient($patientData, $userId);
                if (!in_array($patient->id, $patientIds)) {
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
            'created_at' => Carbon::parse($orderData["created_at"] ?? now()),
            'updated_at' => Carbon::parse($orderData["updated_at"] ?? now()),
        ]);

        Log::info('Order created', ['order_id' => $order->id]);

        // Process order items
        $orderItemsCount = 0;
        $samplesCount = 0;

        foreach ($orderData['orderItems'] as $orderItemData) {
            $result = $this->createOrderItem($order, $orderItemData, $userId);
            $orderItemsCount++;
            $samplesCount += $result['samples_count'];
        }

        return [
            'order_id' => $order->id,
            'order_items_count' => $orderItemsCount,
            'samples_count' => $samplesCount
        ];
    }

    /**
     * Create or update a patient
     *
     * @param array $patientData
     * @param int $userId
     * @return Patient
     */
    private function createOrUpdatePatient(array $patientData, int $userId): Patient
    {
        // Try to find existing patient by reference_id or id_no
        $query = Patient::where('user_id', $userId);

        if (!empty($patientData['id'])) {
            $query->where('server_id', $patientData['id']);
        } elseif (!empty($patientData['reference_id'])) {
            $query->where('reference_id', $patientData['reference_id']);
        } elseif (!empty($patientData['id_no']) || !empty($patientData['idNo'])) {
            $query->where('id_no', $patientData['id_no']??$patientData['idNo']);
        } else {
            // If no unique identifier, create new patient
            $query = null;
        }

        $patient = $query ? $query->first() : null;

        $patientAttributes = [
            'user_id' => $userId,
            'server_id' => $patientData['id'],
            'fullName' => $patientData['fullName'],
            'nationality' => $patientData['nationality'],
            'dateOfBirth' => Carbon::parse($patientData['dateOfBirth'])->format('Y-m-d'),
            'gender' => $patientData['gender'],
            'reference_id' => $patientData['reference_id'] ?? null,
            'id_no' => $patientData['id_no'] ?? null,
        ];

        if ($patient) {
            $patient->update($patientAttributes);
            Log::info('Patient updated', ['patient_id' => $patient->id]);
        } else {
            $patient = Patient::create($patientAttributes);
            Log::info('Patient created', ['patient_id' => $patient->id]);
        }

        return $patient;
    }

    /**
     * Create an order item with samples and patients
     *
     * @param Order $order
     * @param array $orderItemData
     * @param int $userId
     * @return array
     */
    private function createOrderItem(Order $order, array $orderItemData, int $userId): array
    {
        $testData = $orderItemData['test'];

        // Find or create test by server_id
        $test = Test::where('server_id', $testData['id'])->first();

        if (!$test) {
            Log::warning('Test not found by server_id, creating placeholder', [
                'server_id' => $testData['server_id'],
                'test_name' => $testData['name']
            ]);

            // Create a placeholder test (should ideally be synced from server first)
            $test = Test::create([
                'server_id' => $testData['id'],
                'name' => $testData['name'],
                'code' => $testData['code'],
                'shortName' => $testData['shortName'] ?? $testData['code'],
                'gender' => $testData['gender'] ?? [],
            ]);
        }

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
            $sample = $this->createSample($sampleData, $userId);
            $orderItem->Samples()->attach($sample->id);
            $samplesCount++;
        }

        // Attach patients to order item
        foreach ($orderItemData['patients'] as $patientData) {
            $patient = $this->createOrUpdatePatient($patientData, $userId);
            $orderItem->Patients()->attach($patient->id, [
                'is_main' => $patientData['is_main'] ?? false
            ]);
        }

        return [
            'order_item_id' => $orderItem->id,
            'samples_count' => $samplesCount
        ];
    }

    /**
     * Create a sample
     *
     * @param array $sampleData
     * @param int $userId
     * @return Sample
     */
    private function createSample(array $sampleData, int $userId): Sample
    {
        $sampleTypeData = $sampleData['sampleType'];

        // Find sample type by server_id
        $sampleType = SampleType::where('server_id', $sampleTypeData['id'])->first();
        $patient = Patient::where('server_id', $sampleData['patientId'])->first();

        if (!$sampleType) {
            Log::warning('Sample type not found by server_id', [
                'server_id' => $sampleTypeData['server_id'],
                'sample_type_name' => $sampleTypeData['name']
            ]);

            // Create placeholder sample type
            $sampleType = SampleType::create([
                'server_id' => $sampleTypeData['server_id'],
                'name' => $sampleTypeData['name'],
                'sample_id_required' => $sampleTypeData['sample_id_required'] ?? false,
            ]);
        }

        // Find material by barcode if provided
        $materialId = null;
        if (!empty($sampleData['barcode'])) {
            $material = Material::where('barcode', $sampleData['barcode'])->first();
            if ($material) {
                $materialId = $material->id;
            }
        }

        $query = Sample::where("sample_type_id", $sampleType->id);

        if (isset($sampleData['sampleId'])) {
            $query->where('sampleId', $sampleData['sampleId']);
        } else
            $query = null;
        $sample = null;
        if ($query)
            $sample = $query->first();
        if (!$sample)
            // Create sample
            $sample = Sample::create([
                'sampleId' => $sampleData['sampleId'] ?? null,
                'sample_type_id' => $sampleType->id,
                'material_id' => $materialId,
                'patient_id' => $patient?->id ?? null,
                'collectionDate' => $sampleData['collectionDate'] ?? null,
            ]);

        Log::info('Sample created', ['sample_id' => $sample->id]);

        return $sample;
    }

    /**
     * Update existing order
     *
     * @param Order $order
     * @param array $orderData
     * @param int $userId
     * @return array
     */
    private function updateExistingOrder(Order $order, array $orderData, int $userId): array
    {
        // Update order status and other fields
        $order->update([
            'status' => $orderData['status'],
        ]);

        Log::info('Order updated', ['order_id' => $order->id]);

        // Count existing items and samples
        $orderItemsCount = $order->OrderItems()->count();
        $samplesCount = $order->OrderItems()->with('Samples')->get()->sum(function ($item) {
            return $item->Samples->count();
        });

        return [
            'order_id' => $order->id,
            'order_items_count' => $orderItemsCount,
            'samples_count' => $samplesCount
        ];
    }
}
