<?php

namespace App\Observers;

use App\Models\OrderMaterial;

class OrderMaterialObserver
{
    /**
     * Handle the OrderMaterial "updated" event.
     *
     * A kit ordered from the logistic request form has a request attached to it
     * that the logistics endpoint never touches, so the material's progress is
     * the only progress there is. Mirror it, and the request stops sitting at
     * "requested" forever.
     */
    public function updated(OrderMaterial $orderMaterial): void
    {
        if (! $orderMaterial->wasChanged('status') || ! $orderMaterial->collect_request_id) {
            return;
        }

        $collectRequest = $orderMaterial->CollectRequest;

        if (! $collectRequest) {
            return;
        }

        $status = $orderMaterial->status->toCollectRequestStatus();

        if ($collectRequest->status === $status) {
            return;
        }

        // Loudly: the provider should hear that their kit order moved on, the
        // same way they would for a collection.
        $collectRequest->update(['status' => $status]);
    }
}
