<?php

namespace App\Http\Controllers\Webhook;

use App\Http\Controllers\Controller;
use App\Interfaces\SampleTypeRepositoryInterface;
use Illuminate\Http\Request;

class SampleTypeUpdateWebhookController extends Controller
{
    public function __construct(
        protected SampleTypeRepositoryInterface $sampleTypeRepository,
    ) {}

    /**
     * Handle the incoming request.
     */
    public function __invoke($sampleTypeId, Request $request)
    {

        // Signature is verified upstream by the verify.webhook middleware.
        if ($request->hasFile('data')) {
            $jsonFile = request()->file('data');
            // Read the content of the JSON file
            $jsonContents = file_get_contents($jsonFile->path());
            $jsonData = json_decode($jsonContents, true);
            $i = $this->sampleTypeRepository->getByServerId($sampleTypeId);
            if ($i) {
                $this->sampleTypeRepository->update($i,
                    [
                        'server_id' => $jsonData['sample_type']['id'],
                        'name' => $jsonData['sample_type']['name'],
                        'orderable' => $jsonData['sample_type']['orderable'],
                        'sample_id_required' => $jsonData['sample_type']['required_barcode'],
                    ]
                );
            } else {
                $this->sampleTypeRepository->create(
                    [
                        'server_id' => $jsonData['sample_type']['id'],
                        'name' => $jsonData['sample_type']['name'],
                        'orderable' => $jsonData['sample_type']['orderable'],
                        'sample_id_required' => $jsonData['sample_type']['required_barcode'],
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
