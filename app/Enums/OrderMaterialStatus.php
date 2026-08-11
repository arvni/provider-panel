<?php

namespace App\Enums;

enum OrderMaterialStatus: string
{
    case ORDERED = 'ORDERED';
    case GENERATED = 'PROCESSED';

    /**
     * The logistic request status a kit order shows while the material is in
     * this state.
     *
     * A kit order never reaches the logistics endpoint — it syncs as an order
     * material — so its request would otherwise sit at "requested" forever.
     * Rather than give materials their own extra states, the two they have are
     * mapped onto the request statuses that already exist:
     *
     *  - ORDERED   the lab has the order, nothing made yet     → Requested
     *  - GENERATED the kits exist and are on their way out,    → Scheduled
     *              but nobody has confirmed the provider has
     *              them, so this stays an active status
     */
    public function toCollectRequestStatus(): CollectRequestStatus
    {
        return match ($this) {
            self::ORDERED => CollectRequestStatus::REQUESTED,
            self::GENERATED => CollectRequestStatus::SCHEDULED,
        };
    }
}
