<?php

namespace App\Http\Controllers\Webhook;

use App\Enums\CollectRequestStatus;
use App\Enums\OrderStatus;
use App\Http\Controllers\Controller;
use App\Interfaces\CollectRequestRepositoryInterface;
use Illuminate\Http\Request;

class CollectRequestUpdateWebhookController extends Controller
{
    public function __construct(
        protected CollectRequestRepositoryInterface $collectRequestRepository,
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

            $this->collectRequestRepository->update($cr, [
                'status' => $newStatus,
                'details' => [...($cr->logistic_information ?? []), ...$request->input('data.logistic_information', [])],
            ]);

            if ($newStatus === CollectRequestStatus::PICKED_UP->value) {
                $cr->orders()->update(['sent_at' => now()]);
            } elseif ($newStatus === CollectRequestStatus::RECEIVED->value) {
                $cr->orders()->update([
                    'received_at' => now(),
                    'status' => OrderStatus::RECEIVED->value,
                ]);
            }
        }

        return response()->json(['success' => true]);
    }
}
