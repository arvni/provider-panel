<?php

namespace App\Notifications;

use App\Models\CollectRequest;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class CollectRequestUpdated extends Notification implements ShouldQueue
{
    use Queueable;

    protected CollectRequest $collectRequest;
    protected string $action;

    /**
     * Create a new notification instance.
     */
    public function __construct(CollectRequest $collectRequest, string $action = 'updated')
    {
        $this->collectRequest = $collectRequest;
        $this->action = $action;
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
        $statusLabel = $this->collectRequest->status->getLabel();
        $subject = ucfirst($this->action) . ' Collect Request #' . $this->collectRequest->id;

        return (new MailMessage)
            ->subject($subject)
            ->greeting('Hello ' . $notifiable->name . '!')
            ->line("Your collect request #{$this->collectRequest->id} has been {$this->action}.")
            ->line("Status: {$statusLabel}")
            ->when($this->collectRequest->preferred_date, function ($message) {
                return $message->line("Preferred Date: {$this->collectRequest->preferred_date->format('M d, Y')}");
            })

            ->line('Thank you for using our service!');
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'collect_request_id' => $this->collectRequest->id,
            'action' => $this->action,
            'status' => $this->collectRequest->status->value,
            'status_label' => $this->collectRequest->status->getLabel(),
            'preferred_date' => $this->collectRequest->preferred_date?->toDateString(),
            'message' => "Collect request #{$this->collectRequest->id} has been {$this->action}",
        ];
    }
}
