<?php

namespace App\Services;

use App\Exceptions\ApiServiceException;
use App\Models\CollectRequest;
use App\Models\Order;
use App\Models\Patient;
use Carbon\Carbon;
use Exception;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\DB;
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
     * @param CollectRequest $collectRequest
     * @return Response
     * @throws ApiServiceException
     */
    public static function send(CollectRequest $collectRequest): Response
    {
        try {
            // Load all necessary relationships in a single query
            $collectRequest->load([
                'Orders.OrderItems.Samples.SampleType',
                'Orders.OrderItems.Samples.Material',
                'Orders.OrderItems.Test',
                'Orders.OrderItems.Patients',
                'Orders.Patient',
                'Orders.Tests',
                'User'
            ]);

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
                'referrer_id' => $collectRequest->User->referrer_id
            ]);

            $response = $request->post($url);

            if (!$response->successful()) {
                Log::error('Logistic request failed', [
                    'collect_request_id' => $collectRequest->id,
                    'status' => $response->status(),
                    'body' => $response->body()
                ]);

                throw new ApiServiceException(
                    "Logistic request failed with status {$response->status()}: {$response->body()}",
                    $response->status()
                );
            }
            $collectRequest->update(["server_id" => $response->json('id')]);
            Log::info('Logistic request successful', [
                'collect_request_id' => $collectRequest->id,
                'response_status' => $response->status()
            ]);

            return $response;

        } catch (ApiServiceException $e) {

            throw $e;
        } catch (Exception $e) {
            Log::error('Unexpected error in logistic request', [
                'collect_request_id' => $collectRequest->id ?? null,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
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
     * @param CollectRequest $collectRequest
     * @throws ApiServiceException
     */
    private static function validateCollectRequest(CollectRequest $collectRequest): void
    {
        if (!$collectRequest->User || !$collectRequest->User->referrer_id) {
            throw new ApiServiceException('Collect request user or referrer_id is missing', 400);
        }

        if ($collectRequest->Orders->isEmpty()) {
            throw new ApiServiceException('Collect request has no orders', 400);
        }

        foreach ($collectRequest->Orders as $order) {
            if (!$order->Patient) {
                throw new ApiServiceException("Order {$order->id} has no patient assigned", 400);
            }

            if ($order->OrderItems->isEmpty()) {
                throw new ApiServiceException("Order {$order->id} has no order items", 400);
            }

            // Validate that all tests have server_id
            foreach ($order->Tests as $test) {
                if (!$test->server_id) {
                    throw new ApiServiceException(
                        "Test '{$test->name}' (ID: {$test->id}) in order {$order->id} has no server_id",
                        400
                    );
                }
            }

            // Validate that all samples have required data
            foreach ($order->OrderItems as $orderItem) {
                foreach ($orderItem->Samples as $sample) {
                    if (!$sample->SampleType) {
                        throw new ApiServiceException(
                            "Sample {$sample->id} in order {$order->id} has no sample type",
                            400
                        );
                    }
                    if (!$sample->SampleType->server_id) {
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
     * @return PendingRequest
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
     *
     * @param CollectRequest $collectRequest
     * @return array
     */
    private static function prepareOrdersData(CollectRequest $collectRequest): array
    {
        $ordersData = [];

        foreach ($collectRequest->Orders as $order) {
            $orderId = self::generateOrderId($order);

            $ordersData[$orderId] = [
                'order' => $order,
                'data' => self::prepareOrderData($order)
            ];
        }

        return $ordersData;
    }

    /**
     * Generate a standardized order ID
     *
     * @param Order $order
     * @return string
     */
    private static function generateOrderId(Order $order): string
    {
        return 'OR' . Carbon::parse($order->created_at)->format('.Ymd.') . $order->id;
    }

    /**
     * Prepare individual order data
     *
     * @param Order $order
     * @return array
     */
    private static function prepareOrderData(Order $order): array
    {
        // Prepare order items with samples and patients
        $orderItems = $order->OrderItems->map(function ($orderItem) {
            // Get samples for this order item
            $samples = $orderItem->Samples->map(function ($sample) {
                return [
                    'id' => $sample->id,
                    'sampleId' => $sample->sampleId,
                    'sample_type_id' => $sample->SampleType->server_id ?? null,
                    'material_id' => $sample->material_id,
                    'sampleType' => $sample->SampleType ? [
                        'id' => $sample->SampleType->server_id,
                        'name' => $sample->SampleType->name,
                        'sample_id_required' => $sample->SampleType->sample_id_required,
                    ] : null,
                    'material' => $sample->Material ? [
                        'id' => $sample->Material->id,
                        'barcode' => $sample->Material->barcode,
                    ] : null,
                ];
            })->toArray();

            // Get patients for this order item
            $patients = $orderItem->Patients->map(function ($patient) {
                return [
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
                ];
            })->toArray();

            return [
                'id' => $orderItem->id,
                'server_id' => $orderItem->server_id,
                'test_id' => $orderItem->Test->server_id ?? $orderItem->test_id,
                'test' => $orderItem->Test ? [
                    'id' => $orderItem->Test->server_id,
                    'name' => $orderItem->Test->name,
                    'code' => $orderItem->Test->code,
                    'shortName' => $orderItem->Test->shortName,
                    'gender' => $orderItem->Test->gender,
                ] : null,
                'samples' => $samples,
                'patients' => $patients,
            ];
        })->toArray();

        // Process order forms
        $orderForms = collect($order->orderForms ?? [])
            ->mapWithKeys(function ($item) {
                return [$item['name'] => $item['formData'] ?? []];
            })
            ->toArray();

        // Prepare main patient data
        $patientData = [
            'id' => $order->Patient->id,
            'fullName' => $order->Patient->fullName,
            'nationality' => $order->Patient->nationality,
            'dateOfBirth' => $order->Patient->dateOfBirth,
            'gender' => $order->Patient->gender,
            'consanguineousParents' => $order->Patient->consanguineousParents,
            'contact' => $order->Patient->contact,
            'extra' => $order->Patient->extra ?? null,
            'isFetus' => $order->Patient->isFetus,
            'reference_id' => $order->Patient->reference_id,
            'id_no' => $order->Patient->id_no,
        ];

        // Prepare all patients in the order
        $allPatients = [];
        if (!empty($order->patient_ids)) {
            $patients = Patient::whereIn('id', $order->patient_ids)->get();
            $allPatients = $patients->map(function ($patient) use ($order) {
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
                    'is_main' => $patient->id === $order->main_patient_id,
                ];
            })->toArray();
        }

        // Prepare tests data with server IDs
        $testsData = $order->Tests->map(function ($test) {
            return [
                'id' => $test->server_id,
                'local_id' => $test->id,
                'name' => $test->name,
                'code' => $test->code,
                'shortName' => $test->shortName,
                'gender' => $test->gender,
                'description' => $test->description,
                'turnaroundTime' => $test->turnaroundTime,
            ];
        })->toArray();

        return [
            'id' => $order->id,
            'server_id' => $order->server_id,
            'status' => $order->status->value,
            'step' => $order->step->value,
            'orderForms' => $orderForms,
            'consents' => $order->consents ?? [],
            'patient' => $patientData,
            'patients' => $allPatients,
            'patient_ids' => $order->patient_ids ?? [],
            'main_patient_id' => $order->main_patient_id,
            'tests' => $testsData,
            'orderItems' => $orderItems,
            'created_at' => $order->created_at,
            'updated_at' => $order->updated_at,
        ];
    }

    /**
     * Attach files for all orders to the request
     *
     * @param PendingRequest $request
     * @param Collection $orders
     * @param array $ordersData
     * @return void
     */
    private static function attachOrderFiles(PendingRequest $request, $orders, array $ordersData): void
    {
        foreach ($orders as $order) {
            $orderId = self::generateOrderId($order);
            $fileCounter = 0;

            // Attach regular order files
            if (!empty($order->files) && is_array($order->files)) {
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
     * @param PendingRequest $request
     * @param array $files
     * @param string $orderId
     * @param int $counter
     * @param string $fileType
     * @return int New counter value
     */
    private static function attachFiles(
        PendingRequest $request,
        array          $files,
        string         $orderId,
        int            $counter,
        string         $fileType
    ): int
    {
        foreach ($files as $filePath) {
            try {
                $fullPath = storage_path("app/{$filePath}");

                // Check if file exists
                if (!file_exists($fullPath)) {
                    Log::warning("File not found for order {$orderId}", [
                        'file_path' => $filePath,
                        'file_type' => $fileType
                    ]);
                    continue;
                }

                // Check file size
                $fileSize = filesize($fullPath);
                if ($fileSize > self::MAX_FILE_SIZE) {
                    Log::warning("File too large for order {$orderId}", [
                        'file_path' => $filePath,
                        'size' => $fileSize,
                        'max_size' => self::MAX_FILE_SIZE
                    ]);
                    continue;
                }

                // Check if file is readable
                if (!is_readable($fullPath)) {
                    Log::warning("File not readable for order {$orderId}", [
                        'file_path' => $filePath
                    ]);
                    continue;
                }

                // Read file contents
                $fileContents = file_get_contents($fullPath);
                if ($fileContents === false) {
                    Log::warning("Failed to read file for order {$orderId}", [
                        'file_path' => $filePath
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
                    'error' => $e->getMessage()
                ]);
            }
        }

        return $counter;
    }

    /**
     * Prepare the main payload for the request
     *
     * @param CollectRequest $collectRequest
     * @param array $ordersData
     * @return array
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
     *
     * @param int $referrerId
     * @return string
     */
    private static function buildRequestUrl(int $referrerId): string
    {
        $baseUrl = config('api.server_url');
        $logisticPath = config('api.logistic_request');

        return rtrim($baseUrl, '/') . '/' . trim($logisticPath, '/') . '/' . $referrerId;
    }
}
