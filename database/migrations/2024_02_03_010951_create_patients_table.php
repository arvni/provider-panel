<?php

use App\Enums\Gender;
use App\Models\User;
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
        Schema::create('patients', function (Blueprint $table) {
            $table->id();
            $table->foreignIdFor(User::class)->constrained();
            $table->string("fullName");
            $table->string("nationality");
            $table->date('dateOfBirth');
            $table->enum("gender", array_map(fn ($item)=>$item->value, Gender::cases()));
            $table->boolean("consanguineousParents");
            $table->json("contact")->nullable();
            $table->json("extra")->nullable();
            $table->boolean("isFetus")->default(false);
            $table->string("reference_id")->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('patients');
    }
};
