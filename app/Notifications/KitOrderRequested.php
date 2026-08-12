<?php

namespace App\Notifications;

use App\Models\CollectRequest;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * Confirms the kits a provider ordered on a logistic request.
 *
 * One request can carry several kits, and each becomes its own order material.
 * The provider filled in one form, so they hear back once, with every kit
 * listed — rather than once per material, which would read as several separate
 * orders they never placed.
 */
class KitOrderRequested extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(public int $collectRequestId) {}

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
        $collectRequest = CollectRequest::find($this->collectRequestId);
        $kits = $collectRequest?->requestedKits() ?? [];

        $message = (new MailMessage)
            ->subject('Your Kit Order #'.$this->collectRequestId)
            ->line('We have received your order for the following kits:');

        foreach ($kits as $kit) {
            $message->line('• '.$kit['amount'].' × '.$kit['name']);
        }

        return $message->line('Thank you for using our application!');
    }
}
