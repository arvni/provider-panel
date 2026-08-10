<?php

use App\Enums\OrderStatus;
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
        Schema::table('orders', function (Blueprint $table) {
            $table->enum('status', array_map(fn ($item) => $item->value, OrderStatus::cases()))
                ->default(OrderStatus::PENDING->value)
                ->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Orders held for financial approval fall back to the previous lifecycle step.
        DB::table('orders')
            ->where('status', OrderStatus::WAITING_FOR_FINANCIAL_APPROVAL->value)
            ->update(['status' => OrderStatus::SEMI_REPORTED->value]);

        $statuses = array_values(array_filter(
            array_map(fn ($item) => $item->value, OrderStatus::cases()),
            fn ($value) => $value !== OrderStatus::WAITING_FOR_FINANCIAL_APPROVAL->value,
        ));

        Schema::table('orders', function (Blueprint $table) use ($statuses) {
            $table->enum('status', $statuses)
                ->default(OrderStatus::PENDING->value)
                ->change();
        });
    }
};
