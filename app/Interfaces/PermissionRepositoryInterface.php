<?php


namespace App\Interfaces;



use Spatie\Permission\Models\Permission;

interface PermissionRepositoryInterface
{
    public function list(array $inputs);
    public function getAll(array $inputs);
    public function preparedPermissions();
    public function create($permissionDetails);

    public function show(Permission $permission);

    public function update(Permission $permission, $newPermissionDetails);

    public function delete(Permission $permission);

    public function getPermissionByName(string $name);
}
