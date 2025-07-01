<?php

namespace App\Http\Controllers\Webhook;

use App\Http\Controllers\Controller;
use App\Interfaces\ConsentRepositoryInterface;
use App\Interfaces\InstructionRepositoryInterface;
use App\Interfaces\OrderFormRepositoryInterface;
use App\Interfaces\TestRepositoryInterface;
use Illuminate\Http\Request;

class TestUpdateWebhookController extends Controller
{
    public function __construct(
        protected TestRepositoryInterface        $testRepository,
        protected ConsentRepositoryInterface     $consentRepository,
        protected InstructionRepositoryInterface $instructionRepository,
        protected OrderFormRepositoryInterface   $orderFormRepository
    )
    {
    }

    /**
     * Handle the incoming request.
     */
    public function __invoke($test, Request $request)
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
            $t = $this->testRepository->getByServerId($jsonData["test_id"]);
            $testData = $jsonData["test"];
            $consent = $this->getConsentForm($testData["consent_form_id"]);
            $orderForm = $this->getOrderForm($testData["request_form_id"]);
            $instruction = $this->getInstruction($t["instruction_id"]);
            if ($t) {
                $this->testRepository->edit($t,
                    [
                        "server_id" => $test,
                        "name" => $testData["fullName"],
                        "code" => $testData["code"],
                        "shortName" => $test["name"],
                        "description" => $test["description"],
                        "turnaroundTime" => $test["methods_max_turnaround_time"] ?? 1,
                        "is_active" => $test["status"],
                        "consent_id" => $consent?->id,
                        "order_form_id" => $orderForm?->id,
                        "instruction_id" => $instruction?->id,
                    ]
                );
            } else {

                $this->testRepository->create(
                    [
                        "server_id" => $test,
                        "name" => $testData["fullName"],
                        "code" => $testData["code"],
                        "shortName" => $test["name"],
                        "description" => $test["description"],
                        "turnaroundTime" => $test["methods_max_turnaround_time"] ?? 1,
                        "is_active" => $test["status"],
                        "consent_id" => $consent?->id,
                        "order_form_id" => $orderForm?->id,
                        "instruction_id" => $instruction?->id,
                    ]);
            }


            return response()->json(['success' => true]);
        } else return response()->json([
            'error' => 'Invalid signature',
        ], 401);
    }

    private function getConsentForm($id)
    {
        return $this->consentRepository->getByServerId($id);
    }

    private function getOrderForm($id)
    {
        return $this->orderFormRepository->getByServerId($id);
    }

    private function getInstruction($id)
    {
        return $this->instructionRepository->getByServerId($id);
    }
}
