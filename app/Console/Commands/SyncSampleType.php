<?php

namespace App\Console\Commands;

use App\Exceptions\ApiServiceException;
use App\Models\SampleType;
use App\Services\ApiService;
use Illuminate\Console\Command;

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
     * @throws ApiServiceException
     */
    public function handle(): void
    {
        $url=config("api.server_url") .config("api.sample_types_path");
        $sampleTypes = ApiService::get($url);
        foreach ($sampleTypes->json() as $sampleType) {
            $t = SampleType::where("name", $sampleType["name"])->orWhere("server_id",$sampleType["id"])->first();
            if ($t) {
                $t->fill([
                    "server_id" => $sampleType["id"],
                    "name" => $sampleType["name"],
                    "orderable" => $sampleType["orderable"],
                    "sample_id_required"=>$sampleType["required_barcode"]
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
