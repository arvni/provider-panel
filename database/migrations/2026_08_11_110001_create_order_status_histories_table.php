<?php

use App\Enums\OrderStatus;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Status history behind the order timeline.
 *
 * Nothing recorded transitions before this table, so orders created earlier
 * can only be reconstructed from the three timestamps the orders table
 * happens to carry (sent_at, received_at, reported_at) plus wherever the
 * order sits now. Their earlier steps are simply not recoverable, and the
 * backfilled rows are marked so the UI can say so rather than implying the
 * history is complete.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('order_status_histories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained()->cascadeOnDelete();
            // Null on the first entry -- an order has no status before its first.
            $table->string('from_status')->nullable();
            $table->string('to_status');
            $table->timestamp('changed_at');
            // Who caused it, when a user did. Webhooks and sync passes leave this null.
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->boolean('backfilled')->default(false);
            $table->timestamps();

            $table->index(['order_id', 'changed_at']);
        });

        $this->backfill();
    }

    public function down(): void
    {
        Schema::dropIfExists('order_status_histories');
    }

    /**
     * Seed what the existing timestamp columns can still tell us.
     */
    private function backfill(): void
    {
        $now = now();

        DB::table('orders')->orderBy('id')->chunkById(500, function ($orders) use ($now) {
            $rows = [];

            foreach ($orders as $order) {
                // Ordered oldest first so from_status can chain correctly.
                $points = array_filter([
                    $order->sent_at ? [OrderStatus::SENT->value, $order->sent_at] : null,
                    $order->received_at ? [OrderStatus::RECEIVED->value, $order->received_at] : null,
                    $order->reported_at ? [OrderStatus::REPORTED->value, $order->reported_at] : null,
                ]);

                // Where the order actually sits now, if the timestamps didn't already say so.
                $last = end($points);
                if (! $last || $last[0] !== $order->status) {
                    $points[] = [$order->status, $order->updated_at ?? $order->created_at ?? $now];
                }

                $previous = null;
                foreach ($points as [$status, $changedAt]) {
                    $rows[] = [
                        'order_id' => $order->id,
                        'from_status' => $previous,
                        'to_status' => $status,
                        'changed_at' => $changedAt,
                        'user_id' => null,
                        'backfilled' => true,
                        'created_at' => $now,
                        'updated_at' => $now,
                    ];
                    $previous = $status;
                }
            }

            if ($rows) {
                DB::table('order_status_histories')->insert($rows);
            }
        });
    }
};
