<?php

namespace App\Policies;

use App\Enums\OrderMaterialStatus;
use App\Models\OrderMaterial;
use App\Models\User;

class OrderMaterialPolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return $user->can("Admin.OrderMaterial.Index");
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, OrderMaterial $orderMaterial): bool
    {
        return $user->can("Admin.OrderMaterial.Show");
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        return $user->can("Admin.OrderMaterial.Create") ;
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, OrderMaterial $orderMaterial): bool
    {
        return $user->can("Admin.OrderMaterial.Update");
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, OrderMaterial $orderMaterial): bool
    {
        return $user->can("Admin.OrderMaterial.Delete");
    }

}
