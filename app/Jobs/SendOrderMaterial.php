<?php

namespace App\Jobs;

use App\Exceptions\ApiServiceException;
use App\Models\OrderMaterial;
use App\Services\MaterialOrder;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class SendOrderMaterial implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * Create a new job instance.
     */
    public function __construct(protected OrderMaterial $orderMaterial)
    {
    }

    /**
     * Execute the job.
     * @throws ApiServiceException
     */
    public function handle(): void
    {
        $res = MaterialOrder::send($this->orderMaterial);
        if (!$res->ok())
            $this->fail($res->toException());
    }
}
