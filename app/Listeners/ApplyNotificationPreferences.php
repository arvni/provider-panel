<?php

namespace App\Listeners;

use App\Enums\NotificationType;
use App\Models\User;
use App\Services\NotificationPreferences;
use Illuminate\Notifications\Events\NotificationSending;

/**
 * Cancels one channel of one notification when its recipient has switched it off.
 *
 * Laravel fires NotificationSending once per notifiable per channel and treats a
 * false return as "do not deliver this one" (see NotificationSender::
 * shouldSendNotification), which makes this the one place preferences have to be
 * honoured. The alternative -- a check inside each notification's via() -- would
 * have to be repeated across every class and remembered for every new one, and
 * the fourteen scattered dispatch sites give plenty of opportunity to forget.
 *
 * Everything here fails open. An unrecognised notification, a notifiable that is
 * not a user, a variant nobody has an opinion about, an on-demand mail with no
 * stored preferences: all send. A user can only ever stop what the enum
 * explicitly lets them stop, which is why the two-factor and account mail
 * cannot be silenced from the settings screen.
 */
class ApplyNotificationPreferences
{
    public function __construct(private readonly NotificationPreferences $preferences) {}

    /**
     * Returning null lets the notification through without halting any other
     * listener on the event; only false cancels.
     */
    public function handle(NotificationSending $event): ?bool
    {
        $notifiable = $event->notifiable;

        if (! $notifiable instanceof User) {
            return null;
        }

        $type = NotificationType::forNotification($event->notification);

        if ($type === null) {
            return null;
        }

        $variant = $type->variantFor($event->notification);

        return $this->preferences->allows($notifiable, $type, $variant, $event->channel)
            ? null
            : false;
    }
}
