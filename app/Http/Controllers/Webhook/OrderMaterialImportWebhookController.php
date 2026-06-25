<?php

namespace App\Http\Controllers\Webhook;

use App\Enums\OrderMaterialStatus;
use App\Http\Controllers\Controller;
use App\Interfaces\MaterialRepositoryInterface;
use App\Interfaces\SampleTypeRepositoryInterface;
use App\Models\OrderMaterial;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class OrderMaterialImportWebhookController extends Controller
{
    public function __construct(
        private readonly MaterialRepositoryInterface $materialRepository,
        private readonly SampleTypeRepositoryInterface $sampleTypeRepository,
    ) {}

    public function __invoke(Request $request)
    {
        // Signature is verified upstream by the verify.webhook middleware.
        $data = $request->input('order_material');
        if (! $data) {
            return response()->json(['error' => 'Missing order_material payload'], 422);
        }

        $serverId = $data['id'];

        if (OrderMaterial::where('server_id', $serverId)->exists()) {
            return response()->json(['success' => true, 'message' => 'Already imported']);
        }

        $user = User::where('referrer_id', $data['referrer']['id'])->first();
        $sampleType = $this->sampleTypeRepository->getByServerId($data['sample_type']['id']);

        if (! $user || ! $sampleType) {
            Log::warning('OrderMaterial import: user or sample type not found', [
                'referrer_id' => $data['referrer']['id'],
                'sample_type_server_id' => $data['sample_type']['id'],
            ]);

            return response()->json(['error' => 'User or sample type not found'], 422);
        }

        DB::transaction(function () use ($data, $serverId, $user, $sampleType) {
            $orderMaterial = new OrderMaterial([
                'server_id' => $serverId,
                'amount' => $data['amount'],
                'status' => OrderMaterialStatus::GENERATED,
            ]);
            $orderMaterial->User()->associate($user);
            $orderMaterial->SampleType()->associate($sampleType);
            $orderMaterial->save();

            foreach ($data['materials'] as $materialData) {
                if ($this->materialRepository->getByBarcode($materialData['barcode'])) {
                    continue;
                }
                $this->materialRepository->createMaterial([
                    'barcode' => $materialData['barcode'],
                    'order_material_id' => $orderMaterial->id,
                    'sample_type_id' => $sampleType->id,
                    'expire_date' => $materialData['expire_date'] ?? null,
                    'user_id' => $user->id,
                ]);
            }
        });

        return response()->json(['success' => true]);
    }
}
