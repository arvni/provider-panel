<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * `notes` was already fillable on CollectRequest, written by the per-sample
 * collect request flow and read back by RequestLogistic, but the column itself
 * was never created — so any request carrying notes failed to insert.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('collect_requests', function (Blueprint $table) {
            $table->text('notes')->nullable()->after('details');
        });
    }

    public function down(): void
    {
        Schema::table('collect_requests', function (Blueprint $table) {
            $table->dropColumn('notes');
        });
    }
};
