<?php

namespace App\Services;

use App\Exceptions\ApiServiceException;
use App\Models\OrderMaterial;
use Exception;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Log;

class MaterialOrder
{
    /**
     * Send order material to logistics API
     *
     * @param OrderMaterial $orderMaterial
     * @return Response
     * @throws ApiServiceException
     */
    public static function send(OrderMaterial $orderMaterial): Response
    {
        try {
            // Load necessary relationships
            $orderMaterial->load([
                'SampleType',
                'User'
            ]);

            Log::info('Preparing Order Material', [
                'order_material_id' => $orderMaterial->id,
                'amount' => $orderMaterial->amount,
                'referrer_id' => $orderMaterial->User->referrer_id,
                'sample_type_id' => $orderMaterial->SampleType->id
            ]);

            // Validate required data
            self::validateCollectRequest($orderMaterial);

            // Prepare the request data and files
            $requestData = self::prepareRequestData($orderMaterial);

            // Build endpoint URL
            $endpoint = config('api.order_materials_path') . "/" . $orderMaterial->User->referrer_id;

            // Send using ApiService upload method
            $response = ApiService::post($endpoint, ['data' => $requestData]);
            $orderMaterial->server_id = $response->json("order_material")["id"];
            if ($orderMaterial->isDirty()) {
                $orderMaterial->save();
            }
            return $response;
        } catch (ApiServiceException $e) {
            Log::error('Logistic request API error', [
                'order_material_id' => $orderMaterial->id,
                'error' => $e->getMessage(),
                'code' => $e->getCode()
            ]);
            throw $e;

        } catch (Exception $e) {
            Log::error('Logistic request failed', [
                'order_material_id' => $orderMaterial->id,
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
     * Validate order material data
     *
     * @param OrderMaterial $orderMaterial
     * @throws ApiServiceException
     */
    private static function validateCollectRequest(OrderMaterial $orderMaterial): void
    {

        if (!$orderMaterial->amount) {
            throw new ApiServiceException('Order Material has zero amount', 400);
        }

        if (!$orderMaterial->User) {
            throw new ApiServiceException('Order Material has no associated user', 400);
        }

        if (empty($orderMaterial->User->referrer_id)) {
            throw new ApiServiceException('User has no referrer ID', 400);
        }

        if (!$orderMaterial->SampleType) {
            throw new ApiServiceException('Order Material has no associated sample type', 400);
        }

        if (!$orderMaterial->SampleType->orderable) {
            throw new ApiServiceException('sample type isnt orderable', 400);
        }

        if (!$orderMaterial->SampleType->server_id) {
            throw new ApiServiceException('sample type isnt setup on server', 400);
        }
    }

    /**
     * Prepare JSON data for the request
     *
     * @param OrderMaterial $orderMaterial
     * @return array
     */
    private static function prepareRequestData(OrderMaterial $orderMaterial): array
    {
        return [
            'order_material_id' => $orderMaterial->id,
            'referrer_id' => $orderMaterial->User->referrer_id,
            'created_at' => $orderMaterial->created_at->toISOString(),
            'order_material' => [
                "id" => $orderMaterial->id,
                "amount" => $orderMaterial->amount,
                "sample_type_id" => $orderMaterial->SampleType->server_id,
                "status" => $orderMaterial->status
            ]
        ];
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
        $endpoint = config('api.order_materials_path') . '/status/' . $requestId;
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
        $endpoint = config('api.order_materials_path') . '/' . $requestId . '/cancel';
        return ApiService::post($endpoint, ['reason' => $reason]);
    }
}
