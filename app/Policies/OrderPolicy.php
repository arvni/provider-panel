<?php

namespace App\Policies;

use App\Enums\OrderStatus;
use App\Models\Order;
use App\Models\User;

class OrderPolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return $user->can('Admin.Order.Index');
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, Order $order): bool
    {
        return $user->can('Admin.Order.Show') || $user->id == $order->user_id;
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        return $user->can('Admin.Order.Create') || $user->can('Order.Create');
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, Order $order): bool
    {
        return $user->can('Admin.Order.Update') || (($order->status === OrderStatus::PENDING || $order->status === OrderStatus::REQUESTED) && $user->id == $order->user_id);
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, Order $order): bool
    {
        return $user->can('Admin.Order.Delete') || (($order->status === OrderStatus::PENDING || $order->status === OrderStatus::REQUESTED) && $user->id == $order->user_id);
    }

    /**
     * Determine whether the user can re-send the order's current status
     * notification to the provider who owns it.
     *
     * Gated on the admin update permission rather than one of its own so the
     * roles that already administer orders pick it up without a re-seed. A
     * pending order is a draft the provider has not finished submitting --
     * there is no state worth announcing yet.
     */
    public function resendNotification(User $user, Order $order): bool
    {
        return $user->can('Admin.Order.Update') && $order->status !== OrderStatus::PENDING;
    }

    /**
     * Determine whether the user can look up the order's current status at the lab.
     *
     * Same admin permission as the other order-level actions. An order below
     * `logistic requested` has never been handed over, so the lab has never
     * heard of it and there is nothing to look up.
     */
    public function fetchStatus(User $user, Order $order): bool
    {
        return $user->can('Admin.Order.Update')
            && $order->status->isAtOrAfter(OrderStatus::LOGISTIC_REQUESTED);
    }

    public function report(User $user, Order $order): bool
    {
        return ($user->can('Admin.Order.Show') || $user->id == $order->user_id) && ($order->status == OrderStatus::REPORTED || $order->status == OrderStatus::REPORT_DOWNLOADED);
    }
}
