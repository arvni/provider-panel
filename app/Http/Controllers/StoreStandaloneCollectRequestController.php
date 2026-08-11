<?php

namespace App\Http\Controllers;

use App\Enums\CollectRequestStatus;
use App\Http\Requests\StoreStandaloneCollectRequestRequest;
use App\Interfaces\OrderMaterialRepositoryInterface;
use App\Jobs\SendCollectionRequest;
use App\Models\CollectRequest;
use App\Models\OrderMaterial;
use App\Models\SampleType;
use App\Models\User;
use App\Notifications\OrderMaterialRequested;
use App\Services\AdminNotificationService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;

/**
 * Create a logistic request that is not tied to any order.
 *
 * The provider either asks for a pickup — naming the collectable sample types
 * they have ready — or orders one kit to be sent out. An ordered kit becomes a
 * real OrderMaterial, the same record the Order Materials page creates, linked
 * back to the request. Either way the choice is snapshotted into the request's
 * `details` payload, so it still describes what was asked for even if a sample
 * type is later renamed.
 */
class StoreStandaloneCollectRequestController extends Controller
{
    public function __construct(private readonly OrderMaterialRepositoryInterface $orderMaterialRepository) {}

    public function __invoke(StoreStandaloneCollectRequestRequest $request)
    {
        $validated = $request->validated();
        $isOrder = $validated['mode'] === StoreStandaloneCollectRequestRequest::MODE_ORDER;

        $kitSampleType = $isOrder ? SampleType::find($validated['kit_sample_type']) : null;
        $sampleTypes = $isOrder ? collect() : SampleType::whereIn('id', $validated['sample_types'])
            ->orderBy('name')
            ->get(['id', 'server_id', 'name']);

        [$collectRequest, $orderMaterial] = DB::transaction(function () use ($validated, $request, $isOrder, $kitSampleType, $sampleTypes) {
            $details = [
                'type' => 'standalone',
                'mode' => $validated['mode'],
                'comment' => $validated['comment'] ?? null,
            ];

            if (! $isOrder) {
                $details['sample_types'] = $sampleTypes
                    ->map(fn (SampleType $sampleType) => [
                        'id' => $sampleType->id,
                        'server_id' => $sampleType->server_id,
                        'name' => $sampleType->name,
                    ])
                    ->all();
            }

            $collectRequest = CollectRequest::create([
                'user_id' => $request->user()->id,
                'status' => CollectRequestStatus::REQUESTED,
                'preferred_date' => $validated['preferred_date'],
                'details' => $details,
            ]);

            if (! $isOrder) {
                return [$collectRequest, null];
            }

            $orderMaterial = $this->orderMaterialRepository->create([
                'sample_type' => $kitSampleType->id,
                'amount' => $validated['kit_amount'],
                'collect_request_id' => $collectRequest->id,
            ]);

            // Quietly: the material's id can only be known after the request
            // exists, so this second write completes the record rather than
            // changing it. A loud update would tell the provider their brand
            // new request had already been modified.
            $collectRequest->updateQuietly([
                'details' => array_merge($details, [
                    'kit' => [
                        'id' => $kitSampleType->id,
                        'server_id' => $kitSampleType->server_id,
                        'name' => $kitSampleType->name,
                        'amount' => (int) $validated['kit_amount'],
                        'order_material_id' => $orderMaterial->id,
                    ],
                ]),
            ]);

            return [$collectRequest, $orderMaterial];
        });

        if ($orderMaterial) {
            // A kit order reaches the lab as an order material — that is what
            // they act on — so the logistics endpoint is left out of it. The
            // material's own sync is dispatched from the notification below.
            $this->notifyMaterialOrdered($orderMaterial, $request->user());
        } else {
            SendCollectionRequest::dispatch($collectRequest);
        }

        return back()->with(['status' => __('Your logistic request has been submitted.')]);
    }

    /**
     * Announce the kit exactly as the Order Materials page does, so a material
     * reaches the lab the same way whichever form it was asked for on.
     */
    private function notifyMaterialOrdered(OrderMaterial $orderMaterial, User $provider): void
    {
        // The material is always ordered for the provider raising the request,
        // so they are the owner the Order Materials page would notify.
        Notification::send([$provider], new OrderMaterialRequested($orderMaterial->id));
        AdminNotificationService::sendOrderMaterialNotification(
            $orderMaterial,
            'Order Material Created By '.$provider->name.' with a logistic request'
        );
    }
}
