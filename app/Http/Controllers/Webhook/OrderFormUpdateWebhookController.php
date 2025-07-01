<?php

namespace App\Http\Controllers\Webhook;

use App\Http\Controllers\Controller;
use App\Interfaces\OrderFormRepositoryInterface;
use Illuminate\Http\Request;

class OrderFormUpdateWebhookController extends Controller
{
    public function __construct(
        protected OrderFormRepositoryInterface $orderFormRepository,
    )
    {
    }

    /**
     * Handle the incoming request.
     */
    public function __invoke($orderFormId, Request $request)
    {

        // Verify signature
        $signature = $request->header('X-Webhook-Signature');
        if ($request->hasFile("data")) {
            $jsonFile = request()->file('data');
            // Read the content of the JSON file
            $jsonContents = file_get_contents($jsonFile->path());
            $jsonData = json_decode($jsonContents, true);
            $expectedSignature = hash_hmac('sha256', json_encode($jsonData), config('webhook.secret'));
            if (!hash_equals($signature, $expectedSignature)) {
                return response()->json([
                    'error' => 'Invalid signature',
                    "data" => $jsonData,
                ], 401);
            }
            $oF = $this->orderFormRepository->getByServerId($orderFormId);
            if ($oF) {
                $this->orderFormRepository->update($oF,
                    [
                        "formData" => $jsonData["request_form"]["form_data"],
                        "name" => $jsonData["request_form"]["name"],
                        "file" => $request->hasFile("file") ? $request->file("file") : null,
                        "server_id"=>$orderFormId
                    ]
                );
            } else {
                $this->orderFormRepository->create(
                    [
                        "formData" => $jsonData["request_form"]["form_data"],
                        "name" => $jsonData["request_form"]["name"],
                        "file" => $request->hasFile("file") ? $request->file("file") : null,
                        "server_id"=>$orderFormId
                    ]);
            }


            return response()->json(['success' => true]);
        } else return response()->json([
            'error' => 'Invalid signature',
        ], 401);
    }
}
