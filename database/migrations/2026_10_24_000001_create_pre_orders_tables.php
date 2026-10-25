<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Pre-orders are owned by the LIS. The panel keeps a mirror of each one (the whole center-visible
 * snapshot, replaced on every webhook) and an outbox of the actions its users sent, so a page
 * can show "Sending…" until the LIS confirms or refuses them.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pre_orders', function (Blueprint $table) {
            $table->id();
            // The LIS pre-order id.
            $table->unsignedBigInteger('server_id')->unique();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('code', 20);
            // The LIS bumps it on every change; an older snapshot never replaces a newer one.
            $table->unsignedInteger('version');
            $table->string('stage', 32);
            $table->string('action_owner', 8);
            $table->json('snapshot');
            $table->timestamp('closed_at')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'action_owner']);
        });

        Schema::create('pre_order_actions', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            // Null for a create until the LIS answers with the new pre-order.
            $table->foreignId('pre_order_id')->nullable()->constrained()->cascadeOnDelete();
            $table->string('type', 32);
            $table->json('payload');
            // pending → done | failed
            $table->string('status', 12)->default('pending');
            $table->text('error')->nullable();
            $table->timestamps();
        });

        Schema::table('tests', function (Blueprint $table) {
            // The LIS flow id. Set = the test is ordered through a pre-order, not the order wizard.
            $table->unsignedBigInteger('flow_id')->nullable()->after('server_id');
            $table->json('preorder')->nullable()->after('flow_id');
        });

        Schema::table('orders', function (Blueprint $table) {
            // An order placed from a pre-order release; the release key is sent back to the LIS.
            $table->foreignId('pre_order_id')->nullable()->after('user_id')->constrained()->nullOnDelete();
            $table->string('pre_order_release_key', 64)->nullable()->after('pre_order_id');
            $table->unique(['pre_order_id', 'pre_order_release_key']);
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropUnique(['pre_order_id', 'pre_order_release_key']);
            $table->dropConstrainedForeignId('pre_order_id');
            $table->dropColumn('pre_order_release_key');
        });
        Schema::table('tests', function (Blueprint $table) {
            $table->dropColumn(['flow_id', 'preorder']);
        });
        Schema::dropIfExists('pre_order_actions');
        Schema::dropIfExists('pre_orders');
    }
};
