<?php

namespace App\Http\Controllers\Webhook;

use App\Enums\CollectRequestStatus;
use App\Enums\OrderStatus;
use App\Http\Controllers\Controller;
use App\Interfaces\CollectRequestRepositoryInterface;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class CollectRequestUpdateWebhookController extends Controller
{
    public function __construct(
        protected CollectRequestRepositoryInterface $collectRequestRepository,
    )
    {
    }

    /**
     * Handle the incoming request.
     */
    public function __invoke(Request $request)
    {
        // Verify signature
        $signature = $request->header('X-Webhook-Signature');
        $expectedSignature = hash_hmac('sha256', json_encode($request->all()), config('webhook.secret'));
        if (!hash_equals((string) $signature, $expectedSignature)) {
            Log::warning('Webhook signature mismatch', ['route' => 'collect-request.update-by-webhook']);
            return response()->json(['error' => 'Invalid signature'], 401);
        }

        $cr = $this->collectRequestRepository->getByServerId($request->input('data.id'));
        if ($cr) {
            $newStatus = $request->input('data.status');

            $this->collectRequestRepository->update($cr, [
                "status" => $newStatus,
                "details" => [...($cr->logistic_information ?? []), ...$request->input('data.logistic_information', [])],
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
