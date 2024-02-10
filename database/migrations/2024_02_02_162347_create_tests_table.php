<?php

use App\Models\Consent;
use App\Models\OrderForm;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('tests', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger("server_id")->nullable()->unique();
            $table->foreignIdFor(OrderForm::class)->nullable()->constrained()->nullOnDelete();
            $table->foreignIdFor(Consent::class)->nullable()->constrained()->nullOnDelete();
            $table->string("name");
            $table->string("code");
            $table->string("shortName");
            $table->longText("description")->nullable();
            $table->integer("turnaroundTime");
            $table->boolean("is_active")->default(true);
            $table->softDeletes();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tests');
    }
};
