<?php

namespace App\Notifications;

use App\Enums\CollectRequestStatus;
use App\Models\CollectRequest;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class AdminCollectRequestNotification extends Notification implements ShouldQueue
{
    use Queueable;

    protected CollectRequest $collectRequest;
    protected string $action;
    protected ?array $changes;

    /**
     * Create a new notification instance.
     */
    public function __construct(CollectRequest $collectRequest, string $action = 'updated', ?array $changes = null)
    {
        $this->collectRequest = $collectRequest;
        $this->action = $action;
        $this->changes = $changes;
    }

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail', 'database'];
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        $message = (new MailMessage)
            ->subject($this->getEmailSubject())
            ->greeting('Hello Admin!')
            ->line($this->getActionMessage());

        // Add request details
        $message->line("**Request Details:**")
            ->line("• ID: #{$this->collectRequest->id}")
            ->line("• Customer: {$this->collectRequest->user->name}")
            ->line("• Status: {$this->collectRequest->status->getLabel()}")
            ->line("• Created: {$this->collectRequest->created_at->format('M d, Y H:i')}");

        if ($this->collectRequest->preferred_date) {
            $message->line("• Preferred Date: {$this->collectRequest->preferred_date->format('M d, Y')}");
        }

        // Add change details for updates
        if ($this->action === 'updated' && $this->changes) {
            $message->line("**Changes Made:**");
            foreach ($this->changes as $field => $change) {
                $message->line("• " . $this->formatChange($field, $change));
            }
        }

        // Add details if available
        if ($this->collectRequest->details) {
            $message->line("**Additional Details:**");
            if (is_array($this->collectRequest->details)) {
                foreach ($this->collectRequest->details as $key => $value) {
                    $message->line("• " . ucfirst($key) . ": " . $value);
                }
            } else {
                $message->line($this->collectRequest->details);
            }
        }

        return $message
            ->action('View in Admin Panel', $this->getAdminUrl())
            ->line('This is an automated notification for admin monitoring.');
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'admin_collect_request',
            'collect_request_id' => $this->collectRequest->id,
            'customer_id' => $this->collectRequest->user_id,
            'customer_name' => $this->collectRequest->user->name,
            'action' => $this->action,
            'status' => $this->collectRequest->status->value,
            'status_label' => $this->collectRequest->status->getLabel(),
            'preferred_date' => $this->collectRequest->preferred_date?->toDateString(),
            'changes' => $this->changes,
            'message' => $this->getActionMessage(),
            'url' => $this->getAdminUrl(),
            'priority' => $this->getPriority(),
            'timestamp' => now()->toISOString(),
        ];
    }

    /**
     * Get the email subject line
     */
    private function getEmailSubject(): string
    {
        return match ($this->action) {
            'created' => "New Collect Request #{$this->collectRequest->id} - {$this->collectRequest->user->name}",
            'updated' => "Collect Request #{$this->collectRequest->id} Updated - {$this->collectRequest->status->getLabel()}",
            'deleted' => "Collect Request #{$this->collectRequest->id} Deleted",
            'restored' => "Collect Request #{$this->collectRequest->id} Restored",
            default => "Collect Request #{$this->collectRequest->id} - " . ucfirst($this->action),
        };
    }

    /**
     * Get the action message
     */
    private function getActionMessage(): string
    {
        return match ($this->action) {
            'created' => "A new collect request has been submitted by {$this->collectRequest->user->name}.",
            'updated' => "Collect request #{$this->collectRequest->id} has been updated. Current status: {$this->collectRequest->status->getLabel()}.",
            'deleted' => "Collect request #{$this->collectRequest->id} has been deleted.",
            'restored' => "Collect request #{$this->collectRequest->id} has been restored.",
            default => "Collect request #{$this->collectRequest->id} has been {$this->action}.",
        };
    }

    /**
     * Format individual field changes
     */
    private function formatChange(string $field, array $change): string
    {
        $fieldName = ucfirst(str_replace('_', ' ', $field));
        $old = $change['old'] ?? 'Not set';
        $new = $change['new'] ?? 'Not set';

        // Special formatting for specific fields
        return match ($field) {
            'status' => "{$fieldName}: {$old} → {$new}",
            'preferred_date' => "{$fieldName}: " . ($old ? date('M d, Y', strtotime($old)) : 'Not set') .
                " → " . ($new ? date('M d, Y', strtotime($new)) : 'Not set'),
            'details' => "{$fieldName}: Updated",
            default => "{$fieldName}: {$old} → {$new}",
        };
    }

    /**
     * Get admin panel URL
     */
    private function getAdminUrl(): string
    {
        return route("admin.collectRequests", $this->collectRequest->id);
    }

    /**
     * Get notification priority based on status and action
     */
    private function getPriority(): string
    {
        return match (true) {
            $this->action === 'created' => 'high',
            $this->collectRequest->status === CollectRequestStatus::REQUESTED => 'high',
            $this->collectRequest->status === CollectRequestStatus::SCHEDULED => 'medium',
            default => 'low',
        };
    }
}
