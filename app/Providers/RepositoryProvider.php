<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;

class RepositoryProvider extends ServiceProvider
{
    /**
     * Register services.
     *
     * @return void
     */
    public function register()
    {
        $models = array(
            'Permission',
            'Role',
            'User',
            "Consent",
            "ConsentTerm",
            "OrderForm",
            "SampleType",
            "Test",
            "Order",
            "CollectRequest"
        );

        foreach ($models as $model) {
            $this->app->bind("App\Interfaces\\{$model}RepositoryInterface", "App\Repositories\\{$model}Repository");
        }
    }

    /**
     * Bootstrap services.
     *
     * @return void
     */
    public function boot()
    {
        //
    }
}
