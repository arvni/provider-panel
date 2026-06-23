<?php

use App\Models\Order;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (Schema::hasColumn('samples', 'order_id')) {
            // Backfill patient/order-item links from the order BEFORE dropping
            // the order_id column the seeder reads from.
            Artisan::call('db:seed --class=SamplesTableSeeder');

            Schema::table('samples', function (Blueprint $table) {
                $table->dropConstrainedForeignIdFor(Order::class);
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('samples', function (Blueprint $table) {

        });
    }
};
