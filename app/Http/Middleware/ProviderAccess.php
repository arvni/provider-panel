<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ProviderAccess
{
    /**
     * Gate a provider-facing route behind a permission. Access requires the user
     * to hold the given permission (granted through an assigned role); a user
     * without a role has no access.
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
