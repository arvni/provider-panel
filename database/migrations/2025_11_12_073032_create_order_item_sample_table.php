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

        Schema::create('order_item_sample', function (Blueprint $table) {
            $table->foreignIdFor(OrderItem::class)->constrained()->cascadeOnDelete();
            $table->foreignIdFor(Sample::class)->constrained()->cascadeOnDelete();
            $table->unique(['sample_id', 'order_item_id']);
        });
        Artisan::call('db:seed --class=SamplesTableSeeder', );
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('order_item_sample');
    }
};
