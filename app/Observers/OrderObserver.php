<?php

namespace App\Observers;

use App\Enums\OrderStatus;
use App\Models\Order;
use App\Notifications\OrderRemovedByAdmin;
use App\Notifications\OrderStatusUpdated;
use App\Services\OrderStatusRecorder;
use Illuminate\Support\Facades\Notification;

class OrderObserver
{
    /**
     * While true the observer still records transitions but announces none.
     */
    private static bool $notificationsSuppressed = false;

    /**
     * Run $callback with the status email suppressed.
     *
     * The timeline is still written -- it is a log of what happened, and a
     * catch-up pass is something that happened. Only the announcement is held
     * back, because a backfill working through transitions the provider was
     * never told about must not mail them once per missed step.
     *
     * @template TReturn
     *
     * @param  callable(): TReturn  $callback
     * @return TReturn
     */
    public static function withoutNotifications(callable $callback): mixed
    {
        $previous = self::$notificationsSuppressed;
        self::$notificationsSuppressed = true;

        try {
            return $callback();
        } finally {
            // Restored rather than set false so nesting cannot switch
            // notifications back on for an outer caller that suppressed them.
            self::$notificationsSuppressed = $previous;
        }
    }

    /**
     * Handle the Order "created" event.
     */
    public function created(Order $order): void
    {
        $this->recordStatusChange($order, null);
    }

    /**
     * Handle the Order "updated" event.
     */
    public function updated(Order $order): void
    {
        // Only announce a status transition. Without this guard any unrelated
        // write -- a webhook stamping server_id, an edit, a sync pass -- re-sends
        // the same email while the status sits on one of the notifiable values.
        if (! $order->wasChanged('status')) {
            return;
        }

        // Every transition is recorded, including the ones that are not mailed --
        // the timeline is a log of what happened, not of what was announced.
        $this->recordStatusChange($order, $order->getOriginal('status'));

        if (self::$notificationsSuppressed) {
            return;
        }

        if (in_array($order->status->value, [OrderStatus::REPORTED->value, OrderStatus::RECEIVED->value, OrderStatus::PROCESSING->value, OrderStatus::WAITING_FOR_FINANCIAL_APPROVAL->value])) {
            $order->load('User');
            $users = [$order->User];
            Notification::send($users, new OrderStatusUpdated($order));
        }
    }

    /**
     * Append one step to the order's timeline.
     *
     * `changed_at` is stamped here rather than taken from updated_at so the
     * timeline keeps its own clock, independent of later unrelated writes.
     * Attribution is best-effort: webhooks, the sync command and queue workers
     * all run without a session, and those steps are simply unattributed.
     *
     * Orders can be created without naming a status -- the column carries a
     * database-level default -- which leaves the attribute null in memory here.
     * There is no transition to record in that case; the timeline opens on the
     * first status the order is actually given.
     */
    private function recordStatusChange(Order $order, OrderStatus|string|null $from): void
    {
        // Read through getAttribute: the cast declares this non-nullable, but on
        // a create that never named a status it really is null in memory.
        $status = $order->getAttribute('status');

        if (! $status instanceof OrderStatus) {
            return;
        }

        app(OrderStatusRecorder::class)->record(
            $order->id,
            $from instanceof OrderStatus ? $from->value : $from,
            $status->value,
        );
    }

    /**
     * Handle the Order "deleted" event.
     */
    public function deleted(Order $order): void
    {
        if (! in_array($order->status->value, [OrderStatus::REQUESTED->value, OrderStatus::PENDING->value])) {
            $order->load('User');
            $users = [$order->User];
            Notification::send($users, new OrderRemovedByAdmin($order->orderId));
        }
    }
}
