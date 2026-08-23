<?php

namespace App\Http\Controllers\Admin;

use App\Exceptions\ApiServiceException;
use App\Http\Controllers\Controller;
use App\Interfaces\OrderRepositoryInterface;
use App\Models\Order;
use App\Notifications\OrderStatusUpdated;
use App\Services\OrderStatusSync;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Notification;
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

    /**
     * Re-send the order's notification for the status it is sitting on now.
     *
     * The observer only mails on a transition, so once a provider loses the
     * original -- a bounced address, a spam folder, a mailbox that was not set
     * up yet -- there is no way to get it back out short of pushing the status
     * away and back again. This hands admins that one action directly.
     *
     * @throws AuthorizationException
     */
    public function resendNotification(Order $order): RedirectResponse
    {
        $this->authorize('resendNotification', $order);

        // orders.user_id is non-nullable and constrained, so every order has a
        // provider to mail.
        $order->load('User');

        Notification::send([$order->User], new OrderStatusUpdated($order));

        return back()->with([
            'status' => sprintf(
                'The "%s" notification has been queued for %s.',
                $order->status->value,
                $order->User->name,
            ),
            'success' => true,
        ]);
    }

    /**
     * Look up this order's current status at the lab, without waiting for the sweep.
     *
     * Read-only as far as the lab is concerned: the request carries nothing but
     * the order's id, and the reply is applied here. sync:orders asks the same
     * question every five minutes, which is fine as a background job but no use
     * to an admin on the phone to a provider asking where a sample got to.
     *
     * @throws AuthorizationException
     */
    public function fetchStatus(Order $order, OrderStatusSync $sync): RedirectResponse
    {
        $this->authorize('fetchStatus', $order);

        $statusBefore = $order->status;

        try {
            // The order is mutated in place, so its new state is readable below.
            $synced = $sync->sync(collect([$order]));
        } catch (ApiServiceException $e) {
            Log::warning('On-demand order status lookup failed', [
                'order_id' => $order->id,
                'error' => $e->getMessage(),
            ]);

            return back()->with([
                'status' => 'The lab could not be reached. Please try again shortly.',
                'error' => true,
            ]);
        }

        if ($synced === 0) {
            return back()->with([
                'status' => sprintf('The lab has no record of order %s yet.', $order->orderId),
                'error' => true,
            ]);
        }

        if ($order->status === $statusBefore) {
            return back()->with([
                'status' => sprintf(
                    'Order %s is already up to date with the lab (%s).',
                    $order->orderId,
                    $statusBefore->value,
                ),
                'success' => true,
            ]);
        }

        return back()->with([
            'status' => sprintf(
                'Order %s moved from "%s" to "%s".',
                $order->orderId,
                $statusBefore->value,
                $order->status->value,
            ),
            'success' => true,
        ]);
    }
}
