<?php

namespace App\Observers;

use App\Models\CollectRequest;
use App\Notifications\CollectRequestUpdated;
use Illuminate\Support\Facades\Notification;

class CollectRequestObserver
{
    /**
     * Handle the CollectRequest "created" event.
     */
    public function created(CollectRequest $collectRequest): void
    {
        //
    }

    /**
     * Handle the CollectRequest "updated" event.
     */
    public function updated(CollectRequest $collectRequest): void
    {
        $user = $collectRequest->User()->first();
        $user->notify(new CollectRequestUpdated($collectRequest));
    }

    /**
     * Handle the CollectRequest "deleted" event.
     */
    public function deleted(CollectRequest $collectRequest): void
    {
        //
    }

    /**
     * Handle the CollectRequest "restored" event.
     */
    public function restored(CollectRequest $collectRequest): void
    {
        //
    }

    /**
     * Handle the CollectRequest "force deleted" event.
     */
    public function forceDeleted(CollectRequest $collectRequest): void
    {
        //
    }
}
