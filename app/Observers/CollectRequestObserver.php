<?php

namespace App\Observers;

use App\Mail\CollectRequestCreatedMail;
use App\Models\CollectRequest;
use App\Notifications\CollectRequestDeleted;
use App\Notifications\CollectRequestUpdated;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Notification;

class CollectRequestObserver
{
    /**
     * Handle the CollectRequest "created" event.
     */
    public function created(CollectRequest $collectRequest): void
    {
        $collectRequest->load("User");
        $collectRequest->User->notify(new CollectRequestUpdated($collectRequest));
    }

    /**
     * Handle the CollectRequest "updated" event.
     */
    public function updated(CollectRequest $collectRequest): void
    {
        $collectRequest->load("User");
        $collectRequest->User->notify(new CollectRequestUpdated($collectRequest));
    }

    /**
     * Handle the CollectRequest "deleted" event.
     */
    public function deleted(CollectRequest $collectRequest): void
    {
        $collectRequest->load("User");
        $collectRequest->User->notify(new CollectRequestDeleted($collectRequest->id));
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
