<?php

namespace App\Http\Controllers;

use App\Interfaces\OrderRepositoryInterface;
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
        return Inertia::render('Dashboard', compact("recentlyOrders", "notDownloadedReports"));
    }
}
