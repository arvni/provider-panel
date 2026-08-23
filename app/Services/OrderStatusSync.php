<?php

namespace App\Services;

use App\Enums\CollectRequestStatus;
use App\Enums\OrderStatus;
use App\Exceptions\ApiServiceException;
use App\Models\Order;
use Illuminate\Support\Collection;

/**
 * Pulls the lab's current state for a set of orders and applies it locally.
 *
 * Extracted from the sync:orders command so the scheduled sweep and the admin
 * "fetch from server" button run exactly the same rules -- an on-demand fetch
 * that advanced a status differently from the five-minute pass would be worse
 * than no button at all.
 */
class OrderStatusSync
{
    /**
     * Statuses the scheduled sweep asks the lab about.
     *
     * Orders below `logistic requested` have never been handed over, and the
     * two reported states are terminal, so neither has anything to learn.
     *
     * @var array<int, string>
     */
    public const SWEEPABLE_STATUSES = [
        OrderStatus::LOGISTIC_REQUESTED->value,
        OrderStatus::SENT->value,
        OrderStatus::RECEIVED->value,
        OrderStatus::PROCESSING->value,
        OrderStatus::SEMI_REPORTED->value,
        OrderStatus::WAITING_FOR_FINANCIAL_APPROVAL->value,
    ];

    /**
     * Ask the lab about these orders and apply whatever it reports.
     *
     * The passed models are mutated in place, so a caller holding a single
     * order can read its new state straight off the instance afterwards.
     *
     * @param  Collection<int, Order>  $orders
     * @return int how many of them the lab actually reported on
     *
     * @throws ApiServiceException
     */
    public function sync(Collection $orders): int
    {
        if ($orders->isEmpty()) {
            return 0;
        }

        // Keyed by id: the response is matched back against these models
        // instead of issuing a find() per row.
        $orders = $orders->keyBy('id');

        // Orders raised inside the lab never carry our "OR.<Ymd>.<id>" key --
        // the lab knows them as SC-/SYNC- and there is nothing on either side to
        // translate one into the other. The acceptance id (stored here as
        // server_id) is the one key both databases agree on, so ask by both and
        // let whichever resolves do the matching.
        $byAcceptance = $orders->filter(fn (Order $order) => $order->server_id !== null)
            ->keyBy(fn (Order $order) => (int) $order->server_id);

        $url = config('api.server_url').config('api.orders_path');
        $response = ApiService::post($url, [
            'orders' => $orders->map(fn (Order $order) => $order->orderId)->values(),
            'acceptances' => $byAcceptance->keys()->values(),
        ]);

        // One acceptance can carry several referrer orders (pooling), so the
        // reply may name the same order more than once. Applying each row is
        // safe -- apply() only ever advances -- but the count reports orders,
        // not rows.
        $matched = [];

        foreach ($response['data'] ?? [] as $orderStatus) {
            $order = $this->matchOrder($orders, $byAcceptance, $orderStatus);

            if (! $order) {
                continue;
            }

            $this->apply($order, $orderStatus);
            $matched[$order->id] = true;
        }

        return count($matched);
    }

    /**
     * Find the local order an API row belongs to.
     *
     * The acceptance id is preferred: it is present on every order the lab has
     * accepted, whoever raised it. The provider key is the fallback, and is all
     * there is for an order the lab has not linked to an acceptance yet.
     *
     * @param  Collection<int, Order>  $orders  keyed by local id
     * @param  Collection<int, Order>  $byAcceptance  keyed by server_id
     * @param  array<string, mixed>  $orderStatus
     */
    protected function matchOrder(Collection $orders, Collection $byAcceptance, array $orderStatus): ?Order
    {
        $order = $byAcceptance->get((int) ($orderStatus['acceptance_id'] ?? 0));

        if ($order) {
            return $order;
        }

        return $orders->get((int) last(explode('.', (string) ($orderStatus['order_id'] ?? ''))));
    }

    /**
     * Apply one API row to its order, writing only what actually differs.
     *
     * @param  array<string, mixed>  $orderStatus
     */
    protected function apply(Order $order, array $orderStatus): void
    {
        $remoteStatus = $this->mapStatus($orderStatus['status'] ?? null);

        // Only ever advance. The remote reports where the sample is now, and a
        // late/duplicated row saying "processing" must not drag an order that
        // has already reached "waiting for financial approval" backwards --
        // that regression rewrites the row every pass and re-fires the status
        // email each time it flips forward again.
        if ($remoteStatus && ! $order->status->isAtOrAfter($remoteStatus)) {
            $order->status = $remoteStatus;
        }

        // The remote omits these on rows it has no value for; assigning the
        // missing key blanks a column we already populated, and the next pass
        // writes it straight back.
        if (! empty($orderStatus['acceptance_id'])) {
            $order->server_id = $orderStatus['acceptance_id'];
        }

        // First received_at wins, as in the webhook paths.
        if (is_null($order->received_at) && ! empty($orderStatus['received_at'])) {
            $order->received_at = $orderStatus['received_at'];
        }

        if ($order->isDirty()) {
            $order->save();
        }

        // Reaching processing means the lab has the sample, so the collect
        // request is received -- but say so once, not on every pass.
        $collectRequest = $order->CollectRequest;
        if ($order->status->isAtOrAfter(OrderStatus::PROCESSING)
            && $collectRequest
            && $collectRequest->status !== CollectRequestStatus::RECEIVED) {
            $collectRequest->update(['status' => CollectRequestStatus::RECEIVED]);
        }
    }

    /**
     * Translate a remote status string, ignoring anything unrecognised.
     */
    protected function mapStatus(?string $status): ?OrderStatus
    {
        return match ($status) {
            'processing' => OrderStatus::PROCESSING,
            'waiting for financial approval' => OrderStatus::WAITING_FOR_FINANCIAL_APPROVAL,
            'reported' => OrderStatus::REPORTED,
            default => null,
        };
    }
}
