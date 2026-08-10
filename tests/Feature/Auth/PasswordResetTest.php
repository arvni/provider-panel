<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class PasswordResetTest extends TestCase
{
    use RefreshDatabase;

    public function test_reset_password_link_screen_can_be_rendered(): void
    {
        $response = $this->get('/forgot-password');

        $response->assertStatus(200);
    }

    public function test_reset_password_link_can_be_requested(): void
    {
        Notification::fake();

        $user = User::factory()->create();

        $this->post('/forgot-password', ['email' => $user->email]);

        Notification::assertSentTo($user, ResetPassword::class);
    }

    public function test_reset_password_link_request_does_not_reveal_whether_the_account_exists(): void
    {
        Notification::fake();

        $user = User::factory()->create();

        $known = $this->post('/forgot-password', ['email' => $user->email]);
        $unknown = $this->post('/forgot-password', ['email' => 'nobody@example.com']);

        $unknown->assertSessionHasNoErrors();
        $this->assertSame(
            $known->getSession()->get('status'),
            $unknown->getSession()->get('status')
        );

        Notification::assertSentToTimes($user, ResetPassword::class, 1);
    }

    public function test_reset_password_link_request_does_not_reveal_throttling(): void
    {
        Notification::fake();

        $user = User::factory()->create();

        $this->post('/forgot-password', ['email' => $user->email]);
        $throttled = $this->post('/forgot-password', ['email' => $user->email]);

        $throttled->assertSessionHasNoErrors();
        $throttled->assertSessionHas('status');
    }

    public function test_reset_password_screen_can_be_rendered(): void
    {
        Notification::fake();

        $user = User::factory()->create();

        $this->post('/forgot-password', ['email' => $user->email]);

        Notification::assertSentTo($user, ResetPassword::class, function ($notification) {
            $response = $this->get('/reset-password/'.$notification->token);

            $response->assertStatus(200);

            return true;
        });
    }

    public function test_password_can_be_reset_with_valid_token(): void
    {
        Notification::fake();

        $user = User::factory()->create();

        $this->post('/forgot-password', ['email' => $user->email]);

        Notification::assertSentTo($user, ResetPassword::class, function ($notification) use ($user) {
            $response = $this->post('/reset-password', [
                'token' => $notification->token,
                'email' => $user->email,
                'password' => 'password',
                'password_confirmation' => 'password',
            ]);

            $response->assertSessionHasNoErrors();

            return true;
        });
    }

    public function test_failed_password_reset_does_not_reveal_whether_the_account_exists(): void
    {
        $user = User::factory()->create();

        $payload = [
            'token' => 'a-token-that-was-never-issued',
            'password' => 'new-password',
            'password_confirmation' => 'new-password',
        ];

        $known = $this->post('/reset-password', ['email' => $user->email] + $payload);
        $unknown = $this->post('/reset-password', ['email' => 'nobody@example.com'] + $payload);

        $this->assertSame(
            $known->getSession()->get('errors')->get('email'),
            $unknown->getSession()->get('errors')->get('email')
        );
    }
}
