<?php

use App\Models\SampleType;
use App\Models\Test;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('sample_type_test', function (Blueprint $table) {
            $table->uuid("id");
            $table->unsignedBigInteger("sample_type_id");
            $table->unsignedBigInteger("test_id");
            $table->Text("description")->nullable();
            $table->boolean("is_default")->default(false);
            $table->foreign("sample_type_id")->references("id")->on("sample_types")->cascadeOnDelete();
            $table->foreign("test_id")->references("id")->on("tests")->cascadeOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists("sample_type_test");
    }
};
