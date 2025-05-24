<?php

namespace App\Observers;

use App\Models\CollectRequest;
use App\Models\User;
use App\Notifications\CollectRequestDeleted;
use App\Notifications\CollectRequestUpdated;
use App\Services\AdminNotificationService;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Log;

class CollectRequestObserver
{
    /**
     * Handle the CollectRequest "created" event.
     */
    public function created(CollectRequest $collectRequest): void
    {
        // Send notification to customer and notify user
        $this->sendCustomerNotification($collectRequest, 'created');

        // Send notification to admins
        AdminNotificationService::sendCollectRequestNotification($collectRequest, 'created');
    }

    /**
     * Handle the CollectRequest "updated" event.
     */
    public function updated(CollectRequest $collectRequest): void
    {
        // Get the changes that were made
        $changes = $this->getRelevantChanges($collectRequest);

        if (!empty($changes)) {
            // Send notification to customer and notify user
            $this->sendCustomerNotification($collectRequest, 'updated');

            // Send notification to admins with change details
            AdminNotificationService::sendCollectRequestNotification(
                $collectRequest,
                'updated',
                $changes
            );

            // Send urgent notification if status changed to something critical
            if (isset($changes['status']) && $this->isUrgentStatusChange($changes['status'])) {
                AdminNotificationService::sendUrgentNotification(
                    $collectRequest,
                    'Status changed to ' . $collectRequest->status->getLabel()
                );
            }
        }
    }

    /**
     * Handle the CollectRequest "deleted" event.
     */
    public function deleted(CollectRequest $collectRequest): void
    {
        try {
            $collectRequest->load('user');

            // Send notification to customer and notify user
            $users = $this->getCustomerNotificationRecipients($collectRequest);
            if (!empty($users)) {
                Notification::send($users, new CollectRequestDeleted($collectRequest->id));
            }

            // Send notification to admins
            AdminNotificationService::sendCollectRequestNotification($collectRequest, 'deleted');

        } catch (\Exception $e) {
            Log::error('Failed to send collect request deleted notification', [
                'collect_request_id' => $collectRequest->id,
                'error' => $e->getMessage()
            ]);
        }
    }


    /**
     * Send notification to customer and designated notify user
     */
    private function sendCustomerNotification(CollectRequest $collectRequest, string $action): void
    {
        try {
            $collectRequest->load('user');
            $users = $this->getCustomerNotificationRecipients($collectRequest);

            if (!empty($users)) {
                Notification::send($users, new CollectRequestUpdated($collectRequest, $action));
            }
        } catch (\Exception $e) {
            Log::error('Failed to send collect request customer notification', [
                'collect_request_id' => $collectRequest->id,
                'action' => $action,
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * Get list of users who should receive customer notifications
     */
    private function getCustomerNotificationRecipients(CollectRequest $collectRequest): array
    {
        $users = [];

        // Add the request owner
        if ($collectRequest->user) {
            $users[] = $collectRequest->user;
        }

        return array_filter($users);
    }

    /**
     * Get relevant changes for notification
     */
    private function getRelevantChanges(CollectRequest $collectRequest): array
    {
        $changes = [];
        $watchedFields = ['status', 'preferred_date', 'details'];

        foreach ($watchedFields as $field) {
            if ($collectRequest->wasChanged($field)) {
                $changes[$field] = [
                    'old' => $collectRequest->getOriginal($field),
                    'new' => $collectRequest->getAttribute($field)
                ];

                // Special handling for enum values
                if ($field === 'status') {
                    $changes[$field]['old'] = $collectRequest->getOriginal($field)?->getLabel() ?? 'Not set';
                    $changes[$field]['new'] = $collectRequest->status->getLabel();
                }
            }
        }

        return $changes;
    }

    /**
     * Check if status change requires urgent notification
     */
    private function isUrgentStatusChange(array $statusChange): bool
    {
        $newStatus = $statusChange['new'];

        // Add your urgent status conditions here
        return in_array($newStatus, [
            'Requested', // New requests need immediate attention
            // Add other urgent statuses as needed
        ]);
    }
}
