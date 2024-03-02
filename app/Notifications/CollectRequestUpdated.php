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

    /**
     * Create a new notification instance.
     */
    public function __construct(CollectRequest $collectRequest)
    {
        $this->collectRequest = $collectRequest;
    }

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->line("collect request #{$this->collectRequest->id} status changed to {$this->collectRequest->status->value}")
            ->cc([config("mail.to.address"),$notifiable->email]);
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            //
        ];
    }
}
