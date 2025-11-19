<?php

namespace App\Http\Controllers\Webhook;

use App\Http\Controllers\Controller;
use App\Interfaces\CollectRequestRepositoryInterface;
use App\Interfaces\OrderFormRepositoryInterface;
use Illuminate\Http\Request;

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
        if (!hash_equals($signature, $expectedSignature)) {
            return response()->json([
                'error' => 'Invalid signature',
                "data" => $request->all(),
            ], 401);
        }
        $cr = $this->collectRequestRepository->getByServerId($request->input('data.id'));
        if ($cr) {
            $this->collectRequestRepository->update($cr,
                [
                    "status" => $request->input('data.status'),
                    "details" => [...($cr->logistic_information ?? []), ...$request->input('data.logistic_information', [])],
                ]
            );
        }


        return response()->json(['success' => true]);
    }
}
