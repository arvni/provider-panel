<?php

namespace App\Notifications;

use App\Models\Order;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Support\HtmlString;
use Symfony\Component\Routing\Route;

class OrderStatusUpdated extends Notification implements ShouldQueue
{
    use Queueable;
    protected Order $order;

    /**
     * Create a new notification instance.
     */
    public function __construct(Order $order)
    {
        $this->order = $order;
    }


    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail','database'];
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        $statusConfig = $this->getStatusConfig();

        return (new MailMessage)
            ->subject($this->getEmailSubject())
            ->greeting($this->getGreeting($notifiable))
            ->line($this->getMainMessage())
            ->when($this->shouldShowDetails(), function ($message) {
                return $message
                    ->line('**Order Details:**')
                    ->line(new HtmlString($this->getOrderDetailsHtml()));
            })
            ->action($statusConfig['action'], $this->getActionUrl())
            ->line($statusConfig['footer'])
            ->salutation('Best regards,<br>' . config('app.name'));
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            "order_id"=>$this->order->id,
            "url"=>\route("orders.show",$this->order->id,false),
            "message"=>$this->getMessage(),
        ];
    }

    protected function getMessage(): string
    {
        $messages = [
            'reported' => 'Great news! Your test results for order **%s** are now available for review.',
            'received' => 'We have successfully received your sample for order **%s** and it\'s being prepared for analysis.',
            'processing' => 'Your sample for order **%s** is currently being analyzed by our laboratory team.',
        ];

        $defaultMessage = 'Your order **%s** status has been updated to **%s**.';

        $template = $messages[$this->order->status->value] ?? $defaultMessage;

        return sprintf($template, $this->order->orderId, ucwords($this->order->status->value));
    }

    /**
     * Get email subject based on order status
     */
    protected function getEmailSubject(): string
    {
        $statusMessages = [
            'reported' => 'Your Test Results Are Ready',
            'received' => 'We\'ve Received Your Sample',
            'processing' => 'Your Sample Is Being Processed',
            'sent' => 'Your Collection Kit Has Been Shipped',
            'semi reported' => 'Partial Results Available',
        ];

        $defaultSubject = sprintf(
            'Order %s Status Update: %s',
            $this->order->orderId,
            ucwords($this->order->status->value)
        );

        return $statusMessages[$this->order->status->value] ?? $defaultSubject;
    }

    /**
     * Get personalized greeting
     */
    protected function getGreeting(object $notifiable): string
    {
        $name = $notifiable->name ?? 'Valued Customer';
        $timeOfDay = now()->format('H') < 12 ? 'morning' :
            (now()->format('H') < 17 ? 'afternoon' : 'evening');

        return "Good {$timeOfDay}, {$name}!";
    }

    /**
     * Get main notification message
     */
    protected function getMainMessage(): string
    {
        $messages = [
            'reported' => 'Great news! Your test results for order **%s** are now available for review.',
            'received' => 'We have successfully received your sample for order **%s** and it\'s being prepared for analysis.',
            'processing' => 'Your sample for order **%s** is currently being analyzed by our laboratory team.',
        ];

        $defaultMessage = 'Your order **%s** status has been updated to **%s**.';

        $template = $messages[$this->order->status->value] ?? $defaultMessage;

        return sprintf($template, $this->order->orderId, ucwords($this->order->status->value));
    }

    /**
     * Determine if detailed order information should be shown
     */
    protected function shouldShowDetails(): bool
    {
        return in_array($this->order->status->value, [
            'received',
            'processing',
            'reported',
        ]);
    }

    /**
     * Get order details as HTML
     */
    protected function getOrderDetailsHtml(): string
    {
        $details = [];

        if ($this->order->Patient) {
            $details[] = "Patient: {$this->order->Patient->fullName}";
            if ($this->order->Patient->reference_id) {
                $details[] = "Reference: {$this->order->Patient->reference_id}";
            }
        }

        if ($this->order->Tests->isNotEmpty()) {
            $testNames = $this->order->Tests->pluck('name')->join(', ');
            $details[] = "Tests: {$testNames}";
        }

        if ($this->order->Samples->isNotEmpty()) {
            $details[] = "Samples: {$this->order->Samples->count()}";
        }

        $timeline = $this->getTimelineInfo();
        if (!empty($timeline)) {
            $details[] = "Timeline: {$timeline}";
        }

        return '<ul>' . collect($details)->map(fn($detail) => "<li>{$detail}</li>")->join('') . '</ul>';
    }

    /**
     * Get timeline information
     */
    protected function getTimelineInfo(): string
    {
        $timeline = [];

        if ($this->order->sent_at) {
            $timeline[] = 'Sent: ' . $this->order->sent_at->format('M d, Y');
        }

        if ($this->order->received_at) {
            $timeline[] = 'Received: ' . $this->order->received_at->format('M d, Y');
        }

        if ($this->order->reported_at) {
            $timeline[] = 'Reported: ' . $this->order->reported_at->format('M d, Y');
        }

        return implode(' → ', $timeline);
    }

    /**
     * Get status-specific configuration
     */
    protected function getStatusConfig(): array
    {
        $configs = [
            'reported' => [
                'action' => 'View Results',
                'footer' => 'Your healthcare provider will review these results with you.',
            ],
            'received' => [
                'action' => 'Track Order',
                'footer' => '',
            ],
            'processing' => [
                'action' => 'View Status',
                'footer' => 'We\'ll notify you as soon as your results are ready.',
            ],
        ];

        return $configs[$this->order->status->value] ?? [
            'action' => 'View Order',
            'footer' => 'Thank you for choosing our services.',
        ];
    }

    /**
     * Get the action URL
     */
    protected function getActionUrl(): string
    {
        return route('orders.show', $this->order);
    }



}
