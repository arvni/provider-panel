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
        return $user->can("Admin.Order.Index");
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, Order $order): bool
    {
        return $user->can("Admin.Order.Show") || $user->id == $order->user_id;
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        return $user->can("Admin.Order.Create") || ($user->Roles()->count() == 0);
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, Order $order): bool
    {
        return $user->can("Admin.Order.Update") || ($order->status == OrderStatus::PENDING && $user->id == $order->user_id);
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, Order $order): bool
    {
        return $user->can("Admin.Order.Delete");
    }

    public function report(User $user, Order $order): bool
    {
        return ($user->can("Admin.Order.Show") || $user->id == $order->user_id) && ($order->status == OrderStatus::REPORTED || $order->status == OrderStatus::REPORT_DOWNLOADED);
    }

}
