<?php

namespace App\Http\Controllers;

use App\Interfaces\OrderRepositoryInterface;
use App\Models\PreOrder;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    protected OrderRepositoryInterface $orderRepository;

    public function __construct(OrderRepositoryInterface $orderRepository)
    {
        $this->orderRepository = $orderRepository;
    }

    /**
     * Handle the incoming request.
     */
    public function __invoke(): Response
    {
        $recentlyOrders = $this->orderRepository->getRecentlyOrders();
        $notDownloadedReports = $this->orderRepository->notDownloadedOrdersReportCount();
        // Open pre-orders where BION is waiting on this center.
        $preOrdersNeedingAction = PreOrder::query()
            ->where('user_id', auth()->id())
            ->whereNull('closed_at')
            ->where('action_owner', 'center')
            ->count();

        return Inertia::render('Dashboard', compact('recentlyOrders', 'notDownloadedReports', 'preOrdersNeedingAction'));
    }
}
