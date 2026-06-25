<?php

namespace App\Http\Controllers\Webhook;

use App\Enums\OrderMaterialStatus;
use App\Http\Controllers\Controller;
use App\Interfaces\MaterialRepositoryInterface;
use App\Interfaces\OrderMaterialRepositoryInterface;
use App\Interfaces\SampleTypeRepositoryInterface;
use App\Models\OrderMaterial;
use App\Notifications\OrderMaterialUpdated;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Notification;

class OrderMaterialUpdateWebhookController extends Controller
{
    public function __construct(
        private readonly OrderMaterialRepositoryInterface $orderMaterialRepository,
        private readonly MaterialRepositoryInterface $materialRepository,
        private readonly SampleTypeRepositoryInterface $sampleTypeRepository,
    ) {}

    /**
     * Handle the incoming request.
     */
    public function __invoke(OrderMaterial $orderMaterial, Request $request)
    {
        // Signature is verified upstream by the verify.webhook middleware.
        // Process the order update
        if ($orderMaterial->status !== OrderMaterialStatus::GENERATED) {
            $materialsData = $request->get('materials');
            $sampleType = $this->sampleTypeRepository->getByServerId($materialsData[0]['sample_type']['id']);
            foreach ($materialsData as $materialData) {
                $material = $this->materialRepository->getByBarcode($materialData['barcode']);
                if (! $material && $sampleType) {
                    $this->materialRepository->createMaterial([
                        'barcode' => $materialData['barcode'],
                        'order_material_id' => $orderMaterial->id,
                        'sample_type_id' => $sampleType->id,
                        'expire_date' => $materialData['expire_date'] ?? null,
                        'user_id' => $orderMaterial->user_id ?? null,
                    ]);
                } elseif ($material && ! $material->order_matrial_id && $sampleType) {
                    $this->materialRepository->updateMaterial($material, [
                        'order_material_id' => $orderMaterial->id,
                    ]);
                }
            }
            $orderMaterial->loadMissing('User');
            $users = [$orderMaterial->User];
            Notification::send($users, new OrderMaterialUpdated($orderMaterial));
            $this->orderMaterialRepository->update($orderMaterial, ['status' => OrderMaterialStatus::GENERATED]);
        }

        return response()->json(['success' => true]);
    }
}
