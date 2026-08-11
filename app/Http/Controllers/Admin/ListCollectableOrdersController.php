<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Interfaces\OrderRepositoryInterface;
use App\Models\CollectRequest;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * The orders of a given provider that may still be attached to a new collect
 * request: requested, and not already tied to one. Feeds the order picker on the
 * admin "new collection request" form.
 */
class ListCollectableOrdersController extends Controller
{
    protected OrderRepositoryInterface $orderRepository;

    public function __construct(OrderRepositoryInterface $orderRepository)
    {
        $this->orderRepository = $orderRepository;
    }

    /**
     * @throws AuthorizationException
     */
    public function __invoke(Request $request): JsonResponse
    {
        $this->authorize('create', CollectRequest::class);

        $validated = $request->validate([
            'user_id' => ['required', 'integer', 'exists:users,id'],
            'search' => ['nullable', 'string'],
        ]);

        $orders = $this->orderRepository->listCollectable(
            (int) $validated['user_id'],
            $validated['search'] ?? null,
        );

        return response()->json(['data' => $orders]);
    }
}
