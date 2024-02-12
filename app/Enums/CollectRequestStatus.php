<?php

namespace App\Enums;
use Kongulov\Traits\InteractWithEnum;

enum CollectRequestStatus: string
{
    use InteractWithEnum;
    case REQUESTED = "requested";
    case SCHEDULED = "scheduled";
    case PICKED_UP = "picked up";
    case RECEIVED = "received";
}
