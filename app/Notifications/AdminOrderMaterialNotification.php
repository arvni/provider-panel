<?php

namespace App\Notifications;

use App\Models\OrderMaterial;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class AdminOrderMaterialNotification extends Notification implements ShouldQueue
{
    use Queueable;

    protected OrderMaterial $orderMaterial;

    /**
     * Create a new notification instance.
     */
    public function __construct(OrderMaterial $orderMaterial)
    {
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
        $message = (new MailMessage)
            ->subject( "New Material Order #{$this->orderMaterial->id} - {$this->orderMaterial->user->name}")
            ->greeting('Hello Admin!')
            ->line("A new material order has been submitted by {$this->orderMaterial->user->name} for {$this->orderMaterial->amount} of {$this->orderMaterial->sampleType->name}.",);

        // Add order details
        $message->line("**Order Details:**")
            ->line("• ID: #{$this->orderMaterial->id}")
            ->line("• Customer: {$this->orderMaterial->user->name}")
            ->line("• Sample Type: {$this->orderMaterial->sampleType->name}")
            ->line("• Amount: {$this->orderMaterial->amount}")
            ->line("• Created: {$this->orderMaterial->created_at->format('M d, Y H:i')}");

        // Add status if available
        if (isset($this->orderMaterial->status)) {
            $message->line("• Status: {$this->orderMaterial->status->value}");
        }

        // Add notes if available
        if ($this->orderMaterial->notes) {
            $message->line("**Notes:**");
            $message->line($this->orderMaterial->notes);
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
            'type' => 'admin_order_material',
            'order_material_id' => $this->orderMaterial->id,
            'customer_id' => $this->orderMaterial->user_id,
            'customer_name' => $this->orderMaterial->user->name,
            'sample_type_id' => $this->orderMaterial->sample_type_id,
            'sample_type_name' => $this->orderMaterial->sampleType->name,
            'amount' => $this->orderMaterial->amount,
            'status' => $this->orderMaterial->status->value ?? null,
            'delivery_date' => $this->orderMaterial->delivery_date?->toDateString(),
            'message' => "A new material order has been submitted by {$this->orderMaterial->user->name} for {$this->orderMaterial->amount} of {$this->orderMaterial->SampleType->name}.",
            'url' => $this->getAdminUrl(),
            'priority' =>  'high',
            'timestamp' => now()->toISOString(),
        ];
    }


    /**
     * Get admin panel URL
     */
    private function getAdminUrl(): string
    {
        return route("admin.orderMaterials.index");
    }
}
