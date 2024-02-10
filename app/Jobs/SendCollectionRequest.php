<?php

namespace App\Jobs;

use App\Models\CollectRequest;
use App\Services\RequestLogistic;
use Exception;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class SendCollectionRequest implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * Create a new job instance.
     */
    protected CollectRequest $collectRequest;

    public function __construct(CollectRequest $collectRequest)
    {
        $this->collectRequest = $collectRequest;
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        $res = RequestLogistic::send($this->collectRequest);
        if (!$res->ok())
            $this->fail($res);
    }
}
