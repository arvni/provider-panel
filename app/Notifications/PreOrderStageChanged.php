<?php

namespace App\Notifications;

use App\Interfaces\HasNotificationVariant;
use App\Models\PreOrder;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * A pre-order reached a stage the center cares about, or BION reminded the center to act.
 * It carries the PO code and the next action only, never the patient's name or the diagnosis:
 * the details are behind the login.
 */
class PreOrderStageChanged extends Notification implements HasNotificationVariant, ShouldQueue
{
    use Queueable;

    /** The switch for "BION is waiting on you" reminders. */
    public const VARIANT_REMINDER = 'reminder';

    /** Stages worth a message, as stage code => what the settings screen calls them. */
    public const STAGES = [
        'AWAITING_INFO' => 'BION asks for information',
        'AWAITING_FINANCE' => 'A quotation needs approval',
        'AWAITING_PRE_SAMPLES' => 'Pre-test samples can be sent',
        'PRE_COMPLETED' => 'Pre-test workup completed',
        'AWAITING_SAMPLES' => 'Samples can be sent',
        'BATCH_OPEN' => 'Batch received – more expected',
        'TESTING' => 'Testing started',
        'RESULTS_RELEASED' => 'Results released',
    ];

    public function __construct(public readonly PreOrder $preOrder, public readonly bool $reminder = false) {}

    /** @return array<int, string> */
    public function via(object $notifiable): array
    {
        return ['mail', 'database'];
    }

    public function notificationVariant(): ?string
    {
        return $this->reminder ? self::VARIANT_REMINDER : $this->preOrder->stage;
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject($this->subject())
            ->line($this->message())
            ->action('Open the pre-order', route('preOrders.show', $this->preOrder->id));
    }

    /** @return array<string, mixed> */
    public function toArray(object $notifiable): array
    {
        return [
            'pre_order_id' => $this->preOrder->id,
            'stage' => $this->preOrder->stage,
            'url' => route('preOrders.show', $this->preOrder->id, false),
            'message' => $this->message(),
        ];
    }

    private function subject(): string
    {
        return $this->preOrder->code.': '.($this->reminder ? 'reminder' : ($this->preOrder->snapshot['stage']['label'] ?? $this->preOrder->stage));
    }

    private function message(): string
    {
        $stage = $this->preOrder->snapshot['stage'] ?? [];
        $next = $stage['next_action'] ?? null;

        return $this->reminder
            ? "BION is waiting on you for pre-order {$this->preOrder->code}".($next ? ": {$next}." : '.')
            : "Pre-order {$this->preOrder->code} is now at “".($stage['label'] ?? $this->preOrder->stage).'”.'.($next ? " Next: {$next}." : '');
    }
}
