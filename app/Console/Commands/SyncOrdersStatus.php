<?php

namespace App\Console\Commands;

use App\Enums\OrderStatus;
use App\Models\Order;
use App\Services\ApiService;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Str;

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
        $status = function ($x, OrderStatus $old) {
            return match ($x) {
                'processing' => OrderStatus::PROCESSING,
                'reported' => OrderStatus::REPORTED,
                default => $old
            };
        };
        $this->info("check the orders that needed to update their status");
        $orderIds = Order::whereIn("status", [OrderStatus::PROCESSING->value, OrderStatus::SENT->value, OrderStatus::SEMI_REPORTED->value, OrderStatus::RECEIVED->value])
            ->get(["id", "created_at"])
            ->map(function ($item) {
                $date = Carbon::parse($item->created_at)->format("Ymd");
                return "OR.$date.$item->id";
            });
        if (count($orderIds)) {
            $ordersStatus = ApiService::post(config("api.orders_path"), ["orders"=>$orderIds]);
            if ($ordersStatus->ok())
                foreach ($ordersStatus["data"] as $orderStatus) {
                    $id = last(explode(".", $orderStatus["order_id"]));
                    $order = Order::find($id);
                    if ($order) {
                        $order->status = $status($orderStatus["status"], $order->status);
                        $order->server_id = $order["acceptance_id"];
                        $order->received_at=$order["received_ad"];
                        if ($order->isDirty()) {
                            $order->save();
                        }
                    }
                }
            else
                $this->error("Cant Get any response from");
        } else
            $this->info("there isn't any order to update state");
    }
}
