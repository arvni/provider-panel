<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Password;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use RyanChandler\LaravelCloudflareTurnstile\Rules\Turnstile;

class PasswordResetLinkController extends Controller
{
    /**
     * Generic response shown for every reset link request, so the endpoint
     * cannot be used to discover which email addresses have an account.
     */
    private const STATUS = 'If an account exists for that email address, a password reset link has been sent to it.';

    /**
     * Display the password reset link request view.
     */
    public function create(Request $request): Response
    {
        return Inertia::render('Auth/ForgotPassword', [
            'status' => session('status'),
            'siteKey' => config('services.turnstile.site_key'),
        ]);
    }

    /**
     * Handle an incoming password reset link request.
     *
     * @throws ValidationException
     */
    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'email' => 'required|email',
            'cf-turnstile-response' => config('services.turnstile.site_key')
                ? ['required', app(Turnstile::class)]
                : [],
        ]);

        // Attempt to send the reset link, but ignore the outcome: an unknown
        // address, a throttled request and a delivered link all get the same
        // answer so that nobody can probe this endpoint for valid accounts.
        Password::sendResetLink(
            $request->only('email')
        );

        return back()->with('status', __(self::STATUS));
    }
}
