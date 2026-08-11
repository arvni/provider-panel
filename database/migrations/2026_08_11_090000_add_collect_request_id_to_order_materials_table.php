<?php

use App\Models\CollectRequest;
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
        Schema::table('order_materials', function (Blueprint $table) {
            // A kit asked for while raising a logistic request points back at it.
            // Materials ordered from the Order Materials page keep this null.
            $table->foreignIdFor(CollectRequest::class)->nullable()->after('sample_type_id')->constrained()->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('order_materials', function (Blueprint $table) {
            $table->dropForeign(['collect_request_id']);
            $table->dropColumn('collect_request_id');
        });
    }
};
