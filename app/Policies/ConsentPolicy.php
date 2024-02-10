<?php

namespace App\Policies;

use App\Models\Consent;
use App\Models\User;
use Illuminate\Auth\Access\Response;

class ConsentPolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return $user->can("Admin.Consent.Index");
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, Consent $consent): bool
    {
        return $user->can("Admin.Consent.Show");
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        return $user->can("Admin.Consent.Create");
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, Consent $consent): bool
    {
        return $user->can("Admin.Consent.Update");
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, Consent $consent): bool
    {
        return $user->can("Admin.Consent.Delete");
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, Consent $consent): bool
    {
        //
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(User $user, Consent $consent): bool
    {
        //
    }
}
