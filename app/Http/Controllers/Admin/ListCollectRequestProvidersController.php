<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\CollectRequest;
use App\Models\User;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Providers an admin may raise a collect request for, for the picker on the
 * admin "new collection request" form.
 */
class ListCollectRequestProvidersController extends Controller
{
    /**
     * @throws AuthorizationException
     */
    public function __invoke(Request $request): JsonResponse
    {
        $this->authorize('create', CollectRequest::class);

        $search = $request->input('filters.search', $request->get('search'));

        $users = User::query()
            ->select(['id', 'name', 'userName', 'email'])
            ->when($search, fn ($query) => $query->search($search, ['name', 'userName', 'email', 'mobile']))
            ->orderBy('name')
            ->limit(25)
            ->get();

        return response()->json(['data' => $users]);
    }
}
