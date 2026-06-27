<?php

namespace App\Policies;

use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;
use Illuminate\Auth\Access\Response;

class UserPolicy
{
    use HandlesAuthorization;

    /**
     * Determine whether the user can view any models.
     *
     * @return Response|bool
     */
    public function viewAny(User $user)
    {
        return $user->can('Admin.User.Index');
    }

    /**
     * Determine whether the user can view the model.
     *
     * @return Response|bool
     */
    public function view(User $user, User $model)
    {
        return $user->can('Admin.User.Show');
    }

    /**
     * Determine whether the user can create models.
     *
     * @return Response|bool
     */
    public function create(User $user)
    {
        return $user->can('Admin.User.Create');
    }

    /**
     * Determine whether the user can update the model.
     *
     * @return Response|bool
     */
    public function update(User $user, User $model)
    {
        return $user->can('Admin.User.Update');
    }

    /**
     * Determine whether the user can delete the model.
     *
     * @return Response|bool
     */
    public function delete(User $user, User $model)
    {
        return $user->can('Admin.User.Delete');
    }

    /**
     * Determine whether the user can view any models.
     *
     * @return Response|bool
     */
    public function sync(User $user)
    {
        return $user->can('Admin.User.Sync');
    }

    public function changePassword(User $user)
    {
        return $user->can('Admin.User.Update');
    }
}
