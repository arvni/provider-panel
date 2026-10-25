<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

/*
|--------------------------------------------------------------------------
| Console Routes
|--------------------------------------------------------------------------
|
| This file is where you may define all of your Closure based console
| commands. Each Closure is bound to a command instance allowing a
| simple approach to interacting with each command's IO methods.
|
*/

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

/*
|--------------------------------------------------------------------------
| Task Scheduling
|--------------------------------------------------------------------------
|
| Here you may define all of your scheduled tasks.
|
*/

Schedule::command('sync:orders')->everyFiveMinutes();
Schedule::command('sync:referrers')->hourly();
Schedule::command('sync:tests')->hourly();
// Catch up pre-order mirrors that missed a webhook.
Schedule::command('sync:pre-orders')->dailyAt('02:30')->withoutOverlapping();
