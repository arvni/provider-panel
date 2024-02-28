<?php

namespace App\Http\Controllers;

use App\Enums\OrderStatus;
use App\Models\Order;
use App\Services\ApiService;
use Carbon\Carbon;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Response;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class DownloadReportController extends Controller
{
    /**
     * Handle the incoming request.
     * @param Order $order
     * @param Request $request
     * @return BinaryFileResponse
     * @throws AuthorizationException
     */
    public function __invoke(Order $order, Request $request)
    {
        $this->authorize("report", $order);
        $filename ="$order->orderId.zip";
        $path = "Users/$order->user_id/Orders/$filename";
        $report = ApiService::get(config("api.report_path")."$order->server_id/report");
        abort_if(!$report->ok(), $report->status());
        if (Storage::exists($path))
            Storage::delete($path);
        Storage::disk('local')->put($path, $report);
        $order->status=OrderStatus::REPORT_DOWNLOADED;
        $order->save();
        return Response::download(storage_path("app/" . $path), $filename);
    }
}
