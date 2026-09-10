<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * The statuses the order status mail is split across, spelled out rather
     * than read from OrderStatus::notifiable(): a migration has to replay the
     * same way years from now, and that list is free to change.
     */
    private const ORDER_STATUSES = [
        'received',
        'processing',
        'waiting for financial approval',
        'reported',
    ];

    private const ORDER_STATUS_TYPE = 'order_status_updated';

    /**
     * Split a switch by which flavour of the notification it covers.
     *
     * The order status mail is one notification class carrying four different
     * pieces of news, and providers want them separately -- results being ready
     * is worth an email in a way that a sample being logged in is not.
     *
     * Empty string rather than null for "the whole type": MySQL treats NULLs as
     * distinct in a unique index, so a nullable column would let the same switch
     * be stored twice with opposite answers -- exactly what the index is here to
     * prevent.
     */
    public function up(): void
    {
        Schema::table('notification_preferences', function (Blueprint $table) {
            $table->string('variant', 64)->default('')->after('type');
        });

        // The replacement goes on before the old one comes off. Both lead with
        // user_id, and MySQL leans on whichever index does to enforce the
        // foreign key -- drop the only one first and it refuses (errno 1553).
        Schema::table('notification_preferences', function (Blueprint $table) {
            $table->unique(['user_id', 'type', 'variant', 'channel']);
        });

        Schema::table('notification_preferences', function (Blueprint $table) {
            $table->dropUnique('notification_preferences_user_id_type_channel_unique');
        });

        $this->expandOrderStatusPreferences();
    }

    /**
     * Carry each existing whole-type order status answer down onto every status
     * it used to cover.
     *
     * Without this the old rows would sit on the empty variant, match nothing,
     * and -- because an unmatched preference reads as "send" -- quietly start
     * mailing people who had switched these off. Preserving the answer is the
     * whole point: the split changes how finely a user can express themselves,
     * not what they already said.
     */
    private function expandOrderStatusPreferences(): void
    {
        $existing = DB::table('notification_preferences')
            ->where('type', self::ORDER_STATUS_TYPE)
            ->where('variant', '')
            ->get();

        if ($existing->isEmpty()) {
            return;
        }

        $rows = [];
        foreach ($existing as $preference) {
            foreach (self::ORDER_STATUSES as $status) {
                $rows[] = [
                    'user_id' => $preference->user_id,
                    'type' => $preference->type,
                    'variant' => $status,
                    'channel' => $preference->channel,
                    'enabled' => $preference->enabled,
                    'created_at' => $preference->created_at,
                    'updated_at' => now(),
                ];
            }
        }

        DB::table('notification_preferences')->insert($rows);
        DB::table('notification_preferences')
            ->where('type', self::ORDER_STATUS_TYPE)
            ->where('variant', '')
            ->delete();
    }

    /**
     * Collapse the per-status answers back to one. A user who chose differently
     * per status cannot be represented by a single switch, so the strictest
     * answer wins: if they silenced any status, the whole type goes off rather
     * than resurrecting mail they had asked not to receive.
     */
    public function down(): void
    {
        $collapsed = DB::table('notification_preferences')
            ->where('type', self::ORDER_STATUS_TYPE)
            ->where('variant', '!=', '')
            ->get()
            ->groupBy(fn ($preference) => $preference->user_id.'.'.$preference->channel);

        // Cleared before the narrower index goes back on: two statuses of the
        // same type and channel are one row once the variant stops counting.
        DB::table('notification_preferences')->where('type', self::ORDER_STATUS_TYPE)->delete();

        // Same foreign-key dance as up(), in reverse.
        Schema::table('notification_preferences', function (Blueprint $table) {
            $table->unique(['user_id', 'type', 'channel']);
        });

        Schema::table('notification_preferences', function (Blueprint $table) {
            $table->dropUnique('notification_preferences_user_id_type_variant_channel_unique');
            $table->dropColumn('variant');
        });

        $rows = $collapsed->map(fn ($group) => [
            'user_id' => $group->first()->user_id,
            'type' => self::ORDER_STATUS_TYPE,
            'channel' => $group->first()->channel,
            'enabled' => $group->every(fn ($preference) => (bool) $preference->enabled),
            'created_at' => $group->first()->created_at,
            'updated_at' => now(),
        ])->values()->all();

        if ($rows !== []) {
            DB::table('notification_preferences')->insert($rows);
        }
    }
};
