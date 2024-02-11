<?php

namespace Database\Seeders;

use App\Models\SampleType;
use App\Models\Test;
use App\Services\ApiService;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

class TestSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $tests = ApiService::get(config("tests_path", "http://localhost:8001/api/tests"));
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
                        "turnaroundTime" => $test["methods_max_turnaround_time"]?? 0,
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
