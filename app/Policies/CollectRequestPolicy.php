<?php

namespace App\Policies;

use App\Models\CollectRequest;
use App\Models\User;
use Illuminate\Auth\Access\Response;

class CollectRequestPolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return $user->can("Admin.CollectRequest.Index");
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, CollectRequest $collectRequest): bool
    {
        return $user->can("Admin.CollectRequest.Show");
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        return $user->can("Admin.CollectRequest.Create");
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, CollectRequest $collectRequest): bool
    {
        return $user->can("Admin.CollectRequest.Update");
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, CollectRequest $collectRequest): bool
    {
        return $user->can("Admin.CollectRequest.Delete");
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, CollectRequest $collectRequest): bool
    {
        //
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(User $user, CollectRequest $collectRequest): bool
    {
        //
    }
}
