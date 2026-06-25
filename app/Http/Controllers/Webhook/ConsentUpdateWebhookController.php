<?php

namespace App\Http\Controllers\Webhook;

use App\Http\Controllers\Controller;
use App\Interfaces\ConsentRepositoryInterface;
use Illuminate\Http\Request;

class ConsentUpdateWebhookController extends Controller
{
    public function __construct(
        protected ConsentRepositoryInterface $consentRepository,
    ) {}

    /**
     * Handle the incoming request.
     */
    public function __invoke($consentFormId, Request $request)
    {

        // Signature is verified upstream by the verify.webhook middleware.
        if ($request->hasFile('data')) {
            $jsonFile = request()->file('data');
            // Read the content of the JSON file
            $jsonContents = file_get_contents($jsonFile->path());
            $jsonData = json_decode($jsonContents, true);
            $cF = $this->consentRepository->getByServerId($consentFormId);
            if ($cF) {
                $this->consentRepository->update($cF,
                    [
                        'name' => $jsonData['consent_form']['name'],
                        'file' => $request->hasFile('file') ? $request->file('file') : null,
                        'server_id' => $consentFormId,
                    ]
                );
            } else {
                $this->consentRepository->create(
                    [
                        'name' => $jsonData['consent_form']['name'],
                        'file' => $request->hasFile('file') ? $request->file('file') : null,
                        'server_id' => $consentFormId,
                    ]);
            }

            return response()->json(['success' => true]);
        } else {
            return response()->json([
                'error' => 'Invalid signature',
            ], 401);
        }
    }
}
