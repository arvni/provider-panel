<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * Delivers the login one-time code by email.
 *
 * Queued so a slow mail transport never blocks the login request. With a
 * dedicated queue worker the send happens asynchronously; under the `sync`
 * queue connection it still runs inline, so any send failure surfaces to the
 * caller (see the try/catch in the auth controllers).
 */
class TwoFactorCodeNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(protected string $code, protected int $userId)
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

    /**
     * Called once the queued send has exhausted its retries.
     *
     * Under an async queue the controller's try/catch only sees dispatch
     * errors, not the eventual transport failure — this is where that failure
     * gets recorded. The undelivered code simply lapses on its own expiry.
     */
    public function failed(Throwable $exception): void
    {
        Log::error('Two-factor login code delivery failed after retries.', [
            'user_id' => $this->userId,
            'exception' => $exception,
        ]);
    }
}
