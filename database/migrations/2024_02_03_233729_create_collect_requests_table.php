<?php

use App\Models\CollectRequest;
use App\Models\User;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('collect_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignIdFor(User::class)->constrained();
            $table->json("details")->nullable();
            $table->timestamps();
        });

        Schema::table("orders", function (Blueprint $table) {
            $table->foreignIdFor(CollectRequest::class)->nullable()->constrained();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table("orders", function (Blueprint $table) {
            $table->dropConstrainedForeignIdFor(CollectRequest::class);
        });
        Schema::dropIfExists('collect_requests');
    }
};
