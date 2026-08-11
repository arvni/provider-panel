<?php

namespace App\Http\Controllers\Webhook;

use App\Enums\CollectRequestStatus;
use App\Enums\OrderStatus;
use App\Http\Controllers\Controller;
use App\Interfaces\CollectRequestRepositoryInterface;
use App\Services\OrderStatusRecorder;
use Illuminate\Http\Request;

class CollectRequestUpdateWebhookController extends Controller
{
    public function __construct(
        protected CollectRequestRepositoryInterface $collectRequestRepository,
        protected OrderStatusRecorder $orderStatusRecorder,
    ) {}

    /**
     * Handle the incoming request.
     */
    public function __invoke(Request $request)
    {
        // Signature is verified upstream by the verify.webhook middleware.
        $cr = $this->collectRequestRepository->getByServerId($request->input('data.id'));
        if ($cr) {
            $newStatus = $request->input('data.status');

            // Stamping received_at and pushing it out to the orders is handled by
            // CollectRequestObserver, so every path that receives a request -- this
            // webhook, sync:orders catching up -- lands the same way.
            $this->collectRequestRepository->update($cr, [
                'status' => $newStatus,
                'details' => [...($cr->logistic_information ?? []), ...$request->input('data.logistic_information', [])],
            ]);

            if ($newStatus === CollectRequestStatus::PICKED_UP->value) {
                $cr->orders()->update(['sent_at' => now()]);
            } elseif ($newStatus === CollectRequestStatus::RECEIVED->value) {
                // Read the orders first: the mass update below bypasses the model
                // layer, so the timeline has to be told what they came from.
                $before = $cr->orders()->get(['id', 'status']);
                $cr->orders()->update(['status' => OrderStatus::RECEIVED->value]);
                $this->orderStatusRecorder->recordMany($before, OrderStatus::RECEIVED->value);
            }
        }

        return response()->json(['success' => true]);
    }
}
