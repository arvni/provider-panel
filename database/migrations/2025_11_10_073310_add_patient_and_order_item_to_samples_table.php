<?php

use App\Models\OrderItem;
use App\Models\Patient;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('samples', function (Blueprint $table) {
            $table->foreignIdFor(Patient::class)->nullable()->after('order_id')->constrained()->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('samples', function (Blueprint $table) {
            $table->dropForeignIdFor(Patient::class);
            $table->dropForeignIdFor(OrderItem::class);
            $table->dropColumn(['patient_id', 'order_item_id']);
        });
    }
};
