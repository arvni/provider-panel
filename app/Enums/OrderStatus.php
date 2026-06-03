<?php

namespace App\Enums;

enum OrderStatus: string
{
    case PENDING = "pending";
    case REQUESTED = "requested";
    case LOGISTIC_REQUESTED = "logistic requested";
    case SENT = "sent";
    case RECEIVED = "received";
    case PROCESSING = "processing";
    case SEMI_REPORTED = "semi reported";
    case REPORTED = "reported";
    case REPORT_DOWNLOADED = "report downloaded";

    /**
     * Position of this status in the order lifecycle (lower = earlier).
     */
    public function rank(): int
    {
        return array_search($this, self::cases(), true);
    }

    /**
     * Whether this status is at or beyond the given status in the lifecycle.
     */
    public function isAtOrAfter(self $other): bool
    {
        return $this->rank() >= $other->rank();
    }
}
