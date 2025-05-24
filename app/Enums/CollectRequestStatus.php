<?php

namespace App\Enums;

use Kongulov\Traits\InteractWithEnum;

enum CollectRequestStatus: string
{
    use InteractWithEnum;

    case REQUESTED = 'requested';
    case SCHEDULED = 'scheduled';
    case PICKED_UP = 'picked up';
    case RECEIVED = 'received';

    /**
     * Get human-readable label for the status
     */
    public function getLabel(): string
    {
        return match($this) {
            self::REQUESTED => 'Requested',
            self::SCHEDULED => 'Scheduled',
            self::PICKED_UP => 'Picked Up',
            self::RECEIVED => 'Received',
        };
    }

    /**
     * Get color class for UI display
     */
    public function getColor(): string
    {
        return match($this) {
            self::REQUESTED => 'blue',
            self::SCHEDULED => 'yellow',
            self::PICKED_UP => 'orange',
            self::RECEIVED => 'green',
        };
    }

    /**
     * Get the next possible statuses
     */
    public function getNextStatuses(): array
    {
        return match($this) {
            self::REQUESTED => [self::SCHEDULED],
            self::SCHEDULED => [self::PICKED_UP],
            self::PICKED_UP => [self::RECEIVED],
            self::RECEIVED => [],
        };
    }

    /**
     * Check if status can transition to another status
     */
    public function canTransitionTo(self $status): bool
    {
        return in_array($status, $this->getNextStatuses());
    }

    /**
     * Get all statuses that are considered "active" (not final)
     */
    public static function getActiveStatuses(): array
    {
        return [self::REQUESTED, self::SCHEDULED, self::PICKED_UP];
    }

    /**
     * Get all statuses that are considered "completed"
     */
    public static function getCompletedStatuses(): array
    {
        return [self::RECEIVED];
    }
}
