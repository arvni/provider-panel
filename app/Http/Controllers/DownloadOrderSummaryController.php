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
        $this->authorize("view", $order);
        $order->load([
            "Patient",
            "User",
            "OrderItems.Samples.SampleType",
            "OrderItems.Samples.Material",
            "OrderItems.Samples.Patient",
            "Tests"
        ]);

        // Flatten samples for PDF view
        $order->samples = $order->OrderItems->pluck('Samples')->flatten()->values();

        $rendered = view("Order", ["order" => $order])->render();
        $pdf = Pdf::loadHTML($rendered);
        $pdf->setPaper("a5");
        return $pdf->download("$order->orderId.pdf");
    }
}
