<?php

namespace App\Policies;

use App\Models\Instruction;
use App\Models\User;

class InstructionPolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return $user->can("Admin.Instruction.Index");
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, Instruction $instruction): bool
    {
        return $user->can("Admin.Instruction.Show");
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        return $user->can("Admin.Instruction.Create");
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, Instruction $instruction): bool
    {
        return $user->can("Admin.Instruction.Update");
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, Instruction $instruction): bool
    {
        return $user->can("Admin.Instruction.Delete");
    }

}
