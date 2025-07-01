<?php

namespace App\Http\Controllers\Webhook;

use App\Http\Controllers\Controller;
use App\Interfaces\SampleTypeRepositoryInterface;
use Illuminate\Http\Request;

class SampleTypeUpdateWebhookController extends Controller
{
    public function __construct(
        protected SampleTypeRepositoryInterface $sampleTypeRepository,
    )
    {
    }

    /**
     * Handle the incoming request.
     */
    public function __invoke($sampleTypeId, Request $request)
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
            $i = $this->sampleTypeRepository->getByServerId($sampleTypeId);
            if ($i) {
                $this->sampleTypeRepository->update($i,
                    [
                        "server_id" => $jsonData["sample_type"]["id"],
                        "name" => $jsonData["sample_type"]["name"],
                        "orderable" => $jsonData["sample_type"]["orderable"],
                        "sample_id_required"=>$jsonData["sample_type"]["required_barcode"]
                    ]
                );
            } else {
                $this->sampleTypeRepository->create(
                    [
                        "server_id" => $jsonData["sample_type"]["id"],
                    "name" => $jsonData["sample_type"]["name"],
                    "orderable" => $jsonData["sample_type"]["orderable"],
                    "sample_id_required"=>$jsonData["sample_type"]["required_barcode"]
                    ]);
            }


            return response()->json(['success' => true]);
        } else return response()->json([
            'error' => 'Invalid signature',
        ], 401);
    }
}
