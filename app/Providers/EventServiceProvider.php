<?php

namespace App\Providers;

use App\Listeners\FlushPermissionCache;
use App\Models\CollectRequest;
use App\Models\Order;
use App\Observers\CollectRequestObserver;
use App\Observers\OrderObserver;
use Illuminate\Auth\Events\Registered;
use Illuminate\Auth\Listeners\SendEmailVerificationNotification;
use Illuminate\Foundation\Support\Providers\EventServiceProvider as ServiceProvider;
use Illuminate\Support\Facades\Event;
use Spatie\Permission\Events\PermissionAttached;
use Spatie\Permission\Events\PermissionDetached;
use Spatie\Permission\Events\RoleAttached;
use Spatie\Permission\Events\RoleDetached;

class EventServiceProvider extends ServiceProvider
{
    /**
     * The event to listener mappings for the application.
     *
     * @var array<class-string, array<int, class-string>>
     */
    protected $listen = [
        Registered::class => [
            SendEmailVerificationNotification::class,
        ],
        // Flush the permission cache when a role/permission is assigned or revoked.
        RoleAttached::class => [FlushPermissionCache::class],
        RoleDetached::class => [FlushPermissionCache::class],
        PermissionAttached::class => [FlushPermissionCache::class],
        PermissionDetached::class => [FlushPermissionCache::class],
    ];

    /**
     * Register any events for your application.
     */
    public function boot(): void {}

    protected $observers = [
        CollectRequest::class => [CollectRequestObserver::class],
        Order::class => [OrderObserver::class],
    ];

    /**
     * Determine if events and listeners should be automatically discovered.
     */
    public function shouldDiscoverEvents(): bool
    {
        return false;
    }
}
