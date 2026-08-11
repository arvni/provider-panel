<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Records when a collect request was actually received.
 *
 * Orders take their received_at from the latest collect request behind their
 * samples, so that moment has to survive. Until now it was only implicit in
 * collect_requests.updated_at, which any later edit -- a note, a logistic
 * detail arriving by webhook -- would overwrite.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('collect_requests', function (Blueprint $table) {
            $table->timestamp('received_at')->nullable()->after('status');
        });

        // Best available seed for requests already sitting at 'received'.
        // updated_at is the closest thing to a receipt time we ever stored.
        DB::table('collect_requests')
            ->where('status', 'received')
            ->whereNull('received_at')
            ->update(['received_at' => DB::raw('updated_at')]);
    }

    public function down(): void
    {
        Schema::table('collect_requests', function (Blueprint $table) {
            $table->dropColumn('received_at');
        });
    }
};
