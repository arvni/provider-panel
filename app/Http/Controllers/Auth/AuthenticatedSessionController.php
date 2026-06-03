<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Models\TwoFactorCode;
use App\Notifications\TwoFactorCodeNotification;
use App\Providers\RouteServiceProvider;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Inertia\Response;

class AuthenticatedSessionController extends Controller
{
    /**
     * Display the login view.
     */
    public function create(): Response
    {
        return Inertia::render('Auth/Login', [
            'canResetPassword' => Route::has('password.request'),
            'status' => session('status'),
            'siteKey'=>config("services.turnstile.site_key")
        ]);
    }

    /**
     * Handle an incoming authentication request.
     * @param LoginRequest $request
     * @return RedirectResponse
     * @throws \Illuminate\Validation\ValidationException
     */
    public function store(LoginRequest $request): RedirectResponse
    {
        $user = $request->validateCredentials();

        // When 2FA is disabled (e.g. local/testing) complete login immediately.
        if (! config('two_factor.enabled', true)) {
            Auth::login($user, $request->boolean('remember'));
            $request->session()->regenerate();

            return redirect()->intended(RouteServiceProvider::HOME);
        }

        // Password is correct, but no session is created yet: e-mail a one-time
        // code and hold the user in a pending state until they confirm it.
        $code = TwoFactorCode::generateFor($user);
        $user->notify(new TwoFactorCodeNotification($code));

        $request->session()->put('auth.2fa', [
            'user_id' => $user->id,
            'remember' => $request->boolean('remember'),
            'expires_at' => now()->addMinutes(config('two_factor.expiry', 10))->getTimestamp(),
        ]);

        return redirect()->route('two-factor.challenge');
    }

    /**
     * Destroy an authenticated session.
     * @param Request $request
     * @return RedirectResponse
     */
    public function destroy(Request $request): RedirectResponse
    {
        $status = $request->session()->get("status");

        Auth::guard('web')->logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('login')->with('status', __($status));

    }
}
