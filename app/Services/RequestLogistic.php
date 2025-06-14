<?php

namespace App\Services;

use App\Exceptions\ApiServiceException;
use App\Models\CollectRequest;
use Carbon\Carbon;
use Exception;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class RequestLogistic
{
    private const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB per file
    private const ALLOWED_FILE_EXTENSIONS = ['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx'];

    /**
     * Send collect request to logistics API
     *
     * @param CollectRequest $collectRequest
     * @return Response
     * @throws ApiServiceException
     */
    public static function send(CollectRequest $collectRequest): Response
    {
        try {
            // Load necessary relationships
            $collectRequest->load([
                'Orders.Samples.SampleType',
                'Orders.Tests',
                'Orders.Patient',
                'User'
            ]);

            Log::info('Preparing logistic request', [
                'collect_request_id' => $collectRequest->id,
                'orders_count' => $collectRequest->Orders->count(),
                'referrer_id' => $collectRequest->User->referrer_id
            ]);

            // Validate required data
            self::validateCollectRequest($collectRequest);

            // Prepare the request data and files
            $requestData = self::prepareRequestData($collectRequest);
            $files = self::prepareFiles($collectRequest);

            // Build endpoint URL
            $endpoint = config('api.logistic_request')."/" . $collectRequest->User->referrer_id;

            // Send using ApiService upload method
            return ApiService::upload($endpoint, $files, json_encode($requestData));

        } catch (ApiServiceException $e) {
            Log::error('Logistic request API error', [
                'collect_request_id' => $collectRequest->id,
                'error' => $e->getMessage(),
                'code' => $e->getCode()
            ]);
            throw $e;

        } catch (Exception $e) {
            Log::error('Logistic request failed', [
                'collect_request_id' => $collectRequest->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            throw new ApiServiceException(
                'Failed to send logistic request: ' . $e->getMessage(),
                500,
                $e
            );
        }
    }

    /**
     * Validate collect request data
     *
     * @param CollectRequest $collectRequest
     * @throws ApiServiceException
     */
    private static function validateCollectRequest(CollectRequest $collectRequest): void
    {
        if ($collectRequest->Orders->isEmpty()) {
            throw new ApiServiceException('Collect request has no orders', 400);
        }

        if (!$collectRequest->User) {
            throw new ApiServiceException('Collect request has no associated user', 400);
        }

        if (empty($collectRequest->User->referrer_id)) {
            throw new ApiServiceException('User has no referrer ID', 400);
        }

        // Validate each order has required data
        foreach ($collectRequest->Orders as $order) {
            if (!$order->Patient) {
                throw new ApiServiceException("Order {$order->id} has no patient", 400);
            }

            if ($order->Samples->isEmpty()) {
                throw new ApiServiceException("Order {$order->id} has no samples", 400);
            }

            if ($order->Tests->isEmpty()) {
                throw new ApiServiceException("Order {$order->id} has no tests", 400);
            }
        }
    }

    /**
     * Prepare JSON data for the request
     *
     * @param CollectRequest $collectRequest
     * @return array
     */
    private static function prepareRequestData(CollectRequest $collectRequest): array
    {
        $jsonData = [
            'collect_request_id' => $collectRequest->id,
            'referrer_id' => $collectRequest->User->referrer_id,
            'created_at' => $collectRequest->created_at->toISOString(),
            'orders' => []
        ];

        foreach ($collectRequest->Orders as $order) {
            $orderId = self::generateOrderId($order);

            $jsonData['orders'][$orderId] = [
                'order_id' => $order->id,
                'created_at' => $order->created_at->toISOString(),
                'orderForms' => self::prepareOrderForms($order),
                'patient' => self::preparePatientData($order->Patient),
                'samples' => self::prepareSamplesData($order->Samples),
                'tests' => self::prepareTestsData($order->Tests),
                'file_count' => self::countOrderFiles($order)
            ];
        }

        return $jsonData;
    }

    /**
     * Generate consistent order ID
     *
     * @param $order
     * @return string
     */
    private static function generateOrderId($order): string
    {
        return 'OR' . Carbon::parse($order->created_at)->format('.Ymd.') . $order->id;
    }

    /**
     * Prepare order forms data
     *
     * @param $order
     * @return array
     */
    private static function prepareOrderForms($order): array
    {
        if (!isset($order->orderForms) || !is_array($order->orderForms)) {
            return [];
        }

        return collect($order->orderForms)->mapWithKeys(function ($item) {
            return [$item['name'] ?? 'unknown' => $item['formData'] ?? []];
        })->toArray();
    }

    /**
     * Prepare patient data (sanitize sensitive info if needed)
     *
     * @param $patient
     * @return array
     */
    private static function preparePatientData($patient): array
    {
        $patientData = $patient->toArray();

        // Remove any sensitive fields that shouldn't be sent
        unset($patientData['ssn'], $patientData['internal_notes']);

        return $patientData;
    }

    /**
     * Prepare samples data
     *
     * @param $samples
     * @return array
     */
    private static function prepareSamplesData($samples): array
    {
        return $samples->map(function ($sample) {
            $sampleData = $sample->toArray();

            // Include sample type information
            if ($sample->SampleType) {
                $sampleData['sample_type'] = $sample->SampleType->toArray();
            }

            return $sampleData;
        })->toArray();
    }

    /**
     * Prepare tests data
     *
     * @param $tests
     * @return array
     */
    private static function prepareTestsData($tests): array
    {
        return $tests->toArray();
    }

    /**
     * Count total files for an order
     *
     * @param $order
     * @return int
     */
    private static function countOrderFiles($order): int
    {
        $count = 0;

        // Count regular files
        if (isset($order->files) && is_array($order->files)) {
            $count += count($order->files);
        }

        // Count consent forms
        if (isset($order->consents['consentForm']) && is_array($order->consents['consentForm'])) {
            $count += count($order->consents['consentForm']);
        }

        return $count;
    }

    /**
     * Prepare files for upload
     *
     * @param CollectRequest $collectRequest
     * @return array
     * @throws ApiServiceException
     */
    private static function prepareFiles(CollectRequest $collectRequest): array
    {
        $files = [];
        $totalFiles = 0;

        foreach ($collectRequest->Orders as $order) {
            $orderId = self::generateOrderId($order);
            $counter = 0;

            // Process regular order files
            if (isset($order->files) && is_array($order->files)) {
                foreach ($order->files as $filePath) {
                    $fileKey = "file[{$orderId}][{$counter}]";
                    $files[$fileKey] = self::validateAndPrepareFile($filePath, $orderId);
                    $counter++;
                    $totalFiles++;
                }
            }

            // Process consent forms
            if (isset($order->consents['consentForm']) && is_array($order->consents['consentForm'])) {
                foreach ($order->consents['consentForm'] as $filePath) {
                    $fileKey = "file[{$orderId}][{$counter}]";
                    $files[$fileKey] = self::validateAndPrepareFile($filePath, $orderId);
                    $counter++;
                    $totalFiles++;
                }
            }
        }

        Log::info('Prepared files for logistic request', [
            'collect_request_id' => $collectRequest->id,
            'total_files' => $totalFiles
        ]);

        return $files;
    }

    /**
     * Validate and prepare a single file
     *
     * @param string $filePath
     * @param string $orderId
     * @return string
     * @throws ApiServiceException
     */
    private static function validateAndPrepareFile(string $filePath, string $orderId): string
    {
        // Check if file exists in storage
        if (!Storage::exists($filePath)) {
            Log::warning('File not found in storage', [
                'file_path' => $filePath,
                'order_id' => $orderId
            ]);
            throw new ApiServiceException("File not found: {$filePath}");
        }

        $fullPath = Storage::path($filePath);

        // Validate file size
        $fileSize = filesize($fullPath);
        if ($fileSize > self::MAX_FILE_SIZE) {
            throw new ApiServiceException(
                "File too large: {$filePath} ({$fileSize} bytes, max: " . self::MAX_FILE_SIZE . ")"
            );
        }

        // Validate file extension
        $extension = strtolower(pathinfo($filePath, PATHINFO_EXTENSION));
        if (!in_array($extension, self::ALLOWED_FILE_EXTENSIONS)) {
            throw new ApiServiceException(
                "File type not allowed: {$extension}. Allowed types: " .
                implode(', ', self::ALLOWED_FILE_EXTENSIONS)
            );
        }

        return $fullPath;
    }

    /**
     * Get logistic request status
     *
     * @param string $requestId
     * @return Response
     * @throws ApiServiceException
     */
    public static function getStatus(string $requestId): Response
    {
        $endpoint = config('api.logistic_request') . '/status/' . $requestId;
        return ApiService::get($endpoint);
    }

    /**
     * Cancel logistic request
     *
     * @param string $requestId
     * @param string $reason
     * @return Response
     * @throws ApiServiceException
     */
    public static function cancel(string $requestId, string $reason = ''): Response
    {
        $endpoint = config('api.logistic_request') . '/' . $requestId . '/cancel';
        return ApiService::post($endpoint, ['reason' => $reason]);
    }
}
