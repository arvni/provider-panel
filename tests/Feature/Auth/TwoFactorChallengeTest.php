<?php

namespace Tests\Feature\Auth;

use App\Models\TwoFactorCode;
use App\Models\User;
use App\Notifications\TwoFactorCodeNotification;
use App\Providers\RouteServiceProvider;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Notifications\Events\NotificationSending;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class TwoFactorChallengeTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        // The login form only requires a Turnstile token when a site key is
        // configured; keep it unset so these tests post plain credentials.
        config(['services.turnstile.site_key' => null]);
        config(['two_factor.enabled' => true]);
    }

    /**
     * Factory users get a random `active` flag, but login requires an active
     * account, so force it on.
     */
    private function activeUser(): User
    {
        return User::factory()->create(['active' => true]);
    }

    /**
     * A valid "password verified, awaiting code" session marker.
     *
     * @return array<string, array<string, mixed>>
     */
    private function pendingSession(User $user, bool $remember = false): array
    {
        return [
            'auth.2fa' => [
                'user_id' => $user->id,
                'remember' => $remember,
                'expires_at' => now()->addMinutes(10)->getTimestamp(),
            ],
        ];
    }

    private function issueCode(User $user, string $code = '111111', ?\DateTimeInterface $expiresAt = null): TwoFactorCode
    {
        return TwoFactorCode::create([
            'user_id' => $user->id,
            'code_hash' => Hash::make($code),
            'attempts' => 0,
            'expires_at' => $expiresAt ?? now()->addMinutes(10),
        ]);
    }

    public function test_correct_password_does_not_authenticate_but_sends_a_code(): void
    {
        Notification::fake();

        $user = $this->activeUser();

        $response = $this->post('/login', [
            'email' => $user->email,
            'password' => 'password',
        ]);

        $this->assertGuest();
        $response->assertRedirect(route('two-factor.challenge'));

        $this->assertDatabaseHas('two_factor_codes', ['user_id' => $user->id]);
        Notification::assertSentTo($user, TwoFactorCodeNotification::class);
    }

    public function test_login_completes_immediately_when_two_factor_is_disabled(): void
    {
        Notification::fake();
        config(['two_factor.enabled' => false]);

        $user = $this->activeUser();

        $response = $this->post('/login', [
            'email' => $user->email,
            'password' => 'password',
        ]);

        $this->assertAuthenticatedAs($user);
        $response->assertRedirect(RouteServiceProvider::HOME);

        $this->assertDatabaseMissing('two_factor_codes', ['user_id' => $user->id]);
        Notification::assertNothingSent();
    }

    public function test_a_correct_code_completes_the_login_and_burns_the_code(): void
    {
        $user = $this->activeUser();
        $this->issueCode($user, '111111');

        $response = $this
            ->withSession($this->pendingSession($user))
            ->post(route('two-factor.verify'), ['code' => '111111']);

        $this->assertAuthenticatedAs($user);
        $response->assertRedirect(RouteServiceProvider::HOME);

        // The one-time code must not survive a successful login.
        $this->assertDatabaseMissing('two_factor_codes', ['user_id' => $user->id]);
    }

    public function test_an_incorrect_code_is_rejected_and_counts_against_the_attempt_limit(): void
    {
        $user = $this->activeUser();
        $this->issueCode($user, '111111');

        $response = $this
            ->withSession($this->pendingSession($user))
            ->post(route('two-factor.verify'), ['code' => '222222']);

        $this->assertGuest();
        $response->assertSessionHasErrors('code');

        $this->assertDatabaseHas('two_factor_codes', [
            'user_id' => $user->id,
            'attempts' => 1,
        ]);
    }

    public function test_an_expired_code_sends_the_user_back_to_login(): void
    {
        $user = $this->activeUser();
        $this->issueCode($user, '111111', now()->subMinute());

        $response = $this
            ->withSession($this->pendingSession($user))
            ->post(route('two-factor.verify'), ['code' => '111111']);

        $this->assertGuest();
        $response->assertRedirect(route('login'));

        // A lapsed code is cleared so it can never be reused.
        $this->assertDatabaseMissing('two_factor_codes', ['user_id' => $user->id]);
    }

    public function test_the_challenge_screen_requires_a_pending_session(): void
    {
        // No auth.2fa marker means the user never cleared the password step.
        $response = $this->get(route('two-factor.challenge'));

        $response->assertRedirect(route('login'));
    }

    public function test_resend_issues_a_fresh_code(): void
    {
        Notification::fake();

        $user = $this->activeUser();
        $this->issueCode($user, '111111');

        $response = $this
            ->withSession($this->pendingSession($user))
            ->post(route('two-factor.resend'));

        $response->assertSessionHas('status');
        Notification::assertSentTo($user, TwoFactorCodeNotification::class);
    }

    public function test_a_send_failure_during_login_clears_the_code_and_surfaces_an_error(): void
    {
        // Simulate the mail transport blowing up mid-send. Because the
        // notification is queued on the sync connection, the failure propagates
        // back into the controller's try/catch.
        Event::listen(NotificationSending::class, function (): void {
            throw new \RuntimeException('mail transport unavailable');
        });

        $user = $this->activeUser();

        $response = $this->post('/login', [
            'email' => $user->email,
            'password' => 'password',
        ]);

        $this->assertGuest();
        $response->assertSessionHasErrors('email');

        // The dangling code the user could never receive must be cleaned up.
        $this->assertDatabaseMissing('two_factor_codes', ['user_id' => $user->id]);
    }
}
