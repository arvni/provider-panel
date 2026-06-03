<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\TwoFactorCode;
use App\Models\User;
use App\Notifications\TwoFactorCodeNotification;
use App\Providers\RouteServiceProvider;
use Illuminate\Auth\Events\Lockout;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class TwoFactorChallengeController extends Controller
{
    /**
     * Session key holding the pending (password-verified, not-yet-logged-in) user.
     */
    private const SESSION_KEY = 'auth.2fa';

    /**
     * Display the code-entry screen.
     */
    public function create(Request $request): Response|RedirectResponse
    {
        $pending = $this->pending($request);

        if ($pending === null) {
            return redirect()->route('login');
        }

        $user = User::find($pending['user_id']);

        if ($user === null) {
            $this->forget($request);

            return redirect()->route('login');
        }

        return Inertia::render('Auth/TwoFactorChallenge', [
            'email' => $this->maskEmail($user->email),
            'status' => session('status'),
        ]);
    }

    /**
     * Verify a submitted code and, on success, complete the login.
     *
     * @throws ValidationException
     */
    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'code' => ['required', 'string', 'regex:/^[0-9]{6}$/'],
        ]);

        $pending = $this->pending($request);

        if ($pending === null) {
            return redirect()->route('login')->withErrors([
                'code' => __('Your session expired. Please sign in again.'),
            ]);
        }

        $this->ensureIsNotRateLimited($request, $pending['user_id']);

        $user = User::find($pending['user_id']);
        $challenge = $user ? TwoFactorCode::where('user_id', $user->id)->first() : null;

        // No challenge, or it lapsed: force the user to start over.
        if ($user === null || $challenge === null || $challenge->isExpired()) {
            $challenge?->delete();
            $this->forget($request);

            return redirect()->route('login')->withErrors([
                'code' => __('Your verification code expired. Please sign in again.'),
            ]);
        }

        // Count the guess before checking it so a wrong code can never be retried for free.
        $challenge->increment('attempts');

        if (! $challenge->matches($request->input('code'))) {
            RateLimiter::hit($this->throttleKey($request, $pending['user_id']));

            if ($challenge->attempts >= config('two_factor.max_attempts', 5)) {
                $challenge->delete();
                $this->forget($request);

                return redirect()->route('login')->withErrors([
                    'code' => __('Too many incorrect codes. Please sign in again.'),
                ]);
            }

            throw ValidationException::withMessages([
                'code' => __('The code you entered is incorrect.'),
            ]);
        }

        // Success: burn the code, clear limiters, and establish the session.
        $challenge->delete();
        RateLimiter::clear($this->throttleKey($request, $pending['user_id']));

        $remember = (bool) ($pending['remember'] ?? false);
        $this->forget($request);

        Auth::login($user, $remember);
        $request->session()->regenerate();

        return redirect()->intended(RouteServiceProvider::HOME);
    }

    /**
     * Issue a new code, throttled to discourage email flooding.
     */
    public function resend(Request $request): RedirectResponse
    {
        $pending = $this->pending($request);

        if ($pending === null) {
            return redirect()->route('login');
        }

        $user = User::find($pending['user_id']);

        if ($user === null) {
            $this->forget($request);

            return redirect()->route('login');
        }

        $resendKey = 'two-factor-resend:' . $user->id;
        $throttle = (int) config('two_factor.resend_throttle', 60);

        if (RateLimiter::tooManyAttempts($resendKey, 1)) {
            $seconds = RateLimiter::availableIn($resendKey);

            throw ValidationException::withMessages([
                'code' => __('Please wait :seconds seconds before requesting another code.', ['seconds' => $seconds]),
            ]);
        }

        RateLimiter::hit($resendKey, $throttle);

        $code = TwoFactorCode::generateFor($user);
        $user->notify(new TwoFactorCodeNotification($code));

        return back()->with('status', __('A new code has been sent to your email.'));
    }

    /**
     * @return array{user_id:int, remember:bool, expires_at:int}|null
     */
    private function pending(Request $request): ?array
    {
        $pending = $request->session()->get(self::SESSION_KEY);

        if (! is_array($pending) || ! isset($pending['user_id'], $pending['expires_at'])) {
            return null;
        }

        // The pending window mirrors the code lifetime; never trust a stale marker.
        if (now()->getTimestamp() > $pending['expires_at']) {
            $this->forget($request);

            return null;
        }

        return $pending;
    }

    private function forget(Request $request): void
    {
        $request->session()->forget(self::SESSION_KEY);
    }

    /**
     * @throws ValidationException
     */
    private function ensureIsNotRateLimited(Request $request, int $userId): void
    {
        if (! RateLimiter::tooManyAttempts($this->throttleKey($request, $userId), 5)) {
            return;
        }

        event(new Lockout($request));

        $seconds = RateLimiter::availableIn($this->throttleKey($request, $userId));

        throw ValidationException::withMessages([
            'code' => __('Too many attempts. Please try again in :seconds seconds.', ['seconds' => $seconds]),
        ]);
    }

    private function throttleKey(Request $request, int $userId): string
    {
        return Str::lower('two-factor|' . $userId . '|' . $request->ip());
    }

    /**
     * Reveal just enough of the address to reassure the user without exposing it.
     */
    private function maskEmail(string $email): string
    {
        [$name, $domain] = array_pad(explode('@', $email, 2), 2, '');

        if ($domain === '') {
            return $email;
        }

        $visible = mb_substr($name, 0, 1);
        $masked = $visible . str_repeat('*', max(mb_strlen($name) - 1, 1));

        return $masked . '@' . $domain;
    }
}
