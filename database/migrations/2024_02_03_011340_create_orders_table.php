<?php

use App\Enums\OrderStatus;
use App\Enums\OrderStep;
use App\Models\Patient;
use App\Models\User;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger("server_id")->unique()->nullable();
            $table->foreignIdFor(User::class)->constrained();
            $table->foreignIdFor(Patient::class)->nullable()->constrained();
            $table->enum("status", array_map(fn($item) => $item->value, OrderStatus::cases()))->default(OrderStatus::PENDING->value);
            $table->enum("step", array_map(fn($item) => $item->value, OrderStep::cases()))->default(OrderStep::TEST_METHOD->value);
            $table->json("files")->default(json_encode([]));
            $table->json("orderForms")->default(json_encode([]));
            $table->json("consents")->default(json_encode([]));
            $table->timestamps();
            $table->timestamp("sent_at")->nullable();
            $table->timestamp("received_at")->nullable();
            $table->timestamp("reported_at")->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};
