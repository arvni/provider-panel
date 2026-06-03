<?php

namespace App\Http\Controllers;

use App\Enums\CollectRequestStatus;
use App\Enums\OrderStatus;
use App\Jobs\SendCollectionRequest;
use App\Models\CollectRequest;
use App\Models\Order;
use App\Models\Sample;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class StoreSampleCollectRequestController extends Controller
{
    /**
     * Create a collect request from a set of selected samples (per-sample).
     *
     * Unlike the order-level flow, only the chosen samples are tagged with the
     * new collect request. Their parent orders are attached too (the payload is
     * order-structured), but RequestLogistic only transmits the tagged samples,
     * so a partial selection of an order's samples is honoured end to end.
     */
    public function __invoke(Request $request)
    {
        $validated = $request->validate([
            "samples" => ["required", "array", "min:1"],
            "samples.*" => ["integer"],
            "preferred_date" => ["required", "date", "after_or_equal:today"],
            "note" => ["nullable", "string"],
            "address" => ["nullable", "string"],
        ]);

        $user = $request->user();
        $sampleIds = array_values(array_unique($validated["samples"]));

        // Authorisation + integrity: each sample must be un-collected and belong
        // to one of the provider's own orders.
        $samples = Sample::whereIn("id", $sampleIds)
            ->whereNull("collect_request_id")
            ->whereHas("OrderItems.Order", function ($query) use ($user) {
                $query->where("user_id", $user->id);
            })
            ->with("OrderItems")
            ->get();

        if ($samples->count() !== count($sampleIds)) {
            throw ValidationException::withMessages([
                "samples" => __("Some of the selected samples are not available for collection."),
            ]);
        }

        $orderIds = $samples
            ->pluck("OrderItems")
            ->flatten()
            ->pluck("order_id")
            ->filter()
            ->unique()
            ->values()
            ->all();

        if (empty($orderIds)) {
            throw ValidationException::withMessages([
                "samples" => __("The selected samples are not linked to any order."),
            ]);
        }

        $collectRequest = DB::transaction(function () use ($validated, $orderIds, $sampleIds, $user) {
            $collectRequest = CollectRequest::create([
                "user_id" => $user->id,
                "status" => CollectRequestStatus::REQUESTED,
                "preferred_date" => $validated["preferred_date"],
                "details" => ["address" => $validated["address"] ?? null],
                "notes" => $validated["note"] ?? null,
            ]);

            // Attach the parent orders so the order-structured payload can be built.
            Order::whereIn("id", $orderIds)->update([
                "collect_request_id" => $collectRequest->id,
                "status" => OrderStatus::LOGISTIC_REQUESTED,
            ]);

            // Tag ONLY the selected samples — this is what makes it per-sample.
            Sample::whereIn("id", $sampleIds)->update([
                "collect_request_id" => $collectRequest->id,
            ]);

            return $collectRequest;
        });

        SendCollectionRequest::dispatch($collectRequest);

        return back()->with(["status" => __("messages.ordersSuccessfullyRequestLogistic")]);
    }
}
