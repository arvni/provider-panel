<?php

namespace App\Console\Commands;

use App\Models\Order;
use App\Services\OrderStatusSync;
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
    public function handle(OrderStatusSync $sync)
    {
        $this->info('check the orders that needed to update their status');

        $orders = Order::query()
            ->with('CollectRequest')
            ->whereIn('status', OrderStatusSync::SWEEPABLE_STATUSES)
            ->get();

        if ($orders->isEmpty()) {
            $this->info("there isn't any order to update state");

            return;
        }

        $sync->sync($orders);
    }
}
