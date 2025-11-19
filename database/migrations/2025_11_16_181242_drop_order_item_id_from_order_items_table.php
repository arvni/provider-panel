<?php

use App\Models\OrderItem;
use App\Models\Sample;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::whenTableHasColumn('samples', 'order_item_id', function (Blueprint $table) {
            $table->dropConstrainedForeignIdFor(OrderItem::class);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::whenTableDoesntHaveColumn('samples', 'order_item_id',function (Blueprint $table) {

        });
    }
};
