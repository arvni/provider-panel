<?php

namespace App\Notifications;

use App\Models\OrderMaterial;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class OrderMaterialRequested extends Notification implements ShouldQueue
{
    use Queueable;

    public $orderId;

    /**
     * Create a new message instance.
     */
    public function __construct($id)
    {
        $this->orderId = $id;
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
        $orderMaterial=OrderMaterial::query()
            ->withAggregate("User", "name")
            ->withAggregate("SampleType", "name")
            ->where("id", $this->orderId)->first();
        return (new MailMessage)
            ->line($orderMaterial->user_name . " Ordered " . $orderMaterial->amount . ", of " . $orderMaterial->sample_type_name)
            ->line('Thank you for using our application!')
            ->cc(config("mail.to.address"), config("mail.to.name"));
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
