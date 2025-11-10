<?php

use App\Models\Patient;
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
        Schema::table('orders', function (Blueprint $table) {
            // Rename patient_id to main_patient_id for clarity
            $table->renameColumn('patient_id', 'main_patient_id');

            // Store array of all patient IDs in the order
            $table->json('patient_ids')->default(json_encode([]))->after('main_patient_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->renameColumn('main_patient_id', 'patient_id');
            $table->dropColumn('patient_ids');
        });
    }
};
