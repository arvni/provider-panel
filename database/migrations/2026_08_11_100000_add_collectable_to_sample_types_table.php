<?php

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
        Schema::table('sample_types', function (Blueprint $table) {
            // Which types a provider may hand over on a logistic request. Managed
            // here rather than on the central server, so the sample type sync
            // never overwrites it; admins opt each type in.
            $table->boolean('collectable')->default(false)->after('orderable');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('sample_types', function (Blueprint $table) {
            $table->dropColumn('collectable');
        });
    }
};
