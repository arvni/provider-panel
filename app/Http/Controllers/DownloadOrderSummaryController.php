<?php

namespace App\Http\Controllers;

use App\Models\Order;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;
use Illuminate\Http\Request;

class DownloadOrderSummaryController extends Controller
{
    /**
     * Handle the incoming request.
     */
    public function __invoke(Order $order)
    {
        $order->load("Patient", "User", "Samples", "Tests");
        $orderId = "OR" . Carbon::parse($order->created_at)->format(".Ymd.") . $order->id;
        $rendered = view("Order", ["order" => $order, "orderId" => $orderId])->render();
        $pdf = Pdf::loadHTML($rendered);
        $pdf->setPaper("a5");
        return $pdf->download("$orderId.pdf");
    }
}
