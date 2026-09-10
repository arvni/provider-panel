<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    private const TYPE = 'collect_request_updated';

    /**
     * The steps a collection request notification is now split across, spelled
     * out rather than read from the enum: a migration has to replay the same
     * way years from now, and that list is free to change.
     */
    private const STEPS = [
        'created',
        'scheduled',
        'sample_collector_on_the_way',
        'picked_up',
        'received',
        'details',
    ];

    /**
     * Only the request being raised is emailed; every later step is in-app
     * only, so a mail answer has just one step to land on.
     */
    private const MAILED_STEPS = ['created'];

    /**
     * Carry each existing whole-type collection request answer down onto every
     * step it used to cover.
     *
     * Same reasoning as the order status split: left alone, those rows would
     * sit on the empty variant, match nothing, and -- because an unmatched
     * preference reads as "send" -- quietly start notifying people who had
     * switched these off.
     */
    public function up(): void
    {
        $existing = DB::table('notification_preferences')
            ->where('type', self::TYPE)
            ->where('variant', '')
            ->get();

        if ($existing->isEmpty()) {
            return;
        }

        $rows = [];
        foreach ($existing as $preference) {
            $steps = $preference->channel === 'mail' ? self::MAILED_STEPS : self::STEPS;

            foreach ($steps as $step) {
                $rows[] = [
                    'user_id' => $preference->user_id,
                    'type' => self::TYPE,
                    'variant' => $step,
                    'channel' => $preference->channel,
                    'enabled' => $preference->enabled,
                    'created_at' => $preference->created_at,
                    'updated_at' => now(),
                ];
            }
        }

        DB::table('notification_preferences')->insert($rows);
        DB::table('notification_preferences')
            ->where('type', self::TYPE)
            ->where('variant', '')
            ->delete();
    }

    /**
     * Collapse the per-step answers back to one. Someone who chose differently
     * per step cannot be represented by a single switch, so the strictest
     * answer wins: if they silenced any step, the whole type goes off rather
     * than resurrecting notifications they had asked not to receive.
     */
    public function down(): void
    {
        $collapsed = DB::table('notification_preferences')
            ->where('type', self::TYPE)
            ->where('variant', '!=', '')
            ->get()
            ->groupBy(fn ($preference) => $preference->user_id.'.'.$preference->channel);

        if ($collapsed->isEmpty()) {
            return;
        }

        DB::table('notification_preferences')->where('type', self::TYPE)->delete();

        DB::table('notification_preferences')->insert(
            $collapsed->map(fn ($group) => [
                'user_id' => $group->first()->user_id,
                'type' => self::TYPE,
                'variant' => '',
                'channel' => $group->first()->channel,
                'enabled' => $group->every(fn ($preference) => (bool) $preference->enabled),
                'created_at' => $group->first()->created_at,
                'updated_at' => now(),
            ])->values()->all()
        );
    }
};
