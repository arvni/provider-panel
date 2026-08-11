<?php

namespace App\Console\Commands;

use App\Enums\CollectRequestStatus;
use App\Enums\OrderStatus;
use App\Models\Order;
use App\Services\ApiService;
use Illuminate\Console\Command;

class SyncOrdersStatus extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'sync:orders';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Check orders status and update them';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('check the orders that needed to update their status');

        // One fetch, keyed by id: the response is matched back against these
        // models instead of issuing a find() per row.
        $orders = Order::query()
            ->with('CollectRequest')
            ->whereIn('status', [
                OrderStatus::PROCESSING->value,
                OrderStatus::SENT->value,
                OrderStatus::SEMI_REPORTED->value,
                OrderStatus::WAITING_FOR_FINANCIAL_APPROVAL->value,
                OrderStatus::RECEIVED->value,
                OrderStatus::LOGISTIC_REQUESTED->value,
            ])
            ->get()
            ->keyBy('id');

        if ($orders->isEmpty()) {
            $this->info("there isn't any order to update state");

            return;
        }

        $url = config('api.server_url').config('api.orders_path');
        $ordersStatus = ApiService::post($url, ['orders' => $orders->map(fn ($order) => $order->orderId)->values()]);

        if (! $ordersStatus->ok()) {
            $this->error($ordersStatus->reason());

            return;
        }

        foreach ($ordersStatus['data'] as $orderStatus) {
            $order = $orders->get((int) last(explode('.', $orderStatus['order_id'])));

            if (! $order) {
                continue;
            }

            $this->syncOrder($order, $orderStatus);
        }
    }

    /**
     * Apply one API row to its order, writing only what actually differs.
     *
     * @param  array<string, mixed>  $orderStatus
     */
    protected function syncOrder(Order $order, array $orderStatus): void
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
