<?php

namespace App\Interfaces;

use App\Models\User;

interface UserRepositoryInterface
{
    public function list(array $queryData);

    public function getAll(array $queryData);

    public function create(array $userData);

    public function getById($id): User|null;

    public function show(User $user);

    public function edit(User $user, array $newUserData);

    public function destroy(User $user);

}
