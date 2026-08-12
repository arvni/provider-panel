<?php

namespace App\Observers;

use App\Enums\CollectRequestStatus;
use App\Models\OrderMaterial;

class OrderMaterialObserver
{
    /**
     * The request statuses a material's own progress can account for. Anything
     * further along was put there by someone else — an admin marking the kits
     * handed over — and a material has nothing to say about it.
     */
    private const MATERIAL_DRIVEN = [
        CollectRequestStatus::REQUESTED,
        CollectRequestStatus::SCHEDULED,
    ];

    /**
     * Handle the OrderMaterial "updated" event.
     *
     * A kit ordered from the logistic request form has a request attached to it
     * that the logistics endpoint never touches, so the materials' progress is
     * the only progress there is. Mirror it, and the request stops sitting at
     * "requested" forever.
     *
     * One request can carry several kits, so the request follows the least
     * advanced of them: it is not scheduled until every kit has been generated.
     * Reading them all also keeps the order of the updates from mattering — the
     * answer is the same whichever kit was saved last.
     */
    public function updated(OrderMaterial $orderMaterial): void
    {
        if (! $orderMaterial->wasChanged('status') || ! $orderMaterial->collect_request_id) {
            return;
        }

        $collectRequest = $orderMaterial->CollectRequest;

        if (! $collectRequest || ! in_array($collectRequest->status, self::MATERIAL_DRIVEN, true)) {
            return;
        }

        $status = $collectRequest->orderMaterials()
            ->get(['id', 'collect_request_id', 'status'])
            ->sortBy(fn (OrderMaterial $material) => $material->status->progress())
            ->first()
            ?->status
            ?->toCollectRequestStatus();

        if (! $status || $collectRequest->status === $status) {
            return;
        }

        // Loudly: the provider should hear that their kit order moved on, the
        // same way they would for a collection.
        $collectRequest->update(['status' => $status]);
    }
}
