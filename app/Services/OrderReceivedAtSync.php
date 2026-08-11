<?php

namespace App\Services;

use App\Models\CollectRequest;
use Illuminate\Support\Facades\DB;

/**
 * Keeps orders.received_at in step with the collections behind their samples.
 *
 * An order is only really "received" once the samples for it have arrived, and
 * those travel in collect requests. A single order can span several requests --
 * samples get picked up in more than one visit -- so the order counts as
 * received when the last of them lands, i.e. the newest received_at wins.
 *
 * The order's own collect_request_id is deliberately not used: it records the
 * request the order was attached to, which is not necessarily where its samples
 * actually travelled.
 */
class OrderReceivedAtSync
{
    /**
     * Recompute received_at for every order holding a sample in this request.
     *
     * @return int number of orders whose received_at moved
     */
    public function forCollectRequest(CollectRequest $collectRequest): int
    {
        $orderIds = DB::table('samples')
            ->join('order_item_sample', 'order_item_sample.sample_id', '=', 'samples.id')
            ->join('order_items', 'order_items.id', '=', 'order_item_sample.order_item_id')
            ->where('samples.collect_request_id', $collectRequest->id)
            ->distinct()
            ->pluck('order_items.order_id');

        $updated = 0;

        foreach ($orderIds as $orderId) {
            $updated += $this->forOrderId((int) $orderId);
        }

        return $updated;
    }

    /**
     * Set one order's received_at to the latest receipt among its samples.
     *
     * Leaves the column alone when no related request has been received yet,
     * so a fallback stamped elsewhere is not wiped out by a collection that
     * has not arrived.
     */
    public function forOrderId(int $orderId): int
    {
        $latest = DB::table('order_items')
            ->join('order_item_sample', 'order_item_sample.order_item_id', '=', 'order_items.id')
            ->join('samples', 'samples.id', '=', 'order_item_sample.sample_id')
            ->join('collect_requests', 'collect_requests.id', '=', 'samples.collect_request_id')
            ->where('order_items.order_id', $orderId)
            ->whereNotNull('collect_requests.received_at')
            ->max('collect_requests.received_at');

        if (! $latest) {
            return 0;
        }

        return DB::table('orders')
            ->where('id', $orderId)
            ->where(fn ($q) => $q->whereNull('received_at')->orWhere('received_at', '!=', $latest))
            ->update(['received_at' => $latest]);
    }
}
