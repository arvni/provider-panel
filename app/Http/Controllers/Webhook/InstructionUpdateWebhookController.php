<?php

namespace App\Http\Controllers\Webhook;

use App\Http\Controllers\Controller;
use App\Interfaces\InstructionRepositoryInterface;
use Illuminate\Http\Request;

class InstructionUpdateWebhookController extends Controller
{
    public function __construct(
        protected InstructionRepositoryInterface $instructionRepository,
    ) {}

    /**
     * Handle the incoming request.
     */
    public function __invoke($instructionId, Request $request)
    {

        // Signature is verified upstream by the verify.webhook middleware.
        if ($request->hasFile('data')) {
            $jsonFile = request()->file('data');
            // Read the content of the JSON file
            $jsonContents = file_get_contents($jsonFile->path());
            $jsonData = json_decode($jsonContents, true);
            $i = $this->instructionRepository->getByServerId($instructionId);
            if ($i) {
                $this->instructionRepository->update($i,
                    [
                        'name' => $jsonData['instruction']['name'],
                        'file' => $request->hasFile('file') ? $request->file('file') : null,
                        'server_id' => $instructionId,
                    ]
                );
            } else {
                $this->instructionRepository->create(
                    [
                        'name' => $jsonData['instruction']['name'],
                        'file' => $request->hasFile('file') ? $request->file('file') : null,
                        'server_id' => $instructionId,
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
