<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ProviderAccess
{
    /**
     * Gate a provider-facing route behind a permission. Users without a role
     * keep the default self-service access (see User::PROVIDER_PERMISSIONS);
     * users with a role must hold the given permission explicitly.
     *
     * Usage: ->middleware('providerAccess:Order.Index')
     */
    public function handle(Request $request, Closure $next, string $permission): Response
    {
        $user = $request->user();

        if (! $user || ! $user->hasAccess($permission)) {
            abort(403);
        }

        return $next($request);
    }
}
