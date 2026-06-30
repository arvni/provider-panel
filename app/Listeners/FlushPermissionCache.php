<?php

namespace App\Listeners;

use Spatie\Permission\PermissionRegistrar;

/**
 * Flush the Spatie permission cache whenever a role is granted to (or revoked
 * from) a user, or a permission is granted to (or revoked from) a role/user.
 *
 * Spatie already flushes the cache when Role/Permission models are created,
 * updated or deleted (RefreshesPermissionCache trait). This listener closes the
 * remaining gap: role/permission assignments, which are driven by the
 * RoleAttached/RoleDetached/PermissionAttached/PermissionDetached events
 * (requires permission.events_enabled = true).
 */
class FlushPermissionCache
{
    public function handle(object $event): void
    {
        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }
}
