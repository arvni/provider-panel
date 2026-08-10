<?php

namespace App\Http\Controllers;

use App\Enums\CollectRequestStatus;
use App\Http\Requests\StoreStandaloneCollectRequestRequest;
use App\Jobs\SendCollectionRequest;
use App\Models\CollectRequest;
use App\Models\SampleType;

/**
 * Create a collect request that is not tied to any order.
 *
 * The provider simply states which sample types they have ready for pickup,
 * so there is no order graph to attach: the selected sample types and the
 * optional comment are kept in the request's `details` payload.
 */
class StoreStandaloneCollectRequestController extends Controller
{
    public function __invoke(StoreStandaloneCollectRequestRequest $request)
    {
        $validated = $request->validated();

        // Snapshot the chosen types (with their server ids) into details, so the
        // request keeps describing what was asked for even if a type is renamed.
        $sampleTypes = SampleType::whereIn('id', $validated['sample_types'])
            ->orderBy('name')
            ->get(['id', 'server_id', 'name'])
            ->map(fn (SampleType $sampleType) => [
                'id' => $sampleType->id,
                'server_id' => $sampleType->server_id,
                'name' => $sampleType->name,
            ])
            ->all();

        $collectRequest = CollectRequest::create([
            'user_id' => $request->user()->id,
            'status' => CollectRequestStatus::REQUESTED,
            'preferred_date' => $validated['preferred_date'],
            'details' => [
                'type' => 'standalone',
                'sample_types' => $sampleTypes,
                'comment' => $validated['comment'] ?? null,
            ],
        ]);

        SendCollectionRequest::dispatch($collectRequest);

        return back()->with(['status' => __('Your collection request has been submitted.')]);
    }
}
