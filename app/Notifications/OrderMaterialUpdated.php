<?php

namespace App\Notifications;

use App\Models\OrderMaterial;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use function route;

class OrderMaterialUpdated extends Notification implements ShouldQueue
{
    use Queueable;

    public OrderMaterial $orderMaterial;

    /**
     * Create a new message instance.
     */
    public function __construct(OrderMaterial $orderMaterial)
    {
        $orderMaterial->loadMissing("SampleType");
        $this->orderMaterial = $orderMaterial;
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
        return (new MailMessage)
            ->line("We Have Processed Your Order for " . $this->orderMaterial->amount . ", of " . $this->orderMaterial->SampleType->name)
            ->line('Thank you for using our application!');
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            "order_id" => $this->orderMaterial->id,
            "url" => route("orderMaterials.index", false),
            'message' => "material order has been processed for {$this->orderMaterial->amount} of {$this->orderMaterial->SampleType->name}.",
        ];
    }
}
