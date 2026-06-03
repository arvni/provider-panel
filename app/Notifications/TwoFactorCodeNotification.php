<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * Delivers the login one-time code by email.
 *
 * Intentionally NOT queued: the code must reach the user before they can
 * complete login, so we send it synchronously regardless of queue workers.
 */
class TwoFactorCodeNotification extends Notification
{
    use Queueable;

    public function __construct(protected string $code)
    {
    }

    /**
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $minutes = config('two_factor.expiry', 10);

        return (new MailMessage)
            ->subject('Your ' . config('app.name') . ' login code')
            ->greeting('Hello ' . ($notifiable->name ?? '') . ',')
            ->line('Use the following code to finish signing in:')
            ->line('# ' . $this->code)
            ->line("This code expires in {$minutes} minutes and can only be used once.")
            ->line('If you did not try to sign in, you can safely ignore this email and your password should be changed.')
            ->salutation('Best regards,<br>' . config('app.name'));
    }
}
