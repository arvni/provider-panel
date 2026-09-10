<?php

namespace App\Services;

use App\Enums\NotificationType;
use App\Models\NotificationPreference;
use App\Models\User;
use Illuminate\Support\Facades\DB;

/**
 * Reads and writes the per-user notification switches.
 *
 * A switch is identified by three things: the notification type, which flavour
 * of it (the "variant" -- an order status, say; empty for types that are simply
 * on or off), and the channel. Everything below keys on that triple.
 *
 * Registered as a singleton so the lookups memoize for the length of a request:
 * Notification::send() to every admin asks this once per user per channel, and
 * without the memo a five-admin, two-channel send would be ten queries for a
 * table that rarely holds more than a handful of rows per user.
 */
class NotificationPreferences
{
    /**
     * user id => ("type.variant.channel" => enabled), for users already looked up.
     *
     * @var array<int, array<string, bool>>
     */
    private array $cache = [];

    /**
     * Whether this user still wants this notification on this channel.
     *
     * Defaults to true throughout: an unconfigured user, a channel the type
     * does not deliver on, a variant nobody has an opinion about -- all send.
     */
    public function allows(User $user, NotificationType $type, string $variant, string $channel): bool
    {
        return $this->stored($user)[$this->key($type, $variant, $channel)] ?? true;
    }

    /**
     * The full picture for the settings screen: every type this user may
     * configure, with its labels and its current answer per channel.
     *
     * A type that splits into variants carries its answers on those instead of
     * on the type itself; the type row is then a heading, and 'channels' only
     * says which columns apply to the rows beneath it.
     *
     * @return array<int, array<string, mixed>>
     */
    public function matrixFor(User $user): array
    {
        $stored = $this->stored($user);

        return array_map(function (NotificationType $type) use ($stored) {
            $variants = [];

            foreach ($type->variants() as $key => $label) {
                $variants[] = [
                    'key' => $key,
                    'label' => $label,
                    'channels' => $this->channelsFor($type, $key, $stored),
                ];
            }

            return [
                'type' => $type->value,
                'label' => $type->label(),
                'description' => $type->description(),
                'group' => $type->group(),
                'channels' => $this->channelsFor($type, '', $stored),
                'variants' => $variants,
            ];
        }, $this->typesFor($user));
    }

    /**
     * The types this user is allowed to configure.
     *
     * @return array<int, NotificationType>
     */
    public function typesFor(User $user): array
    {
        return NotificationType::forAudiences($user->receivesAdminNotifications());
    }

    /**
     * Record a set of answers, replacing whatever the user had before.
     *
     * Everything outside what this user may configure is dropped rather than
     * rejected -- a type they cannot receive, a variant that type does not split
     * into, a channel that variant never uses. The screen cannot produce those, so
     * their presence means a hand-made request, and silently ignoring them keeps
     * junk out of the table without failing a save whose legitimate half is
     * perfectly good.
     *
     * @param  array<int, array{type: string, channel: string, enabled: bool, variant?: string|null}>  $answers
     */
    public function save(User $user, array $answers): void
    {
        $allowed = [];
        foreach ($this->typesFor($user) as $type) {
            $allowed[$type->value] = $type;
        }

        $rows = [];
        $now = now();

        foreach ($answers as $answer) {
            $type = $allowed[$answer['type']] ?? null;
            $variant = $answer['variant'] ?? '';

            if ($type === null
                || ! $type->supportsVariant($variant)
                || ! $type->supports($answer['channel'], $variant)) {
                continue;
            }

            // Keyed, so a payload naming the same switch twice settles on one
            // answer instead of tripping the unique index mid-insert.
            $rows[$this->key($type, $variant, $answer['channel'])] = [
                'user_id' => $user->id,
                'type' => $type->value,
                'variant' => $variant,
                'channel' => $answer['channel'],
                'enabled' => (bool) $answer['enabled'],
                'created_at' => $now,
                'updated_at' => $now,
            ];
        }

        // Delete-then-insert inside a transaction: the screen always submits the
        // user's complete set, so this is a replace, and it keeps rows from
        // lingering for a type or variant that has since gone away.
        DB::transaction(function () use ($user, $rows) {
            NotificationPreference::query()->where('user_id', $user->id)->delete();

            if ($rows !== []) {
                NotificationPreference::query()->insert(array_values($rows));
            }
        });

        $this->forget($user);
    }

    /**
     * Drop a user's memoized answers. Called after a save, and available to
     * tests that write preferences behind this service's back.
     */
    public function forget(?User $user = null): void
    {
        if ($user === null) {
            $this->cache = [];

            return;
        }

        unset($this->cache[$user->id]);
    }

    /**
     * The per-channel state of one switch row.
     *
     * @param  array<string, bool>  $stored
     * @return array<string, array{supported: bool, enabled: bool}>
     */
    private function channelsFor(NotificationType $type, string $variant, array $stored): array
    {
        $channels = [];

        foreach (NotificationType::allChannels() as $channel) {
            $channels[$channel] = $type->supports($channel, $variant)
                ? ['supported' => true, 'enabled' => $stored[$this->key($type, $variant, $channel)] ?? true]
                : ['supported' => false, 'enabled' => false];
        }

        return $channels;
    }

    /**
     * @return array<string, bool>
     */
    private function stored(User $user): array
    {
        // Read past the model so the enum cast cannot throw on a row whose type
        // has since been retired: an unrecognised key simply never matches a
        // lookup, and the notification keeps sending.
        return $this->cache[$user->id] ??= DB::table('notification_preferences')
            ->where('user_id', $user->id)
            ->get(['type', 'variant', 'channel', 'enabled'])
            ->mapWithKeys(fn ($row) => [
                $row->type.'.'.$row->variant.'.'.$row->channel => (bool) $row->enabled,
            ])
            ->all();
    }

    private function key(NotificationType $type, string $variant, string $channel): string
    {
        return $type->value.'.'.$variant.'.'.$channel;
    }
}
