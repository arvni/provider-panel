<?php

namespace App\Http\Controllers\Webhook;

use App\Http\Controllers\Controller;
use App\Interfaces\ConsentRepositoryInterface;
use Illuminate\Http\Request;

class ConsentUpdateWebhookController extends Controller
{
    public function __construct(
        protected ConsentRepositoryInterface $consentRepository,
    )
    {
    }

    /**
     * Handle the incoming request.
     */
    public function __invoke($consentFormId, Request $request)
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
                    'signature' => $signature,
                    "expectedSignature" => $expectedSignature,
                    "data" => $jsonData,
                ], 401);
            }
            $cF = $this->consentRepository->getByServerId($consentFormId);
            if ($cF) {
                $this->consentRepository->update($cF,
                    [
                        "name" => $jsonData["consent_form"]["name"],
                        "file" => $request->hasFile("file") ? $request->file("file") : null,
                        "server_id"=>$consentFormId
                    ]
                );
            } else {
                $this->consentRepository->create(
                    [
                        "name" => $jsonData["consent_form"]["name"],
                        "file" => $request->hasFile("file") ? $request->file("file") : null,
                        "server_id"=>$consentFormId
                    ]);
            }


            return response()->json(['success' => true]);
        } else return response()->json([
            'error' => 'Invalid signature',
        ], 401);
    }
}
