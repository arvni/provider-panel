<?php

namespace App\Enums;

enum OrderStatus: string
{
    case PENDING = 'pending';
    case REQUESTED = 'requested';
    case LOGISTIC_REQUESTED = 'logistic requested';
    case SENT = 'sent';
    case RECEIVED = 'received';
    case PROCESSING = 'processing';
    case SEMI_REPORTED = 'semi reported';
    case WAITING_FOR_FINANCIAL_APPROVAL = 'waiting for financial approval';
    case REPORTED = 'reported';
    case REPORT_DOWNLOADED = 'report downloaded';

    /**
     * The statuses whose arrival is announced to the order's owner.
     *
     * The rest are bookkeeping: "report downloaded" is stamped by the provider's
     * own click and "logistic requested" by their own collection request, so
     * mailing either would be telling them what they just did.
     *
     * Kept here rather than inline in OrderObserver because the notification
     * settings screen offers a switch per status and has to offer exactly this
     * set -- a switch for a status that never notifies would do nothing, and a
     * status that notifies with no switch could not be turned off.
     *
     * @return array<int, self>
     */
    public static function notifiable(): array
    {
        return [
            self::RECEIVED,
            self::PROCESSING,
            self::WAITING_FOR_FINANCIAL_APPROVAL,
            self::REPORTED,
        ];
    }

    /**
     * Human-readable name, for the notification settings screen.
     */
    public function label(): string
    {
        return match ($this) {
            self::PENDING => 'Pending',
            self::REQUESTED => 'Requested',
            self::LOGISTIC_REQUESTED => 'Logistic requested',
            self::SENT => 'Sent',
            self::RECEIVED => 'Sample received',
            self::PROCESSING => 'Processing',
            self::SEMI_REPORTED => 'Semi reported',
            self::WAITING_FOR_FINANCIAL_APPROVAL => 'Awaiting financial approval',
            self::REPORTED => 'Results reported',
            self::REPORT_DOWNLOADED => 'Report downloaded',
        };
    }

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
