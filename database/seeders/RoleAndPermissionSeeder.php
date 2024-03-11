<?php

namespace Database\Seeders;

use App\Models\Role;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;

class RoleAndPermissionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $role = Role::findOrCreate("Admin");
        $permissions = [
            "Admin" => [
                "OrderMaterial" => [
                    "Index",
                    "Show",
                    "Create",
                    "Update",
                    "Delete"
                ],
                "Order" => [
                    "Index",
                    "Show",
                    "Create",
                    "Update",
                    "Delete"
                ],
                "CollectRequest" => [
                    "Index",
                    "Show",
                    "Create",
                    "Update",
                    "Delete"
                ],
                "Test" => [
                    "Index",
                    "Show",
                    "Create",
                    "Update",
                    "Delete"
                ],
                "SampleType" => [
                    "Index",
                    "Show",
                    "Create",
                    "Update",
                    "Delete"
                ],
                "OrderForm" => [
                    "Index",
                    "Show",
                    "Create",
                    "Update",
                    "Delete"
                ],
                "Consent" => [
                    "Index",
                    "Show",
                    "Create",
                    "Update",
                    "Delete"
                ],
                "Instruction" => [
                    "Index",
                    "Show",
                    "Create",
                    "Update",
                    "Delete"
                ],
                "ConsentTerm" => [
                    "Index",
                    "Show",
                    "Create",
                    "Update",
                    "Delete"
                ],
                "Permission" => [
                    "Index",
                    "Show",
                    "Create",
                    "Update",
                    "Delete"
                ],
                "Role" => [
                    "Index",
                    "Show",
                    "Create",
                    "Update",
                    "Delete"
                ],
                "User" => [
                    "Index",
                    "Show",
                    "Create",
                    "Update",
                    "Delete",
                    "Sync"
                ],
            ]
        ];
        $q = [];
        foreach ($permissions as $key => $value) {
            $q = [...$q, ...$this->createPermissions($key, $value)];
            if (is_string($key)) {
                $permission = Permission::findOrCreate("$key");
                $q = [...$q, $permission->id];
            }
        }
        $role->givePermissionTo(Permission::all()->pluck("id")->flatten()->toArray());
    }

    private function createPermissions($key, $value)
    {
        $output = [];
        if (is_array($value)) {
            foreach ($value as $k => $v) {
                $index = ".$k";
                if (is_numeric($k))
                    $index = "";
                $output = [...$output, ...$this->createPermissions("$key$index", $v)];
            }
        } else {
            $index = "$key.";
            if (is_numeric($key))
                $index = "";
            $permission = Permission::findOrCreate("$index$value");
            return [...$output, $permission->id];
        }
        return $output;
    }
}
