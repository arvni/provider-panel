<?php

namespace Tests\Feature\Admin;

use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use Database\Seeders\RoleAndPermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia;
use Tests\TestCase;

/**
 * Admin CRUD coverage for the Role resource (gated by RolePolicy). Store/update
 * sync the role's permissions. Companion to SampleTypeAdminTest.
 */
class RoleAdminTest extends TestCase
{
    use RefreshDatabase;

    private function admin(): User
    {
        $this->seed(RoleAndPermissionSeeder::class);

        return User::factory()->admin()->create();
    }

    public function test_non_admin_cannot_create_a_role(): void
    {
        $permission = Permission::factory()->create();

        $this->actingAs(User::factory()->create())
            ->post(route('admin.roles.store'), ['name' => 'Editor', 'permissions' => [['id' => $permission->id]]])
            ->assertForbidden();

        $this->assertDatabaseMissing('roles', ['name' => 'Editor']);
    }

    public function test_non_admin_cannot_update_a_role(): void
    {
        $role = Role::factory()->create(['name' => 'Original']);
        $permission = Permission::factory()->create();

        $this->actingAs(User::factory()->create())
            ->put(route('admin.roles.update', $role), ['name' => 'Renamed', 'permissions' => [['id' => $permission->id]]])
            ->assertForbidden();

        $this->assertDatabaseHas('roles', ['id' => $role->id, 'name' => 'Original']);
    }

    public function test_non_admin_cannot_list_roles(): void
    {
        $this->actingAs(User::factory()->create())
            ->get(route('admin.roles.index'))
            ->assertForbidden();
    }

    public function test_non_admin_cannot_delete_a_role(): void
    {
        $role = Role::factory()->create();

        $this->actingAs(User::factory()->create())
            ->delete(route('admin.roles.destroy', $role))
            ->assertForbidden();

        $this->assertDatabaseHas('roles', ['id' => $role->id]);
    }

    public function test_admin_can_create_a_role_with_permissions(): void
    {
        $permission = Permission::factory()->create();

        $this->actingAs($this->admin())
            ->post(route('admin.roles.store'), ['name' => 'Editor', 'permissions' => [['id' => $permission->id]]])
            ->assertRedirect(route('admin.roles.index'));

        $this->assertDatabaseHas('roles', ['name' => 'Editor']);
        $this->assertTrue(Role::where('name', 'Editor')->first()->hasPermissionTo($permission));
    }

    public function test_admin_can_update_a_role(): void
    {
        $role = Role::factory()->create(['name' => 'Original']);
        $permission = Permission::factory()->create();

        $this->actingAs($this->admin())
            ->put(route('admin.roles.update', $role), ['name' => 'Updated', 'permissions' => [['id' => $permission->id]]])
            ->assertRedirect(route('admin.roles.index'));

        $this->assertDatabaseHas('roles', ['id' => $role->id, 'name' => 'Updated']);
        $this->assertTrue($role->fresh()->hasPermissionTo($permission));
    }

    public function test_admin_can_list_roles(): void
    {
        $this->actingAs($this->admin())
            ->get(route('admin.roles.index'))
            ->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page->component('Role/Index'));
    }

    public function test_admin_can_delete_a_role_without_users(): void
    {
        $role = Role::factory()->create();

        $this->actingAs($this->admin())
            ->delete(route('admin.roles.destroy', $role))
            ->assertRedirect();

        $this->assertDatabaseMissing('roles', ['id' => $role->id]);
    }
}
