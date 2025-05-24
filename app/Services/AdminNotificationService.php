<?php

namespace App\Services;

use App\Models\CollectRequest;
use App\Models\User;
use App\Notifications\AdminCollectRequestNotification;
use Exception;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Log;

class AdminNotificationService
{
    /**
     * Send notification to all admin users
     */
    public static function sendCollectRequestNotification(
        CollectRequest $collectRequest,
        string                     $action,
        ?array                     $changes = null
    ): void
    {
        try {
            $admins = static::getAdminUsers();

            if ($admins->isEmpty()) {
                Log::warning('No admin users found for collect request notification', [
                    'collect_request_id' => $collectRequest->id,
                    'action' => $action
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
                'admin_count' => $admins->count()
            ]);

        } catch (Exception $e) {
            Log::error('Failed to send admin collect request notification', [
                'collect_request_id' => $collectRequest->id,
                'action' => $action,
                'error' => $e->getMessage()
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
        string                     $reason
    ): void
    {
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
                'error' => $e->getMessage()
            ]);
        }
    }
}
