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
        Schema::create('patient_relations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('patient_id')->constrained('patients')->cascadeOnDelete();
            $table->foreignId('related_patient_id')->constrained('patients')->cascadeOnDelete();
            $table->string('relation_type')->nullable()->comment('Type of relationship: parent, sibling, spouse, child, etc.');
            $table->text('notes')->nullable();
            $table->timestamps();

            // Prevent duplicate relations
            $table->unique(['patient_id', 'related_patient_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('patient_relations');
    }
};
