<?php

namespace App\Services;

use App\Jobs\SendOrderMaterial;
use App\Models\CollectRequest;
use App\Models\OrderMaterial;
use App\Models\User;
use App\Notifications\AdminCollectRequestNotification;
use App\Notifications\AdminKitOrderNotification;
use App\Notifications\AdminOrderMaterialNotification;
use Exception;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Notification;

class AdminNotificationService
{
    /**
     * Send notification to all admin users
     */
    public static function sendCollectRequestNotification(
        CollectRequest $collectRequest,
        string $action,
        ?array $changes = null
    ): void {
        try {
            $admins = static::getAdminUsers();

            if ($admins->isEmpty()) {
                Log::warning('No admin users found for collect request notification', [
                    'collect_request_id' => $collectRequest->id,
                    'action' => $action,
                ]);

                return;
            }

            Notification::send(
                $admins,
                new AdminCollectRequestNotification($collectRequest, $action, $changes)
            );

            Log::info('Admin notification sent for collect request', [
                'collect_request_id' => $collectRequest->id,
                'action' => $action,
                'admin_count' => $admins->count(),
            ]);

        } catch (Exception $e) {
            Log::error('Failed to send admin collect request notification', [
                'collect_request_id' => $collectRequest->id,
                'action' => $action,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Get all admin users who should receive notifications
     */
    private static function getAdminUsers()
    {
        return User::query()
            ->where(function ($query) {
                $query
                    ->where('userName', 'notify') // Keep your existing notify user
                    ->orWhereHas('roles', function ($roleQuery) {
                        $roleQuery->where('name', 'admin');
                    });
            })
            ->get();
    }

    /**
     * Send urgent notification (for high priority cases)
     */
    public static function sendUrgentNotification(
        CollectRequest $collectRequest,
        string $reason
    ): void {
        try {
            $admins = static::getAdminUsers();

            $notification = new AdminCollectRequestNotification(
                $collectRequest,
                'urgent',
                ['reason' => $reason]
            );

            // Send via multiple channels for urgent notifications
            foreach ($admins as $admin) {
                $admin->notify($notification);
                // Could also send SMS or Slack notification here
            }

        } catch (Exception $e) {
            Log::error('Failed to send urgent admin notification', [
                'collect_request_id' => $collectRequest->id,
                'reason' => $reason,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Send urgent notification (for high priority cases)
     */
    public static function sendOrderMaterialNotification(
        OrderMaterial $orderMaterial,
        string $reason
    ): void {
        try {
            $admins = static::getAdminUsers();

            $notification = new AdminOrderMaterialNotification(
                $orderMaterial,
            );

            // Send via multiple channels for urgent notifications
            foreach ($admins as $admin) {
                $admin->notify($notification);
                // Could also send SMS or Slack notification here
            }

            SendOrderMaterial::dispatch($orderMaterial);

        } catch (Exception $e) {
            Log::error('Failed to send urgent admin notification', [
                'collect_request_id' => $orderMaterial->id,
                'reason' => $reason,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Announce the kits ordered on one logistic request.
     *
     * The admins hear about the request once however many kits it carries, but
     * every material still syncs on its own: the lab makes each kit up
     * separately, so each one has to reach the central server as its own
     * record.
     *
     * @param  Collection<int, OrderMaterial>  $orderMaterials
     */
    public static function sendKitOrderNotification(
        CollectRequest $collectRequest,
        Collection $orderMaterials,
        string $reason
    ): void {
        try {
            Notification::send(
                self::getAdminUsers(),
                new AdminKitOrderNotification($collectRequest)
            );
        } catch (Exception $e) {
            Log::error('Failed to send admin kit order notification', [
                'collect_request_id' => $collectRequest->id,
                'reason' => $reason,
                'error' => $e->getMessage(),
            ]);
        }

        // Its own try, deliberately, rather than sharing the one above: a mail
        // server that is down must not keep the kits from reaching the lab, and
        // a lab that will not take them must not be reported to the provider as
        // a request that was never raised. Both are already recorded; getting
        // them out is the part that is allowed to fail quietly and be retried.
        //
        // Each kit is dispatched on its own so one refusal does not strand the
        // rest, and the loop is inside the try because a sync queue runs the
        // job right here — on a queued one, dispatch cannot throw at all.
        foreach ($orderMaterials as $orderMaterial) {
            try {
                SendOrderMaterial::dispatch($orderMaterial);
            } catch (Exception $e) {
                Log::error('Failed to send order material to the lab', [
                    'collect_request_id' => $collectRequest->id,
                    'order_material_id' => $orderMaterial->id,
                    'reason' => $reason,
                    'error' => $e->getMessage(),
                ]);
            }
        }
    }
}
