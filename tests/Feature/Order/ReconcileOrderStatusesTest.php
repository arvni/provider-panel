<?php

namespace Tests\Feature\Order;

use App\Enums\OrderStatus;
use App\Models\Order;
use App\Models\User;
use App\Notifications\OrderStatusUpdated;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

/**
 * Lab-raised orders were unreachable until the acceptance id became a lookup
 * key, so the first sweep after that fix would advance a whole backlog at once
 * and mail a provider for every order in it. This command does that catch-up
 * deliberately and silently beforehand -- but silence must not leak: the sweep
 * that follows has to keep announcing normally.
 */
class ReconcileOrderStatusesTest extends TestCase
{
    use RefreshDatabase;

    private function fakeOrdersApi(array $rows): void
    {
        Cache::put('api_sanctum_token', encrypt('test-token'));

        Http::fake([
            config('api.server_url').config('api.orders_path').'*' => Http::response(['data' => $rows]),
        ]);
    }

    private function strandedOrder(User $owner, int $acceptanceId): Order
    {
        return Order::create([
            'user_id' => $owner->id,
            'status' => OrderStatus::PROCESSING,
            'server_id' => (string) $acceptanceId,
        ]);
    }

    public function test_it_advances_a_stranded_order_without_emailing_the_provider(): void
    {
        $owner = User::factory()->create();
        $order = $this->strandedOrder($owner, 4210);

        Notification::fake();
        $this->fakeOrdersApi([[
            'order_id' => 'SC-4210-20260823231550',
            'acceptance_id' => 4210,
            'status' => 'reported',
        ]]);

        $this->artisan('orders:reconcile-status')->assertSuccessful();

        $this->assertSame(OrderStatus::REPORTED, $order->fresh()->status);
        Notification::assertNothingSent();
    }

    /**
     * The transition still belongs in the timeline: it is a log of what
     * happened to the order, and the catch-up is something that happened.
     */
    public function test_the_transition_is_still_recorded_in_the_timeline(): void
    {
        $owner = User::factory()->create();
        $order = $this->strandedOrder($owner, 4210);

        Notification::fake();
        $this->fakeOrdersApi([[
            'order_id' => 'SC-4210-x',
            'acceptance_id' => 4210,
            'status' => 'reported',
        ]]);

        $this->artisan('orders:reconcile-status')->assertSuccessful();

        $this->assertDatabaseHas('order_status_histories', [
            'order_id' => $order->id,
            'from_status' => OrderStatus::PROCESSING->value,
            'to_status' => OrderStatus::REPORTED->value,
        ]);
    }

    /**
     * The guard that matters most: suppression is scoped to the command, so an
     * ordinary status change afterwards still reaches the provider.
     */
    public function test_suppression_does_not_leak_into_later_status_changes(): void
    {
        $owner = User::factory()->create();
        $order = $this->strandedOrder($owner, 4210);

        Notification::fake();
        $this->fakeOrdersApi([[
            'order_id' => 'SC-4210-x',
            'acceptance_id' => 4210,
            'status' => 'processing',
        ]]);

        $this->artisan('orders:reconcile-status')->assertSuccessful();

        $other = Order::create(['user_id' => $owner->id, 'status' => OrderStatus::RECEIVED]);
        $other->update(['status' => OrderStatus::PROCESSING]);

        Notification::assertSentToTimes($owner, OrderStatusUpdated::class, 1);
    }

    public function test_a_dry_run_reports_the_change_but_writes_nothing(): void
    {
        $owner = User::factory()->create();
        $order = $this->strandedOrder($owner, 4210);

        Notification::fake();
        $this->fakeOrdersApi([[
            'order_id' => 'SC-4210-x',
            'acceptance_id' => 4210,
            'status' => 'reported',
        ]]);

        $this->artisan('orders:reconcile-status', ['--dry-run' => true])
            ->expectsOutputToContain('dry run')
            ->assertSuccessful();

        $this->assertSame(OrderStatus::PROCESSING, $order->fresh()->status);
        $this->assertDatabaseCount('order_status_histories', 1); // just the create
        Notification::assertNothingSent();
    }

    public function test_a_second_pass_finds_nothing_left_to_do(): void
    {
        $owner = User::factory()->create();
        $this->strandedOrder($owner, 4210);

        Notification::fake();
        $this->fakeOrdersApi([[
            'order_id' => 'SC-4210-x',
            'acceptance_id' => 4210,
            'status' => 'reported',
        ]]);

        $this->artisan('orders:reconcile-status')->assertSuccessful();

        // Reported is terminal, so the order has left the sweepable set entirely.
        $this->artisan('orders:reconcile-status')
            ->expectsOutputToContain('No in-flight orders to reconcile.')
            ->assertSuccessful();

        Notification::assertNothingSent();
    }

    public function test_an_unreachable_lab_is_reported_rather_than_thrown(): void
    {
        $owner = User::factory()->create();
        $order = $this->strandedOrder($owner, 4210);

        Notification::fake();
        Cache::put('api_sanctum_token', encrypt('test-token'));
        Http::fake([
            config('api.server_url').config('api.orders_path').'*' => Http::response('boom', 500),
        ]);

        $this->artisan('orders:reconcile-status')->assertFailed();

        $this->assertSame(OrderStatus::PROCESSING, $order->fresh()->status);
    }
}
