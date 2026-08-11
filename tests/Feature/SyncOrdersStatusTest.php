<?php

namespace Tests\Feature;

use App\Enums\CollectRequestStatus;
use App\Enums\OrderStatus;
use App\Models\CollectRequest;
use App\Models\Order;
use App\Models\User;
use App\Notifications\OrderStatusUpdated;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

/**
 * sync:orders runs every five minutes against every in-flight order, so a pass
 * that finds nothing new must write nothing. Anything it rewrites needlessly
 * also re-fires the order status email through the observer.
 */
class SyncOrdersStatusTest extends TestCase
{
    use RefreshDatabase;

    private function fakeOrdersApi(array $rows): void
    {
        Cache::put('api_sanctum_token', encrypt('test-token'));

        Http::fake([
            config('api.server_url').config('api.orders_path').'*' => Http::response(['data' => $rows]),
        ]);
    }

    private function row(Order $order, string $status, array $overrides = []): array
    {
        return array_merge([
            'order_id' => $order->orderId,
            'status' => $status,
            'acceptance_id' => '9001',
            'received_at' => '2026-08-01 10:00:00',
        ], $overrides);
    }

    /**
     * Count UPDATE statements issued while running the sync.
     */
    private function updatesDuring(callable $callback): int
    {
        $updates = 0;
        DB::listen(function ($query) use (&$updates) {
            if (str_starts_with(strtolower(ltrim($query->sql)), 'update')) {
                $updates++;
            }
        });

        $callback();

        return $updates;
    }

    public function test_an_unchanged_order_is_not_rewritten(): void
    {
        $order = Order::create([
            'user_id' => User::factory()->create()->id,
            'status' => OrderStatus::PROCESSING,
            'server_id' => '9001',
            'received_at' => '2026-08-01 10:00:00',
        ]);
        $this->fakeOrdersApi([$this->row($order, 'processing')]);

        $updates = $this->updatesDuring(fn () => $this->artisan('sync:orders')->assertSuccessful());

        $this->assertSame(0, $updates, 'A pass with no new information must not write.');
    }

    public function test_a_real_advance_is_written_and_notified(): void
    {
        Notification::fake();
        $owner = User::factory()->create();
        $order = Order::create(['user_id' => $owner->id, 'status' => OrderStatus::PROCESSING]);
        $this->fakeOrdersApi([$this->row($order, 'reported')]);

        $this->artisan('sync:orders')->assertSuccessful();

        $this->assertSame(OrderStatus::REPORTED, $order->fresh()->status);
        Notification::assertSentToTimes($owner, OrderStatusUpdated::class, 1);
    }

    public function test_a_stale_row_does_not_drag_the_status_backwards(): void
    {
        Notification::fake();
        $order = Order::create([
            'user_id' => User::factory()->create()->id,
            'status' => OrderStatus::WAITING_FOR_FINANCIAL_APPROVAL,
        ]);
        $this->fakeOrdersApi([$this->row($order, 'processing')]);

        $this->artisan('sync:orders')->assertSuccessful();

        $this->assertSame(OrderStatus::WAITING_FOR_FINANCIAL_APPROVAL, $order->fresh()->status);
        Notification::assertNothingSent();
    }

    public function test_a_row_without_values_does_not_blank_stored_columns(): void
    {
        $order = Order::create([
            'user_id' => User::factory()->create()->id,
            'status' => OrderStatus::PROCESSING,
            'server_id' => '9001',
            'received_at' => '2026-08-01 10:00:00',
        ]);
        $this->fakeOrdersApi([
            $this->row($order, 'processing', ['acceptance_id' => null, 'received_at' => null]),
        ]);

        $this->artisan('sync:orders')->assertSuccessful();

        $order->refresh();
        $this->assertEquals('9001', $order->server_id);
        $this->assertSame('2026-08-01 10:00:00', $order->received_at->format('Y-m-d H:i:s'));
    }

    public function test_the_collect_request_is_marked_received_only_once(): void
    {
        $owner = User::factory()->create();
        $collectRequest = CollectRequest::create([
            'user_id' => $owner->id,
            'status' => CollectRequestStatus::PICKED_UP,
        ]);
        $order = Order::create([
            'user_id' => $owner->id,
            'status' => OrderStatus::RECEIVED,
            'collect_request_id' => $collectRequest->id,
        ]);
        $this->fakeOrdersApi([$this->row($order, 'processing')]);

        $this->artisan('sync:orders')->assertSuccessful();
        $this->assertSame(CollectRequestStatus::RECEIVED, $collectRequest->fresh()->status);

        // Second pass: nothing left to say, so nothing may be written.
        $updates = $this->updatesDuring(fn () => $this->artisan('sync:orders')->assertSuccessful());

        $this->assertSame(0, $updates);
    }
}
