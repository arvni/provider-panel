<?php

namespace App\Console\Commands;

use App\Exceptions\ApiServiceException;
use App\Models\Consent;
use App\Models\Instruction;
use App\Models\OrderForm;
use App\Models\SampleType;
use App\Models\Test;
use App\Services\ApiService;
use Illuminate\Console\Command;
use Illuminate\Support\Str;

class SyncTests extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'sync:tests';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Sync Tests List with the lis server';

    /**
     * Execute the console command.
     * @throws ApiServiceException
     */
    public function handle()
    {
        $url = config("api.server_url") . config("api.tests_path", "tests");
        $tests = ApiService::get($url);
        $testsId = [];
        foreach ($tests->json() as $test) {
            $t = Test::where("server_id", $test["id"])->first();
            if (!$t)
                $t = Test::factory()->create(
                    [
                        "server_id" => $test["id"],
                        "name" => $test["fullName"],
                        "code" => $test["code"],
                        "shortName" => $test["name"],
                        "description" => $test["description"],
                        "turnaroundTime" => $test["methods_max_turnaround_time"] / 24 ?? 0,
                        "is_active" => false,
                    ]
                );
            else
                $t->fill([
                    "name" => $test["fullName"],
                    "code" => $test["code"],
                    "shortName" => $test["name"],
                    "description" => $test["description"],
                    "turnaroundTime" => $test["methods_max_turnaround_time"] ?? 1,
                    "is_active" => $test["status"],
                ]);
            if ($t->isDirty())
                $t->save();
            $testsId[] = $t->id;
            $this->syncSampleTypes($t, $test["sample_types"]);
        }
        Test::whereNotIn("id", $testsId)->update(["is_active" => false]);
    }

    private function syncSampleTypes(Test $test, $sampleTypes): void
    {
        $output = [];
        foreach ($sampleTypes as $sampleTypeData) {
            $st = SampleType::where("server_id", $sampleTypeData["id"])->first();
            if (!$st)
                $st = SampleType::create([
                    "server_id" => $sampleTypeData["id"],
                    "name" => $sampleTypeData["name"],
                ]);
            $output[$st->id] = [
                "id" => Str::uuid(),
                "description" => $sampleTypeData["pivot"]["description"],
                "is_default" => $sampleTypeData["pivot"]["defaultType"]
            ];

        }
        $test->ServerSampleTypes()->sync($output);
    }

    private function getOrderForm($order_form): OrderForm
    {
        $orderForm = OrderForm::where("server_id", $order_form["id"])->first();
        if (!$orderForm) {
            $orderForm = OrderForm::create([
                "server_id" => $order_form["id"],
                "name" => $order_form["name"]
            ]);
        }
        return $orderForm;
    }

    private function getConsent($consentData): Consent
    {
        $consent = Consent::where("server_id", $consentData["id"])->first();;
        if (!$consent) {
            $consent = Consent::create([
                "server_id" => $consentData["id"],
                "name" => $consentData["name"]
            ]);
        }
        return $consent;
    }

    private function getInstruction($instructionData): Instruction
    {
        $instruction = Instruction::where("server_id", $instructionData["id"])->first();;
        if (!$instruction) {
            $instruction = Consent::create([
                "server_id" => $instructionData["id"],
                "name" => $instructionData["name"]
            ]);
        }
        return $instruction;
    }
}
