<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $props = [
            ...parent::share($request),
            'auth' => [
                'user' => $request->user(),
                'permissions' => auth()->user() ? auth()->user()->effectivePermissions() : null,
            ],
        ];
        if ($request->session()->has('success')) {
            $props['success'] = $request->session()->get('success');
        }
        if ($request->session()->has('status')) {
            $props['status'] = $request->session()->get('status');
        }
        // Controllers have long flashed `error` alongside `status` to mark a
        // message as a failure; without sharing it the page could only ever
        // report the message as good news.
        if ($request->session()->has('error')) {
            $props['error'] = $request->session()->get('error');
        }

        return $props;
    }
}
