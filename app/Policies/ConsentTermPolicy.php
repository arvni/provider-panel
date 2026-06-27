<?php

namespace App\Policies;

use App\Models\ConsentTerm;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;
use Illuminate\Auth\Access\Response;

class ConsentTermPolicy
{
    use HandlesAuthorization;

    /**
     * Determine whether the user can view any models.
     *
     * @return Response|bool
     */
    public function viewAny(User $user)
    {
        return $user->can('Admin.ConsentTerm.Index');
    }

    /**
     * Determine whether the user can view the model.
     *
     * @return Response|bool
     */
    public function view(User $user, ConsentTerm $consentTerm)
    {
        return $user->can('Admin.ConsentTerm.Show');
    }

    /**
     * Determine whether the user can create models.
     *
     * @return Response|bool
     */
    public function create(User $user)
    {
        return $user->can('Admin.ConsentTerm.Create');
    }

    /**
     * Determine whether the user can update the model.
     *
     * @return Response|bool
     */
    public function update(User $user, ConsentTerm $consentTerm)
    {
        return $user->can('Admin.ConsentTerm.Update');
    }

    /**
     * Determine whether the user can delete the model.
     *
     * @return Response|bool
     */
    public function delete(User $user, ConsentTerm $consentTerm)
    {
        return $user->can('Admin.ConsentTerm.Delete');
    }
}
