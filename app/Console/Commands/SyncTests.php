<?php

namespace App\Console\Commands;

use App\Models\SampleType;
use App\Models\Test;
use App\Models\User;
use App\Services\ApiService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
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
     */
    public function handle()
    {
        $tests = ApiService::get(config("api.tests_path", "http://localhost:8001/api/tests"));
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
                        "turnaroundTime" => $test["methods_max_turnaround_time"]/24?? 0,
                        "is_active" => false
                    ]
                );
            else
                $t->fill([
                    "server_id" => $test["id"],
                    "name" => $test["fullName"],
                    "code" => $test["code"],
                    "shortName" => $test["name"],
                    "description" => $test["description"],
                    "turnaroundTime" => $test["methods_max_turnaround_time"]/24 ?? 0,
                ]);
            if ($t->isDirty())
                $t->save();
            $output = [];
            foreach ($test["sample_types"] as $sample_type) {
                $st = SampleType::find($sample_type["id"]);
                if (!$st)
                    $st = SampleType::create([
                        "id" => $sample_type["id"],
                        "name" => $sample_type["name"],
                    ]);
                else
                    $st->fill([
                        "name" => $sample_type["name"]
                    ]);
                if ($st->isDirty())
                    $st->save();

                $output[$st->id] = [
                    "id" => Str::uuid(),
                    "description" => $sample_type["pivot"]["description"],
                    "is_default" => $sample_type["pivot"]["defaultType"]
                ];

            }
            $t->ServerSampleTypes()->sync($output);
        }
    }
}
