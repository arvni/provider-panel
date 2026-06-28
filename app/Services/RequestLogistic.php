<?php

namespace App\Services;

use App\Exceptions\ApiServiceException;
use App\Models\CollectRequest;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Patient;
use App\Models\Sample;
use Carbon\Carbon;
use Exception;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Service for sending logistic collection requests to the main server
 *
 * This service handles the preparation and transmission of collect requests
 * including order data, patient information, samples, tests, and associated files.
 */
class RequestLogistic
{
    private const REQUEST_TIMEOUT = 180;

    private const MAX_FILE_SIZE = 30485760; // ~30MB in bytes

    /**
     * Send a collect request to the main server
     *
     * @throws ApiServiceException
     */
    public static function send(CollectRequest $collectRequest): Response
    {
        try {
            // Load all necessary relationships in a single query
            // Derive the orders to send from the samples tagged to THIS request,
            // not from orders.collect_request_id. An order holds a single
            // collect_request_id, but per-sample selection can split one order's
            // samples across several requests; resolving via samples keeps each
            // request sending exactly its own samples.
            $orders = Order::whereHas('OrderItems.Samples', function ($query) use ($collectRequest) {
                $query->where('samples.collect_request_id', $collectRequest->id);
            })
                ->with([
                    'OrderItems.Test',
                    'OrderItems.Patients',
                    'OrderItems.Samples' => function ($query) use ($collectRequest) {
                        $query->where('samples.collect_request_id', $collectRequest->id)
                            ->with(['SampleType', 'Material']);
                    },
                    'Patient',
                    'Tests',
                ])
                ->get();

            $collectRequest->setRelation('Orders', $orders);
            $collectRequest->load('User');

            // Validate the collect request
            self::validateCollectRequest($collectRequest);

            // Build the multipart request
            $request = self::buildMultipartRequest();

            // Prepare and attach order data
            $ordersData = self::prepareOrdersData($collectRequest);

            // Attach files for each order
            self::attachOrderFiles($request, $collectRequest->Orders, $ordersData);

            // Attach the main JSON data
            $jsonData = self::prepareMainPayload($collectRequest, $ordersData);
            $request->attach('data', json_encode($jsonData), 'data.json');

            // Build the target URL
            $url = self::buildRequestUrl($collectRequest->User->referrer_id);

            // Send the request with logging
            Log::info('Sending logistic request', [
                'collect_request_id' => $collectRequest->id,
                'orders_count' => $collectRequest->Orders->count(),
                'referrer_id' => $collectRequest->User->referrer_id,
            ]);

            $response = $request->post($url);

            if (! $response->successful()) {
                Log::error('Logistic request failed', [
                    'collect_request_id' => $collectRequest->id,
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);

                throw new ApiServiceException(
                    "Logistic request failed with status {$response->status()}: {$response->body()}",
                    $response->status()
                );
            }
            $collectRequest->update(['server_id' => $response->json('id')]);
            Log::info('Logistic request successful', [
                'collect_request_id' => $collectRequest->id,
                'response_status' => $response->status(),
            ]);

            return $response;

        } catch (ApiServiceException $e) {

            throw $e;
        } catch (Exception $e) {
            Log::error('Unexpected error in logistic request', [
                'collect_request_id' => $collectRequest->id ?? null,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            throw new ApiServiceException(
                "Failed to send logistic request: {$e->getMessage()}",
                500,
                $e
            );
        }
    }

    /**
     * Validate the collect request before sending
     *
     * @throws ApiServiceException
     */
    private static function validateCollectRequest(CollectRequest $collectRequest): void
    {
        if (! $collectRequest->User || ! $collectRequest->User->referrer_id) {
            throw new ApiServiceException('Collect request user or referrer_id is missing', 400);
        }

        if ($collectRequest->Orders->isEmpty()) {
            throw new ApiServiceException('Collect request has no orders', 400);
        }

        foreach ($collectRequest->Orders as $order) {
            if (! $order->Patient) {
                throw new ApiServiceException("Order {$order->id} has no patient assigned", 400);
            }

            if ($order->OrderItems->isEmpty()) {
                throw new ApiServiceException("Order {$order->id} has no order items", 400);
            }

            // Validate that all tests have server_id
            foreach ($order->Tests as $test) {
                if (! $test->server_id) {
                    throw new ApiServiceException(
                        "Test '{$test->name}' (ID: {$test->id}) in order {$order->id} has no server_id",
                        400
                    );
                }
            }

            // Validate that all samples have required data
            foreach ($order->OrderItems as $orderItem) {
                foreach ($orderItem->Samples as $sample) {
                    if (! $sample->SampleType) {
                        throw new ApiServiceException(
                            "Sample {$sample->id} in order {$order->id} has no sample type",
                            400
                        );
                    }
                    if (! $sample->SampleType->server_id) {
                        throw new ApiServiceException(
                            "Sample type '{$sample->SampleType->name}' has no server_id",
                            400
                        );
                    }
                }
            }
        }
    }

    /**
     * Build the authenticated multipart HTTP request
     *
     * @throws ApiServiceException
     */
    private static function buildMultipartRequest(): PendingRequest
    {
        return Http::withToken(ApiService::getApiToken())
            ->timeout(self::REQUEST_TIMEOUT)
            ->asMultipart();
    }

    /**
     * Prepare orders data for the request
     */
    private static function prepareOrdersData(CollectRequest $collectRequest): array
    {
        $ordersData = [];

        foreach ($collectRequest->Orders as $order) {
            $orderId = self::generateOrderId($order);

            $ordersData[$orderId] = [
                'order' => $order,
                'data' => self::prepareOrderData($order),
            ];
        }

        return $ordersData;
    }

    /**
     * Generate a standardized order ID
     */
    private static function generateOrderId(Order $order): string
    {
        return 'OR'.Carbon::parse($order->created_at)->format('.Ymd.').$order->id;
    }

    /**
     * Prepare individual order data
     */
    private static function prepareOrderData(Order $order): array
    {
        // Items whose samples are not part of this collect request were filtered
        // out at load time, so skip any that have no samples left to send.
        $orderItems = $order->OrderItems
            ->filter(fn ($orderItem) => $orderItem->Samples->isNotEmpty())
            ->map(fn (OrderItem $orderItem) => self::prepareOrderItemData($orderItem))
            ->values()
            ->toArray();

        $orderForms = collect($order->orderForms ?? [])
            ->mapWithKeys(fn ($item) => [$item['name'] => $item['formData'] ?? []])
            ->toArray();

        // Whether any sample in the order is pooled.
        $pooling = $order->OrderItems->pluck('Samples')->flatten()->contains('pooling', true);

        return [
            'id' => $order->id,
            'server_id' => $order->server_id,
            'status' => $order->status->value,
            'step' => $order->step->value,
            'pooling' => $pooling,
            'orderForms' => $orderForms,
            'consents' => $order->consents ?? [],
            'patient' => self::prepareMainPatientData($order->Patient),
            'patients' => self::prepareOrderPatients($order),
            'patient_ids' => $order->patient_ids ?? [],
            'main_patient_id' => $order->main_patient_id,
            'tests' => self::prepareTestsData($order),
            'orderItems' => $orderItems,
            'created_at' => $order->created_at,
            'updated_at' => $order->updated_at,
        ];
    }

    /**
     * Shape a single order item (its test, samples and patients) for the payload.
     */
    private static function prepareOrderItemData(OrderItem $orderItem): array
    {
        return [
            'id' => $orderItem->id,
            'server_id' => $orderItem->server_id,
            'test_id' => $orderItem->Test->server_id ?? $orderItem->test_id,
            'test' => $orderItem->Test ? [
                'id' => $orderItem->Test->id,
                'server_id' => $orderItem->Test->server_id,
                'name' => $orderItem->Test->name,
                'code' => $orderItem->Test->code,
                'shortName' => $orderItem->Test->shortName,
                'gender' => $orderItem->Test->gender,
            ] : null,
            'samples' => $orderItem->Samples->map(fn (Sample $sample) => self::prepareSampleData($sample))->toArray(),
            'patients' => $orderItem->Patients->map(fn (Patient $patient) => [
                'id' => $patient->id,
                'fullName' => $patient->fullName,
                'nationality' => $patient->nationality,
                'dateOfBirth' => $patient->dateOfBirth,
                'gender' => $patient->gender,
                'consanguineousParents' => $patient->consanguineousParents,
                'contact' => $patient->contact,
                'isFetus' => $patient->isFetus,
                'reference_id' => $patient->reference_id,
                'id_no' => $patient->id_no,
                'is_main' => $patient->pivot->is_main ?? false,
            ])->toArray(),
        ];
    }

    /**
     * Shape a single sample (with its sample type and material) for the payload.
     */
    private static function prepareSampleData(Sample $sample): array
    {
        return [
            'id' => $sample->id,
            'sampleId' => $sample->sampleId,
            'sample_type_id' => $sample->SampleType->server_id ?? null,
            'material_id' => $sample->material_id,
            'collectionDate' => $sample->collectionDate,
            'sample_type' => $sample->SampleType ? [
                'id' => $sample->SampleType->id,
                'server_id' => $sample->SampleType->server_id,
                'name' => $sample->SampleType->name,
                'sample_id_required' => $sample->SampleType->sample_id_required,
            ] : null,
            'material' => $sample->Material ? [
                'id' => $sample->Material->id,
                'barcode' => $sample->Material->barcode,
            ] : null,
        ];
    }

    /**
     * Shape the order's main patient for the payload.
     */
    private static function prepareMainPatientData(Patient $patient): array
    {
        return [
            'id' => $patient->id,
            'fullName' => $patient->fullName,
            'nationality' => $patient->nationality,
            'dateOfBirth' => $patient->dateOfBirth,
            'gender' => $patient->gender,
            'consanguineousParents' => $patient->consanguineousParents,
            'contact' => $patient->contact,
            'extra' => $patient->extra ?? null,
            'isFetus' => $patient->isFetus,
            'reference_id' => $patient->reference_id,
            'id_no' => $patient->id_no,
        ];
    }

    /**
     * Shape every patient referenced by the order (flagging the main one).
     */
    private static function prepareOrderPatients(Order $order): array
    {
        if (empty($order->patient_ids)) {
            return [];
        }

        return Patient::whereIn('id', $order->patient_ids)->get()
            ->map(fn (Patient $patient) => [
                'id' => $patient->id,
                'fullName' => $patient->fullName,
                'nationality' => $patient->nationality,
                'dateOfBirth' => $patient->dateOfBirth,
                'gender' => $patient->gender,
                'consanguineousParents' => $patient->consanguineousParents,
                'contact' => $patient->contact,
                'extra' => $patient->extra ?? null,
                'isFetus' => $patient->isFetus,
                'reference_id' => $patient->reference_id,
                'id_no' => $patient->id_no,
                'is_main' => $patient->id === $order->main_patient_id,
            ])->toArray();
    }

    /**
     * Shape the order's tests (with their server IDs) for the payload.
     */
    private static function prepareTestsData(Order $order): array
    {
        return $order->Tests->map(fn ($test) => [
            'id' => $test->id,
            'server_id' => $test->server_id,
            'name' => $test->name,
            'shortName' => $test->shortName,
        ])->toArray();
    }

    /**
     * Attach files for all orders to the request
     *
     * @param  Collection  $orders
     */
    private static function attachOrderFiles(PendingRequest $request, $orders, array $ordersData): void
    {
        foreach ($orders as $order) {
            $orderId = self::generateOrderId($order);
            $fileCounter = 0;

            // Attach regular order files
            if (! empty($order->files) && is_array($order->files)) {
                $fileCounter = self::attachFiles(
                    $request,
                    $order->files,
                    $orderId,
                    $fileCounter,
                    'order files'
                );
            }

            // Attach consent form files
            if (isset($order->consents['consentForm']) && is_array($order->consents['consentForm'])) {
                self::attachFiles(
                    $request,
                    $order->consents['consentForm'],
                    $orderId,
                    $fileCounter,
                    'consent forms'
                );
            }
        }
    }

    /**
     * Attach files to the request
     *
     * @return int New counter value
     */
    private static function attachFiles(
        PendingRequest $request,
        array $files,
        string $orderId,
        int $counter,
        string $fileType
    ): int {
        foreach ($files as $filePath) {
            try {
                $fullPath = storage_path("app/{$filePath}");

                // Check if file exists
                if (! file_exists($fullPath)) {
                    Log::warning("File not found for order {$orderId}", [
                        'file_path' => $filePath,
                        'file_type' => $fileType,
                    ]);

                    continue;
                }

                // Check file size
                $fileSize = filesize($fullPath);
                if ($fileSize > self::MAX_FILE_SIZE) {
                    Log::warning("File too large for order {$orderId}", [
                        'file_path' => $filePath,
                        'size' => $fileSize,
                        'max_size' => self::MAX_FILE_SIZE,
                    ]);

                    continue;
                }

                // Check if file is readable
                if (! is_readable($fullPath)) {
                    Log::warning("File not readable for order {$orderId}", [
                        'file_path' => $filePath,
                    ]);

                    continue;
                }

                // Read file contents
                $fileContents = file_get_contents($fullPath);
                if ($fileContents === false) {
                    Log::warning("Failed to read file for order {$orderId}", [
                        'file_path' => $filePath,
                    ]);

                    continue;
                }

                // Attach to request
                $fileName = basename($fullPath);
                $request->attach("file[{$orderId}][{$counter}]", $fileContents, $fileName);

                $counter++;

            } catch (Exception $e) {
                Log::error("Error attaching file for order {$orderId}", [
                    'file_path' => $filePath,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        return $counter;
    }

    /**
     * Prepare the main payload for the request
     */
    private static function prepareMainPayload(CollectRequest $collectRequest, array $ordersData): array
    {
        // Extract only the data part from ordersData
        $orders = [];
        foreach ($ordersData as $orderId => $orderInfo) {
            $orders[$orderId] = $orderInfo['data'];
        }

        // Prepare collect request details
        $details = $collectRequest->details ?? [];

        return [
            'id' => $collectRequest->id,
            'status' => $collectRequest->status->value,
            'details' => $details,
            'address' => $details['address'] ?? null,
            'phone' => $details['phone'] ?? null,
            'collection_date' => $details['collection_date'] ?? $collectRequest->preferred_date ?? null,
            'collection_time' => $details['collection_time'] ?? null,
            'preferred_date' => $collectRequest->preferred_date,
            'notes' => $collectRequest->notes,
            'user' => [
                'id' => $collectRequest->User->id,
                'name' => $collectRequest->User->name,
                'email' => $collectRequest->User->email,
                'referrer_id' => $collectRequest->User->referrer_id,
            ],
            'orders' => $orders,
            'created_at' => $collectRequest->created_at,
            'updated_at' => $collectRequest->updated_at,
        ];
    }

    /**
     * Build the request URL
     */
    private static function buildRequestUrl(int $referrerId): string
    {
        $baseUrl = config('api.server_url');
        $logisticPath = config('api.logistic_request');

        return rtrim($baseUrl, '/').'/'.trim($logisticPath, '/').'/'.$referrerId;
    }
}
