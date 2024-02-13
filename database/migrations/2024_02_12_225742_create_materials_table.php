<?php

use App\Models\Material;
use App\Models\OrderMaterial;
use App\Models\SampleType;
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
        Schema::create('materials', function (Blueprint $table) {
            $table->id();
            $table->foreignIdFor(OrderMaterial::class)->constrained();
            $table->foreignIdFor(SampleType::class)->constrained();
            $table->foreignIdFor(User::class)->constrained();
            $table->string("barcode")->unique()->index();
            $table->timestamp("expire_date")->nullable();
            $table->timestamps();
        });

        Schema::table("samples", function (Blueprint $table) {
            $table->foreignIdFor(Material::class)->nullable()->constrained();
        });

    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table("samples", function (Blueprint $table) {
            $table->dropConstrainedForeignIdFor(Material::class);
        });
        Schema::dropIfExists('materials');
    }
};
