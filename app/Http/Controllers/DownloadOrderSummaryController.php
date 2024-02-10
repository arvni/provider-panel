<?php

namespace App\Http\Controllers;

use App\Models\Order;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;

class DownloadOrderSummaryController extends Controller
{
    /**
     * Handle the incoming request.
     */
    public function __invoke(Order $order)
    {
        $order->load("Patient", "User", "Samples","Tests");
        $rendered = view("Order", ["order" => $order])->render();
        $pdf = Pdf::loadHTML($rendered);
        return $pdf->download("$order->id.pdf");
    }
}
