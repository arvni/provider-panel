<?php

namespace App\Http\Controllers;

use App\Models\Sample;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SampleController extends Controller
{
    /**
     * List the current provider's samples that have NOT yet been picked up by a
     * collect request, grouped by the order they belong to.
     */
    public function index(Request $request)
    {
        $user = $request->user();

        // Samples are linked to orders through the order_item_sample pivot, so we
        // walk Sample -> OrderItems -> Order to both authorise and group them.
        $samples = Sample::whereNull('collect_request_id')
            ->whereHas('OrderItems.Order', function ($query) use ($user) {
                $query->where('user_id', $user->id);
            })
            ->with([
                'SampleType',
                'OrderItems.Order.Patient',
                'OrderItems.Order.Tests',
            ])
            ->get();

        // Build a clean, order-grouped payload for the frontend.
        $groups = [];
        foreach ($samples as $sample) {
            $order = optional($sample->OrderItems->first())->Order;
            if (! $order) {
                continue;
            }

            if (! isset($groups[$order->id])) {
                $groups[$order->id] = [
                    'id' => $order->id,
                    'orderId' => $order->orderId,
                    'created_at' => $order->created_at,
                    'patient' => $order->Patient ? [
                        'id' => $order->Patient->id,
                        'fullName' => $order->Patient->fullName,
                    ] : null,
                    'tests' => $order->Tests->map(fn ($test) => [
                        'id' => $test->id,
                        'name' => $test->name,
                    ])->values()->all(),
                    'samples' => [],
                ];
            }

            $groups[$order->id]['samples'][] = [
                'id' => $sample->id,
                'sampleId' => $sample->sampleId,
                'pooling' => (bool) $sample->pooling,
                'sample_type' => $sample->SampleType ? [
                    'id' => $sample->SampleType->id,
                    'name' => $sample->SampleType->name,
                ] : null,
            ];
        }

        // Newest orders first.
        $orders = collect($groups)
            ->sortByDesc('created_at')
            ->values()
            ->all();

        return Inertia::render('Samples/Index', [
            'orders' => $orders,
        ]);
    }
}
