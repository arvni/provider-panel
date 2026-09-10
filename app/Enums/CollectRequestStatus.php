<?php

namespace App\Enums;

use Kongulov\Traits\InteractWithEnum;

enum CollectRequestStatus: string
{
    use InteractWithEnum;

    case REQUESTED = 'requested';
    case SCHEDULED = 'scheduled';
    case PICKED_UP = 'picked_up';
    case ON_THE_WAY = 'sample_collector_on_the_way';
    case RECEIVED = 'received';

    /**
     * Get human-readable label for the status
     */
    public function getLabel(): string
    {
        return match ($this) {
            self::REQUESTED => 'Requested',
            self::SCHEDULED => 'Scheduled',
            self::PICKED_UP => 'Picked Up',
            self::RECEIVED => 'Received',
            self::ON_THE_WAY => 'Sample Collector On The Way',
        };
    }

    /**
     * The statuses a request can actually move into after it is raised, in the
     * order it moves through them.
     *
     * REQUESTED is deliberately absent: it is where a request opens, and
     * nothing transitions back into it (see getNextStatuses), so a switch for
     * it would never have anything to silence. Ordered by the lifecycle rather
     * than by case order -- the cases list PICKED_UP before ON_THE_WAY, which
     * is not the order a request travels in.
     *
     * @return array<int, self>
     */
    public static function notifiable(): array
    {
        return [
            self::SCHEDULED,
            self::ON_THE_WAY,
            self::PICKED_UP,
            self::RECEIVED,
        ];
    }

    /**
     * Get color class for UI display
     */
    public function getColor(): string
    {
        return match ($this) {
            self::REQUESTED => 'blue',
            self::SCHEDULED => 'yellow',
            self::PICKED_UP => 'orange',
            self::RECEIVED => 'green',
            self::ON_THE_WAY => 'cyan',
        };
    }

    /**
     * Get the next possible statuses
     */
    public function getNextStatuses(): array
    {
        return match ($this) {
            self::REQUESTED => [self::SCHEDULED],
            self::SCHEDULED => [self::ON_THE_WAY],
            self::ON_THE_WAY => [self::PICKED_UP],
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
