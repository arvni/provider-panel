<?php

namespace Tests\Feature\Admin;

use App\Models\User;
use Database\Seeders\RoleAndPermissionSeeder;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class UserPasswordResetTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_send_reset_password_email_to_user(): void
    {
        Notification::fake();
        $this->seed(RoleAndPermissionSeeder::class);

        $admin = User::factory()->admin()->create();
        $user = User::factory()->create();

        $response = $this->actingAs($admin)
            ->post(route('admin.users.sendResetPassword', $user));

        $response->assertRedirect(route('admin.users.index'));
        $response->assertSessionHas('success', true);

        Notification::assertSentTo($user, ResetPassword::class);
    }

    public function test_non_admin_cannot_send_reset_password_email(): void
    {
        Notification::fake();
        $this->seed(RoleAndPermissionSeeder::class);

        $user = User::factory()->create();
        $target = User::factory()->create();

        $response = $this->actingAs($user)
            ->post(route('admin.users.sendResetPassword', $target));

        $response->assertForbidden();

        Notification::assertNothingSentTo($target);
    }

    public function test_guests_cannot_send_reset_password_email(): void
    {
        Notification::fake();

        $target = User::factory()->create();

        $response = $this->post(route('admin.users.sendResetPassword', $target));

        $response->assertRedirect(route('login'));

        Notification::assertNothingSentTo($target);
    }
}
