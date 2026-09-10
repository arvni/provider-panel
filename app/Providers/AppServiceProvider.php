<?php

namespace App\Providers;

use App\Services\NotificationPreferences;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\App;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        // Shared for the request so a send to every admin looks each user's
        // switches up once rather than once per channel per recipient.
        $this->app->singleton(NotificationPreferences::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        if (App::isProduction()) {
            URL::forceScheme('https');
            Model::preventLazyLoading(true);
        }
    }
}
