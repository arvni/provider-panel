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
            "Instruction",
            "ConsentTerm",
            "OrderForm",
            "OrderMaterial",
            "SampleType",
            "Test",
            "Order",
            "CollectRequest",
            "Material",
            "Patient"
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
