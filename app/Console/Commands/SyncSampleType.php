<?php

namespace App\Console\Commands;

use App\Models\SampleType;
use App\Models\Test;
use App\Services\ApiService;
use Illuminate\Console\Command;
use Illuminate\Support\Str;

class SyncSampleType extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'sync:sample-type';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Sync Sample Types List with the lis server';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $sampleTypes = ApiService::get(config("api.sample_types_path"));
        foreach ($sampleTypes->json() as $sampleType) {
            $t = SampleType::where("name", $sampleType["name"])->orWhere("server_id",$sampleType["id"])->first();
            if ($t) {
                $t->fill([
                    "server_id" => $sampleType["id"],
                    "name" => $sampleType["name"],
                    "orderable" => $sampleType["orderable"],
                ]);
                if ($t->isDirty())
                    $t->save();
            }else{
                SampleType::create([
                    "name" => $sampleType["name"],
                    "server_id" => $sampleType["id"],
                    "orderable" => $sampleType["orderable"],
                    "sample_id_required"=>$sampleType["required_barcode"]
                ]);
            }
        }
    }
}
