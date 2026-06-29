<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Interfaces\OrderRepositoryInterface;
use App\Models\Order;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class OrderController extends Controller
{
    protected OrderRepositoryInterface $orderRepository;

    public function __construct(OrderRepositoryInterface $orderRepository)
    {
        $this->orderRepository = $orderRepository;
        $this->middleware('indexProvider')->only('index');
    }

    /**
     * Display a listing of every order across all providers.
     *
     * @throws AuthorizationException
     */
    public function index(Request $request): Response
    {
        $this->authorize('viewAny', Order::class);
        $requestInputs = $request->all();
        $orders = $this->orderRepository->list($requestInputs);

        return Inertia::render('Order/AdminIndex', ['orders' => $orders, 'request' => $requestInputs]);
    }
}
