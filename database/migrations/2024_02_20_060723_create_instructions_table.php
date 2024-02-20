<?php

use App\Models\Instruction;
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
        Schema::create('instructions', function (Blueprint $table) {
                $table->id();
                $table->string("name")->unique();
                $table->text("file");
                $table->timestamps();
        });

        Schema::table("tests",function (Blueprint $table){
            $table->foreignIdFor(Instruction::class)->nullable()->constrained()->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table("tests",function (Blueprint $table){
            $table->dropConstrainedForeignIdFor(Instruction::class);
        });
        Schema::dropIfExists('instructions');
    }
};
