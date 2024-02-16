<?php

namespace App\Console;

use App\Console\Commands\SyncOrdersStatus;
use App\Console\Commands\SyncReferrers;
use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Console\Kernel as ConsoleKernel;

class Kernel extends ConsoleKernel
{

    protected $commands = [
        SyncReferrers::class,
        SyncOrdersStatus::class,
        SyncTests::class
    ];

    /**
     * Define the application's command schedule.
     */
    protected function schedule(Schedule $schedule): void
    {
        // $schedule->command('inspire')->hourly();
         $schedule->command('sync:orders')->everyFiveMinutes();
         $schedule->command('sync:referrers')->hourly();
         $schedule->command('sync:tests')->hourly();
    }

    /**
     * Register the commands for the application.
     */
    protected function commands(): void
    {
        $this->load(__DIR__.'/Commands');

        require base_path('routes/console.php');
    }
}
