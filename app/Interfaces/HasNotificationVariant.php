<?php

namespace App\Interfaces;

/**
 * A notification that comes in several flavours a user may want to choose
 * between, rather than only switching the whole thing on or off.
 *
 * The order status mail is the case this exists for: one notification class
 * covers four different pieces of news, and a provider who does not care that a
 * sample was received may still very much want to hear that results are ready.
 *
 * Implemented on the notification rather than inferred from its payload so the
 * split is declared where the notification is defined, and so a class that adds
 * a variant cannot silently start being matched against the wrong switch.
 */
interface HasNotificationVariant
{
    /**
     * Which flavour this particular instance is -- matched against the keys in
     * NotificationType::variants(). Null means "no particular one", which is
     * treated as unconfigurable and therefore always delivered.
     */
    public function notificationVariant(): ?string;
}
