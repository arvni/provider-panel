<?php

namespace App\Policies;

use App\Models\SampleType;
use App\Models\User;
use Illuminate\Auth\Access\Response;

class SampleTypePolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return $user->can("Admin.SampleType.Index");
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, SampleType $sampleType): bool
    {
        return $user->can("Admin.SampleType.Show");
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        return $user->can("Admin.SampleType.Create");
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, SampleType $sampleType): bool
    {
        return $user->can("Admin.SampleType.Update");
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, SampleType $sampleType): bool
    {
        return $user->can("Admin.SampleType.Delete");
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, SampleType $sampleType): bool
    {
        //
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(User $user, SampleType $sampleType): bool
    {
        //
    }
}
