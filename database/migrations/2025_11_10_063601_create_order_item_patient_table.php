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
        Schema::create('order_item_patient', function (Blueprint $table) {
            $table->id();
            $table->foreignIdFor(OrderItem::class)->constrained()->cascadeOnDelete();
            $table->foreignIdFor(Patient::class)->constrained()->cascadeOnDelete();
            $table->boolean('is_main')->default(false)->comment('Is this the main patient for this test');
            $table->timestamps();

            // Ensure unique combination
            $table->unique(['order_item_id', 'patient_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('order_item_patient');
    }
};
