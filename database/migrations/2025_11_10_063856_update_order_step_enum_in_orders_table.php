<?php

use App\Enums\OrderStep;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // For MySQL/MariaDB, we modify the column to include the new enum value
        $enumValues = array_map(fn($item) => "'{$item->value}'", OrderStep::cases());
        DB::statement("ALTER TABLE orders MODIFY COLUMN step ENUM(" . implode(", ", $enumValues) . ") NOT NULL DEFAULT 'test method'");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Remove the patient test assignment enum value
        $oldCases = array_filter(OrderStep::cases(), fn($case) => $case !== OrderStep::PATIENT_TEST_ASSIGNMENT);
        $enumValues = array_map(fn($item) => "'{$item->value}'", $oldCases);
        DB::statement("ALTER TABLE orders MODIFY COLUMN step ENUM(" . implode(", ", $enumValues) . ") NOT NULL DEFAULT 'test method'");
    }
};
