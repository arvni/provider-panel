<?php

namespace App\Services;

use App\Models\Order;
use App\Models\OrderStatusHistory;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

/**
 * Appends steps to the order timeline.
 *
 * Most transitions arrive through the model and are picked up by OrderObserver.
 * Several paths, though, move status with a query-builder update() across many
 * orders at once -- collection requests being raised, a request being received.
 * Those never touch a model and so never fire an observer, which would leave
 * the timeline missing precisely the steps a provider most wants to see. They
 * call recordMany() directly instead.
 */
class OrderStatusRecorder
{
    /**
     * Record a single transition.
     */
    public function record(int $orderId, ?string $from, string $to, ?int $userId = null): void
    {
        OrderStatusHistory::create([
            'order_id' => $orderId,
            'from_status' => $from,
            'to_status' => $to,
            'changed_at' => now(),
            'user_id' => $userId ?? Auth::id(),
        ]);
    }

    /**
     * Record the same destination status for many orders in one insert.
     *
     * Takes the orders as they were *before* the update so each row can carry
     * the status it actually came from. Orders already sitting on the
     * destination status are skipped -- a repeated webhook should not stutter
     * the timeline.
     *
     * @param  iterable<Order|object>  $ordersBeforeUpdate  rows carrying id and status
     */
    public function recordMany(iterable $ordersBeforeUpdate, string $to, ?int $userId = null): int
    {
        $now = now();
        $userId ??= Auth::id();
        $rows = [];

        foreach ($ordersBeforeUpdate as $order) {
            $from = $order->status instanceof \BackedEnum ? $order->status->value : $order->status;

            if ($from === $to) {
                continue;
            }

            $rows[] = [
                'order_id' => $order->id,
                'from_status' => $from,
                'to_status' => $to,
                'changed_at' => $now,
                'user_id' => $userId,
                'backfilled' => false,
                'created_at' => $now,
                'updated_at' => $now,
            ];
        }

        if ($rows) {
            DB::table('order_status_histories')->insert($rows);
        }

        return count($rows);
    }
}
