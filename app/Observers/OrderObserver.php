<?php

namespace App\Observers;

use App\Enums\OrderStatus;
use App\Models\Order;
use App\Models\User;
use App\Notifications\OrderRemovedByAdmin;
use App\Notifications\OrderStatusUpdated;
use Illuminate\Support\Facades\Notification;

class OrderObserver
{
    /**
     * Handle the Order "created" event.
     */
    public function created(Order $order): void
    {
        //
    }

    /**
     * Handle the Order "updated" event.
     */
    public function updated(Order $order): void
    {
        if (in_array($order->status->value, [OrderStatus::REPORTED->value, OrderStatus::RECEIVED->value, OrderStatus::PROCESSING->value])) {
            $order->load("User");
            $users = [$order->User];
            Notification::send($users, new OrderStatusUpdated($order));
        }
    }

    /**
     * Handle the Order "deleted" event.
     */
    public function deleted(Order $order): void
    {
        if (!in_array($order->status->value, [OrderStatus::REQUESTED->value, OrderStatus::PENDING->value])) {
            $order->load("User");
            $users = [$order->User];
            Notification::send($users, new OrderRemovedByAdmin($order->orderId));
        }
    }
}
