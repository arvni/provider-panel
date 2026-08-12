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
use App\Notifications\KitOrderRequested;
use App\Services\AdminNotificationService;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;

/**
 * Create a logistic request that is not tied to any order.
 *
 * The provider either asks for a pickup — naming the collectable sample types
 * they have ready — or orders kits to be sent out. Each ordered kit becomes a
 * real OrderMaterial, the same record the Order Materials page creates, linked
 * back to the request: the lab makes up and ships each kit separately, so each
 * one has to travel as its own material. Either way the choice is snapshotted
 * into the request's `details` payload, so it still describes what was asked
 * for even if a sample type is later renamed.
 */
class StoreStandaloneCollectRequestController extends Controller
{
    public function __construct(private readonly OrderMaterialRepositoryInterface $orderMaterialRepository) {}

    public function __invoke(StoreStandaloneCollectRequestRequest $request)
    {
        $validated = $request->validated();
        $isOrder = $validated['mode'] === StoreStandaloneCollectRequestRequest::MODE_ORDER;

        // Both branches resolve their sample types up front, keyed by id, so the
        // transaction below reads names and server ids without a query per kit.
        $kits = $isOrder ? collect($validated['kits']) : collect();
        $chosenTypes = SampleType::whereIn(
            'id',
            $isOrder ? $kits->pluck('sample_type') : $validated['sample_types']
        )
            ->orderBy('name')
            ->get(['id', 'server_id', 'name']);

        [$collectRequest, $orderMaterials] = DB::transaction(function () use ($validated, $request, $isOrder, $kits, $chosenTypes) {
            $details = [
                'type' => 'standalone',
                'mode' => $validated['mode'],
                'comment' => $validated['comment'] ?? null,
            ];

            if (! $isOrder) {
                $details['sample_types'] = $chosenTypes
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
                return [$collectRequest, collect()];
            }

            $sampleTypes = $chosenTypes->keyBy('id');

            $orderMaterials = $kits->map(fn (array $kit) => $this->orderMaterialRepository->create([
                'sample_type' => $kit['sample_type'],
                'amount' => $kit['amount'],
                'collect_request_id' => $collectRequest->id,
            ]));

            // Quietly: the materials' ids can only be known after the request
            // exists, so this second write completes the record rather than
            // changing it. A loud update would tell the provider their brand
            // new request had already been modified.
            $collectRequest->updateQuietly([
                'details' => array_merge($details, [
                    'kits' => $kits
                        ->zip($orderMaterials)
                        ->map(function (Collection $pair) use ($sampleTypes) {
                            [$kit, $orderMaterial] = $pair;
                            $sampleType = $sampleTypes[$kit['sample_type']];

                            return [
                                'id' => $sampleType->id,
                                'server_id' => $sampleType->server_id,
                                'name' => $sampleType->name,
                                'amount' => (int) $kit['amount'],
                                'order_material_id' => $orderMaterial->id,
                            ];
                        })
                        ->all(),
                ]),
            ]);

            return [$collectRequest, $orderMaterials];
        });

        if ($orderMaterials->isNotEmpty()) {
            // A kit order reaches the lab as order materials — that is what
            // they act on — so the logistics endpoint is left out of it. Each
            // material's own sync is dispatched from the notification below.
            $this->notifyKitsOrdered($collectRequest, $orderMaterials, $request->user());
        } else {
            SendCollectionRequest::dispatch($collectRequest);
        }

        return back()->with(['status' => __('Your logistic request has been submitted.')]);
    }

    /**
     * Announce the kits once for the whole request rather than once per kit:
     * the provider filled in a single form and should hear back about it a
     * single time, however many kits they ticked.
     *
     * @param  Collection<int, OrderMaterial>  $orderMaterials
     */
    private function notifyKitsOrdered(CollectRequest $collectRequest, Collection $orderMaterials, User $provider): void
    {
        // The materials are always ordered for the provider raising the
        // request, so they are the owner the Order Materials page would notify.
        Notification::send([$provider], new KitOrderRequested($collectRequest->id));
        AdminNotificationService::sendKitOrderNotification(
            $collectRequest,
            $orderMaterials,
            'Kits Ordered By '.$provider->name.' with a logistic request'
        );
    }
}
