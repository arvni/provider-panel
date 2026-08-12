<?php

namespace App\Notifications;

use App\Models\CollectRequest;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * Tells the admins about the kits ordered on one logistic request.
 *
 * The per-material AdminOrderMaterialNotification still covers the Order
 * Materials page, where a material really is ordered on its own. A logistic
 * request is one submission, so it announces itself once and names every kit
 * and the material each became.
 */
class AdminKitOrderNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(protected CollectRequest $collectRequest) {}

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
        $kits = $this->collectRequest->requestedKits();
        // A logistic request cannot exist without the provider who raised it —
        // collect_requests.user_id is not nullable.
        $provider = $this->collectRequest->user->name;

        $message = (new MailMessage)
            ->subject("New Kit Order #{$this->collectRequest->id} - {$provider}")
            ->greeting('Hello Admin!')
            ->line($provider.' has ordered '.count($kits).' '.(count($kits) === 1 ? 'kit' : 'kits').' on a logistic request.')
            ->line('**Order Details:**')
            ->line("• Logistic Request: #{$this->collectRequest->id}")
            ->line("• Customer: {$provider}")
            ->line('• Preferred Date: '.($this->collectRequest->preferred_date ?? '—'))
            ->line('• Created: '.$this->collectRequest->created_at->format('M d, Y H:i'))
            ->line('**Kits:**');

        foreach ($kits as $kit) {
            $message->line(
                '• '.$kit['amount'].' × '.$kit['name'].
                (isset($kit['order_material_id']) ? ' (material #'.$kit['order_material_id'].')' : '')
            );
        }

        if ($comment = $this->collectRequest->details['comment'] ?? null) {
            $message->line('**Notes:**')->line($comment);
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
        $kits = $this->collectRequest->requestedKits();
        // A logistic request cannot exist without the provider who raised it —
        // collect_requests.user_id is not nullable.
        $provider = $this->collectRequest->user->name;

        return [
            'type' => 'admin_kit_order',
            'collect_request_id' => $this->collectRequest->id,
            'customer_id' => $this->collectRequest->user_id,
            'customer_name' => $provider,
            'kits' => $kits,
            'order_material_ids' => array_values(array_filter(
                array_column($kits, 'order_material_id')
            )),
            'message' => $provider.' has ordered '.count($kits).' '.(count($kits) === 1 ? 'kit' : 'kits').' on a logistic request.',
            'url' => $this->getAdminUrl(),
            'priority' => 'high',
            'timestamp' => now()->toISOString(),
        ];
    }

    /**
     * Get admin panel URL
     */
    private function getAdminUrl(): string
    {
        return route('admin.orderMaterials.index');
    }
}
