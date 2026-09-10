<?php

namespace App\Observers;

use App\Enums\CollectRequestStatus;
use App\Models\CollectRequest;
use App\Models\User;
use App\Notifications\CollectRequestDeleted;
use App\Notifications\CollectRequestUpdated;
use App\Services\AdminNotificationService;
use App\Services\OrderReceivedAtSync;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Notification;

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
        // Read the changes before stamping: stampReceipt saves the request
        // again, and a save resets what the model reports as changed, so asking
        // afterwards would lose the very status change that triggered it.
        $changes = $this->getRelevantChanges($collectRequest);

        $this->stampReceipt($collectRequest);

        if (! empty($changes)) {
            // The changed field names travel with the notification: they decide
            // which of the recipient's per-step switches it is matched against.
            $this->sendCustomerNotification($collectRequest, 'updated', array_keys($changes));

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
                    'Status changed to '.$collectRequest->status->getLabel()
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
            if (! empty($users)) {
                Notification::send($users, new CollectRequestDeleted($collectRequest->id));
            }

            // Send notification to admins
            AdminNotificationService::sendCollectRequestNotification($collectRequest, 'deleted');

        } catch (\Exception $e) {
            Log::error('Failed to send collect request deleted notification', [
                'collect_request_id' => $collectRequest->id,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Pin the moment this request was received, and push it out to the orders
     * whose samples travelled in it.
     *
     * Lives here rather than in the webhook because more than one path flips a
     * request to received -- the logistics webhook, and sync:orders catching up
     * when an order has already moved past processing upstream. Orders take
     * their received_at from this, so it has to be stamped wherever it happens.
     */
    private function stampReceipt(CollectRequest $collectRequest): void
    {
        if (! $collectRequest->wasChanged('status')
            || $collectRequest->status !== CollectRequestStatus::RECEIVED) {
            return;
        }

        if (is_null($collectRequest->received_at)) {
            // saveQuietly: this is bookkeeping, not a change worth re-notifying on.
            $collectRequest->received_at = now();
            $collectRequest->saveQuietly();
        }

        app(OrderReceivedAtSync::class)->forCollectRequest($collectRequest);
    }

    /**
     * Send notification to customer and designated notify user
     */
    /**
     * @param  array<int, string>  $changedFields  Which watched fields moved. Empty on a
     *                                             creation, which is its own announcement.
     */
    private function sendCustomerNotification(
        CollectRequest $collectRequest,
        string $action,
        array $changedFields = []
    ): void {
        try {
            $collectRequest->load('user');
            $users = $this->getCustomerNotificationRecipients($collectRequest);

            if (! empty($users)) {
                Notification::send(
                    $users,
                    new CollectRequestUpdated($collectRequest, $action, $changedFields)
                );
            }
        } catch (\Exception $e) {
            Log::error('Failed to send collect request customer notification', [
                'collect_request_id' => $collectRequest->id,
                'action' => $action,
                'error' => $e->getMessage(),
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
     *
     * wasChanged() is taken as a hint, not an answer: details is a JSON column
     * rewritten wholesale on every logistics poll, and a value that comes back
     * from the webhook as a number where it was stored as a string counts as
     * written even though nothing about the request moved. Comparing the old
     * value against the new one keeps those polls from mailing the admins about
     * a request that stood still.
     */
    private function getRelevantChanges(CollectRequest $collectRequest): array
    {
        $changes = [];
        $watchedFields = ['status', 'preferred_date', 'details'];

        foreach ($watchedFields as $field) {
            if (! $collectRequest->wasChanged($field)) {
                continue;
            }

            $old = $collectRequest->getOriginal($field);
            $new = $collectRequest->getAttribute($field);

            // Loose, so that a re-encoded 23.58 and "23.58" read as the same
            // reading; enums of the same case compare equal too.
            if ($old == $new) {
                continue;
            }

            $changes[$field] = ['old' => $old, 'new' => $new];

            // Special handling for enum values
            if ($field === 'status') {
                $changes[$field]['old'] = $old?->getLabel() ?? 'Not set';
                $changes[$field]['new'] = $collectRequest->status->getLabel();
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
