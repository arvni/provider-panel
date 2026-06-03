<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Backfill samples.collect_request_id from the existing orders.collect_request_id.
 *
 * In provider-panel a sample belongs to order-item(s) via the order_item_sample pivot,
 * and an order carries the collect_request_id. Copy it onto the order's samples.
 * Only NULL samples are touched.
 */
return new class extends Migration
{
    public function up(): void
    {
        DB::statement(<<<'SQL'
            UPDATE samples s
            JOIN order_item_sample ois ON ois.sample_id = s.id
            JOIN order_items oi ON oi.id = ois.order_item_id
            JOIN orders o ON o.id = oi.order_id
            SET s.collect_request_id = o.collect_request_id
            WHERE o.collect_request_id IS NOT NULL AND s.collect_request_id IS NULL
        SQL);
    }

    public function down(): void
    {
        // Irreversible data backfill: leave samples.collect_request_id as-is on rollback.
    }
};
