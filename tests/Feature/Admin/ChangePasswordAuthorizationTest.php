<?php

namespace Tests\Feature\Admin;

use App\Models\User;
use Database\Seeders\RoleAndPermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class ChangePasswordAuthorizationTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_change_another_users_password(): void
    {
        $this->seed(RoleAndPermissionSeeder::class);

        $admin = User::factory()->admin()->create();
        $user = User::factory()->create();

        $response = $this->actingAs($admin)
            ->put(route('admin.users.updatePassword', $user), [
                'password' => 'new-password-123',
                'password_confirmation' => 'new-password-123',
            ]);

        $response->assertRedirect(route('admin.users.index'));
        $this->assertTrue(Hash::check('new-password-123', $user->fresh()->password));
    }

    public function test_non_admin_cannot_change_another_users_password(): void
    {
        $this->seed(RoleAndPermissionSeeder::class);

        $actor = User::factory()->create();
        $target = User::factory()->create();
        $originalPassword = $target->password;

        $response = $this->actingAs($actor)
            ->put(route('admin.users.updatePassword', $target), [
                'password' => 'new-password-123',
                'password_confirmation' => 'new-password-123',
            ]);

        $response->assertForbidden();
        $this->assertSame($originalPassword, $target->fresh()->password);
    }
}
