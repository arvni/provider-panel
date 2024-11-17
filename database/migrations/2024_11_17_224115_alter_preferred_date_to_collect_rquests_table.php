<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('collect_requests', function (Blueprint $table) {
            $table->date("preferred_date")->after("id")->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('collect_requests', function (Blueprint $table) {
            $table->dropColumn("preferred_date");
        });
    }
};
