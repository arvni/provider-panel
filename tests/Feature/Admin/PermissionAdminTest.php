<?php

namespace Tests\Feature\Admin;

use App\Models\Permission;
use App\Models\User;
use Database\Seeders\RoleAndPermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia;
use Tests\TestCase;

/**
 * Admin CRUD coverage for the Permission resource (gated by PermissionPolicy).
 * The resource route excludes create/edit. `show` authorization is also
 * characterized in AdminShowAuthorizationTest. Companion to SampleTypeAdminTest.
 */
class PermissionAdminTest extends TestCase
{
    use RefreshDatabase;

    private function admin(): User
    {
        $this->seed(RoleAndPermissionSeeder::class);

        return User::factory()->admin()->create();
    }

    public function test_non_admin_cannot_create_a_permission(): void
    {
        $this->actingAs(User::factory()->create())
            ->post(route('admin.permissions.store'), ['name' => 'Custom.Permission'])
            ->assertForbidden();

        $this->assertDatabaseMissing('permissions', ['name' => 'Custom.Permission']);
    }

    public function test_non_admin_cannot_update_a_permission(): void
    {
        $permission = Permission::factory()->create(['name' => 'Original.Permission']);

        $this->actingAs(User::factory()->create())
            ->put(route('admin.permissions.update', $permission), ['name' => 'Renamed.Permission'])
            ->assertForbidden();

        $this->assertDatabaseHas('permissions', ['id' => $permission->id, 'name' => 'Original.Permission']);
    }

    public function test_non_admin_cannot_list_permissions(): void
    {
        $this->actingAs(User::factory()->create())
            ->get(route('admin.permissions.index'))
            ->assertForbidden();
    }

    public function test_non_admin_cannot_delete_a_permission(): void
    {
        $permission = Permission::factory()->create();

        $this->actingAs(User::factory()->create())
            ->delete(route('admin.permissions.destroy', $permission))
            ->assertForbidden();

        $this->assertDatabaseHas('permissions', ['id' => $permission->id]);
    }

    public function test_admin_can_create_a_permission(): void
    {
        $this->actingAs($this->admin())
            ->post(route('admin.permissions.store'), ['name' => 'Custom.Permission'])
            ->assertRedirect();

        $this->assertDatabaseHas('permissions', ['name' => 'Custom.Permission']);
    }

    public function test_admin_can_update_a_permission(): void
    {
        $permission = Permission::factory()->create(['name' => 'Original.Permission']);

        $this->actingAs($this->admin())
            ->put(route('admin.permissions.update', $permission), ['name' => 'Updated.Permission'])
            ->assertRedirect();

        $this->assertDatabaseHas('permissions', ['id' => $permission->id, 'name' => 'Updated.Permission']);
    }

    public function test_admin_can_list_permissions(): void
    {
        $this->actingAs($this->admin())
            ->get(route('admin.permissions.index'))
            ->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page->component('Permission/Index'));
    }

    public function test_admin_can_delete_a_permission_without_roles(): void
    {
        // Seed first: the seeder assigns *every* existing permission to the Admin
        // role, so this fresh permission must be created afterwards to stay
        // role-less (destroy refuses to delete a permission that has roles).
        $admin = $this->admin();
        $permission = Permission::factory()->create();

        $this->actingAs($admin)
            ->delete(route('admin.permissions.destroy', $permission))
            ->assertRedirect();

        $this->assertDatabaseMissing('permissions', ['id' => $permission->id]);
    }
}
