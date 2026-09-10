<?php

namespace App\Enums;

use App\Interfaces\HasNotificationVariant;
use App\Notifications\AdminCollectRequestNotification;
use App\Notifications\AdminKitOrderNotification;
use App\Notifications\AdminOrderMaterialNotification;
use App\Notifications\CollectRequestDeleted;
use App\Notifications\CollectRequestUpdated;
use App\Notifications\KitOrderRequested;
use App\Notifications\OrderMaterialRequested;
use App\Notifications\OrderMaterialUpdated;
use App\Notifications\OrderRemovedByAdmin;
use App\Notifications\OrderStatusUpdated;

/**
 * The notifications a user is allowed to switch off, and the channels each one
 * can be switched off on.
 *
 * This is the whitelist the whole preference feature is built on: the settings
 * screen renders from it, the save path validates against it, and the sending
 * listener consults it. A notification with no case here can never be silenced
 * -- which is the point for the transactional mail (two-factor codes, email
 * verification, password resets), where a user opting out would lock them out
 * of their own account rather than merely quieting their inbox.
 *
 * Adding a notification class without adding it here is therefore safe: it just
 * keeps sending, as it does today.
 */
enum NotificationType: string
{
    case ORDER_STATUS_UPDATED = 'order_status_updated';
    case ORDER_REMOVED_BY_ADMIN = 'order_removed_by_admin';
    case COLLECT_REQUEST_UPDATED = 'collect_request_updated';
    case COLLECT_REQUEST_DELETED = 'collect_request_deleted';
    case ORDER_MATERIAL_REQUESTED = 'order_material_requested';
    case ORDER_MATERIAL_UPDATED = 'order_material_updated';
    case KIT_ORDER_REQUESTED = 'kit_order_requested';
    case ADMIN_COLLECT_REQUEST = 'admin_collect_request';
    case ADMIN_KIT_ORDER = 'admin_kit_order';
    case ADMIN_ORDER_MATERIAL = 'admin_order_material';

    /** Audience: notifications the lab's own staff receive. */
    public const AUDIENCE_ADMIN = 'admin';

    /** Audience: notifications a referring provider receives about their own work. */
    public const AUDIENCE_PROVIDER = 'provider';

    /**
     * The notification class this case stands for.
     *
     * @return class-string
     */
    public function notificationClass(): string
    {
        return match ($this) {
            self::ORDER_STATUS_UPDATED => OrderStatusUpdated::class,
            self::ORDER_REMOVED_BY_ADMIN => OrderRemovedByAdmin::class,
            self::COLLECT_REQUEST_UPDATED => CollectRequestUpdated::class,
            self::COLLECT_REQUEST_DELETED => CollectRequestDeleted::class,
            self::ORDER_MATERIAL_REQUESTED => OrderMaterialRequested::class,
            self::ORDER_MATERIAL_UPDATED => OrderMaterialUpdated::class,
            self::KIT_ORDER_REQUESTED => KitOrderRequested::class,
            self::ADMIN_COLLECT_REQUEST => AdminCollectRequestNotification::class,
            self::ADMIN_KIT_ORDER => AdminKitOrderNotification::class,
            self::ADMIN_ORDER_MATERIAL => AdminOrderMaterialNotification::class,
        };
    }

    /**
     * The type covering a notification instance, or null when the notification
     * is not one a user may switch off.
     */
    public static function forNotification(object $notification): ?self
    {
        foreach (self::cases() as $case) {
            if ($notification instanceof ($case->notificationClass())) {
                return $case;
            }
        }

        return null;
    }

    public function label(): string
    {
        return match ($this) {
            self::ORDER_STATUS_UPDATED => 'Order status changes',
            self::ORDER_REMOVED_BY_ADMIN => 'Order removed by the lab',
            self::COLLECT_REQUEST_UPDATED => 'Collection request updates',
            self::COLLECT_REQUEST_DELETED => 'Collection request cancelled',
            self::ORDER_MATERIAL_REQUESTED => 'Kit request confirmation',
            self::ORDER_MATERIAL_UPDATED => 'Kit status changes',
            self::KIT_ORDER_REQUESTED => 'Kit order confirmation',
            self::ADMIN_COLLECT_REQUEST => 'Collection requests (all providers)',
            self::ADMIN_KIT_ORDER => 'Kit orders (all providers)',
            self::ADMIN_ORDER_MATERIAL => 'Material requests (all providers)',
        };
    }

    public function description(): string
    {
        return match ($this) {
            self::ORDER_STATUS_UPDATED => 'Choose which stages of an order you want to hear about.',
            self::ORDER_REMOVED_BY_ADMIN => 'One of your orders was removed by the lab after it had been sent.',
            self::COLLECT_REQUEST_UPDATED => 'A collection request you raised was created or moved to a new status.',
            self::COLLECT_REQUEST_DELETED => 'A collection request you raised was cancelled.',
            self::ORDER_MATERIAL_REQUESTED => 'Confirmation that your request for sampling materials reached the lab.',
            self::ORDER_MATERIAL_UPDATED => 'A kit you ordered was prepared, dispatched, or delivered.',
            self::KIT_ORDER_REQUESTED => 'Confirmation that your kit order reached the lab.',
            self::ADMIN_COLLECT_REQUEST => 'Any provider raises, changes, or cancels a collection request.',
            self::ADMIN_KIT_ORDER => 'Any provider orders kits alongside a collection request.',
            self::ADMIN_ORDER_MATERIAL => 'Any provider requests sampling materials.',
        };
    }

    /**
     * The heading this type sits under on the settings screen.
     */
    public function group(): string
    {
        return match ($this) {
            self::ORDER_STATUS_UPDATED,
            self::ORDER_REMOVED_BY_ADMIN => 'Orders',
            self::COLLECT_REQUEST_UPDATED,
            self::COLLECT_REQUEST_DELETED => 'Collection requests',
            self::ORDER_MATERIAL_REQUESTED,
            self::ORDER_MATERIAL_UPDATED,
            self::KIT_ORDER_REQUESTED => 'Kits and materials',
            self::ADMIN_COLLECT_REQUEST,
            self::ADMIN_KIT_ORDER,
            self::ADMIN_ORDER_MATERIAL => 'Lab-wide activity',
        };
    }

    public function audience(): string
    {
        return match ($this) {
            self::ADMIN_COLLECT_REQUEST,
            self::ADMIN_KIT_ORDER,
            self::ADMIN_ORDER_MATERIAL => self::AUDIENCE_ADMIN,
            default => self::AUDIENCE_PROVIDER,
        };
    }

    /**
     * The channels this notification actually delivers on, and so the only ones
     * worth offering a switch for. Mirrors each class's via(); a switch for a
     * channel the notification never uses would be a control that does nothing.
     *
     * @return array<int, string>
     */
    public function channels(): array
    {
        return match ($this) {
            self::COLLECT_REQUEST_DELETED => ['database'],
            self::ORDER_MATERIAL_REQUESTED,
            self::KIT_ORDER_REQUESTED => ['mail'],
            default => ['mail', 'database'],
        };
    }

    public function supports(string $channel): bool
    {
        return in_array($channel, $this->channels(), true);
    }

    /**
     * The individually switchable flavours of this notification, as
     * key => label. Empty for types that are simply on or off.
     *
     * The order status mail is one class covering four pieces of news, and
     * providers do not want them equally: results being ready matters far more
     * than a sample being logged in. Listing exactly OrderStatus::notifiable()
     * keeps the switches honest -- every status that can arrive has one, and no
     * switch exists for a status that never notifies.
     *
     * @return array<string, string>
     */
    public function variants(): array
    {
        if ($this !== self::ORDER_STATUS_UPDATED) {
            return [];
        }

        $variants = [];
        foreach (OrderStatus::notifiable() as $status) {
            $variants[$status->value] = $status->label();
        }

        return $variants;
    }

    public function hasVariants(): bool
    {
        return $this->variants() !== [];
    }

    /**
     * Whether this type offers a switch for the given variant. A type without
     * variants accepts only the empty variant, which is how a plain on/off
     * type is stored.
     */
    public function supportsVariant(string $variant): bool
    {
        return $this->hasVariants()
            ? array_key_exists($variant, $this->variants())
            : $variant === '';
    }

    /**
     * Which variant a notification instance represents, as stored against a
     * preference. Types without variants always answer '' -- the single switch.
     */
    public function variantFor(object $notification): string
    {
        if (! $this->hasVariants() || ! $notification instanceof HasNotificationVariant) {
            return '';
        }

        return $notification->notificationVariant() ?? '';
    }

    /**
     * Every channel any type can be configured on.
     *
     * @return array<int, string>
     */
    public static function allChannels(): array
    {
        return ['mail', 'database'];
    }

    /**
     * The types a user may configure. Admin-only types stay off a provider's
     * screen -- a provider never receives them, so a switch would be a lie.
     *
     * @return array<int, self>
     */
    public static function forAudiences(bool $isAdmin): array
    {
        return array_values(array_filter(
            self::cases(),
            fn (self $type) => $isAdmin || $type->audience() === self::AUDIENCE_PROVIDER,
        ));
    }
}
