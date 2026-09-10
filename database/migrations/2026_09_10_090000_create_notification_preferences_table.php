<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * One row per switch a user has actually touched.
     *
     * Deliberately sparse: everything is on by default, so a user who has never
     * opened the settings screen has no rows here and keeps exactly the delivery
     * they had before this table existed. Only an explicit choice is stored,
     * which also means a later change to a type's default reaches everyone who
     * never expressed an opinion.
     */
    public function up(): void
    {
        Schema::create('notification_preferences', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('type', 64);
            $table->string('channel', 32);
            $table->boolean('enabled');
            $table->timestamps();

            // The lookup the sending listener makes, and the guarantee that one
            // switch cannot end up recorded twice with opposite answers.
            $table->unique(['user_id', 'type', 'channel']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('notification_preferences');
    }
};
