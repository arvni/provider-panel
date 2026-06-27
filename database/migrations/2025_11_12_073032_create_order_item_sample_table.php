<?php

use App\Models\OrderItem;
use App\Models\Sample;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {

        Schema::create('order_item_sample', function (Blueprint $table) {
            $table->foreignIdFor(OrderItem::class)->constrained()->cascadeOnDelete();
            $table->foreignIdFor(Sample::class)->constrained()->cascadeOnDelete();
            $table->unique(['sample_id', 'order_item_id']);
        });

        $this->backfillSamplesFromOrders();
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('order_item_sample');
    }

    /**
     * Link each unassigned sample to its order's items and adopt the order's
     * main patient. Previously delegated to SamplesTableSeeder; inlined here so
     * the migration owns its data step instead of invoking a seeder class.
     * Idempotent: only samples still tied to an order and without a patient.
     */
    private function backfillSamplesFromOrders(): void
    {
        DB::statement(<<<'SQL'
            INSERT IGNORE INTO order_item_sample (order_item_id, sample_id)
            SELECT oi.id, s.id
            FROM samples s
            JOIN order_items oi ON oi.order_id = s.order_id
            WHERE s.order_id IS NOT NULL AND s.patient_id IS NULL
        SQL);

        DB::statement(<<<'SQL'
            UPDATE samples s
            JOIN orders o ON o.id = s.order_id
            SET s.patient_id = o.main_patient_id
            WHERE s.order_id IS NOT NULL AND s.patient_id IS NULL
        SQL);
    }
};
