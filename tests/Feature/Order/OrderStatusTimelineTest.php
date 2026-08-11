<?php

namespace Tests\Feature\Order;

use App\Enums\OrderStatus;
use App\Models\Order;
use App\Models\User;
use App\Services\OrderStatusRecorder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Inertia\Testing\AssertableInertia;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

/**
 * The order timeline is a log of what actually happened, which is a wider net
 * than the status email casts: several transitions are moved with a
 * query-builder update() across many orders at once and never touch a model,
 * so they never reach an observer. Those are recorded explicitly, and this
 * pins down that the log stays complete either way.
 */
class OrderStatusTimelineTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Notification::fake();
    }

    public function test_creating_an_order_opens_its_timeline(): void
    {
        $owner = User::factory()->create();

        $order = Order::create(['user_id' => $owner->id, 'status' => OrderStatus::PENDING]);

        $this->assertCount(1, $order->statusHistories);
        $this->assertNull($order->statusHistories->first()->from_status);
        $this->assertSame(OrderStatus::PENDING, $order->statusHistories->first()->to_status);
    }

    public function test_each_transition_appends_a_step(): void
    {
        $owner = User::factory()->create();
        $order = Order::create(['user_id' => $owner->id, 'status' => OrderStatus::RECEIVED]);

        $order->update(['status' => OrderStatus::PROCESSING]);
        $order->update(['status' => OrderStatus::REPORTED]);

        $steps = $order->refresh()->statusHistories;

        $this->assertSame(
            [null, 'received', 'processing'],
            $steps->pluck('from_status')->map(fn ($s) => $s?->value)->all()
        );
        $this->assertSame(
            ['received', 'processing', 'reported'],
            $steps->pluck('to_status')->map(fn ($s) => $s->value)->all()
        );
    }

    public function test_transitions_that_are_never_mailed_are_still_recorded(): void
    {
        $owner = User::factory()->create();
        $order = Order::create(['user_id' => $owner->id, 'status' => OrderStatus::REPORTED]);

        $order->update(['status' => OrderStatus::REPORT_DOWNLOADED]);

        Notification::assertNothingSent();
        $this->assertSame(
            OrderStatus::REPORT_DOWNLOADED,
            $order->refresh()->statusHistories->last()->to_status
        );
    }

    public function test_unrelated_writes_do_not_append_a_step(): void
    {
        $owner = User::factory()->create();
        $order = Order::create(['user_id' => $owner->id, 'status' => OrderStatus::PROCESSING]);

        $order->update(['server_id' => '12345']);
        $order->update(['status' => OrderStatus::PROCESSING]);

        $this->assertCount(1, $order->refresh()->statusHistories);
    }

    public function test_bulk_recording_captures_the_status_each_order_came_from(): void
    {
        $owner = User::factory()->create();
        $requested = Order::create(['user_id' => $owner->id, 'status' => OrderStatus::REQUESTED]);
        $pending = Order::create(['user_id' => $owner->id, 'status' => OrderStatus::PENDING]);

        $before = Order::whereIn('id', [$requested->id, $pending->id])->get(['id', 'status']);
        Order::whereIn('id', [$requested->id, $pending->id])
            ->update(['status' => OrderStatus::LOGISTIC_REQUESTED]);

        app(OrderStatusRecorder::class)
            ->recordMany($before, OrderStatus::LOGISTIC_REQUESTED->value);

        $this->assertSame(
            OrderStatus::REQUESTED,
            $requested->refresh()->statusHistories->last()->from_status
        );
        $this->assertSame(
            OrderStatus::PENDING,
            $pending->refresh()->statusHistories->last()->from_status
        );
    }

    public function test_the_show_page_receives_the_timeline_oldest_first(): void
    {
        $provider = User::factory()->create();
        $role = Role::findOrCreate(User::PROVIDER_ROLE);
        foreach (User::PROVIDER_PERMISSIONS as $permission) {
            Permission::findOrCreate($permission);
        }
        $role->syncPermissions(User::PROVIDER_PERMISSIONS);
        $provider->assignRole($role);

        $order = Order::create(['user_id' => $provider->id, 'status' => OrderStatus::REQUESTED]);
        foreach ([OrderStatus::SENT, OrderStatus::RECEIVED, OrderStatus::PROCESSING] as $status) {
            $order->update(['status' => $status]);
        }

        $this->actingAs($provider)
            ->get(route('orders.show', $order))
            ->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->component('Order/Show')
                ->has('order.status_histories', 4)
                ->where('order.status_histories.0.to_status', 'requested')
                ->where('order.status_histories.3.to_status', 'processing')
                ->where('order.status_histories.3.from_status', 'received')
                ->where('order.status_histories.0.backfilled', false)
            );
    }

    public function test_bulk_recording_skips_orders_already_on_the_destination(): void
    {
        $owner = User::factory()->create();
        $order = Order::create(['user_id' => $owner->id, 'status' => OrderStatus::LOGISTIC_REQUESTED]);

        $before = Order::whereKey($order->id)->get(['id', 'status']);
        $written = app(OrderStatusRecorder::class)
            ->recordMany($before, OrderStatus::LOGISTIC_REQUESTED->value);

        // A repeated webhook must not stutter the timeline.
        $this->assertSame(0, $written);
        $this->assertCount(1, $order->refresh()->statusHistories);
    }
}
