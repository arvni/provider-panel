<?php

namespace App\Policies;

use App\Models\Patient;
use App\Models\User;

class PatientPolicy
{
    /**
     * Determine if the user can view any patients
     */
    public function viewAny(User $user): bool
    {
        return true; // All authenticated users can view their own patients
    }

    /**
     * Determine if the user can view the patient
     */
    public function view(User $user, Patient $patient): bool
    {
        return $user->id === $patient->user_id;
    }

    /**
     * Determine if the user can update the patient
     */
    public function update(User $user, Patient $patient): bool
    {
        return $user->id === $patient->user_id;
    }

    /**
     * Determine if the user can delete the patient
     */
    public function delete(User $user, Patient $patient): bool
    {
        return $user->id === $patient->user_id;
    }
}
