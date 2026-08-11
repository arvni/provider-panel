<?php

namespace Tests\Feature\Admin;

use App\Enums\CollectRequestStatus;
use App\Enums\OrderStatus;
use App\Jobs\SendCollectionRequest;
use App\Models\CollectRequest;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Sample;
use App\Models\User;
use Database\Seeders\RoleAndPermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;
use Inertia\Testing\AssertableInertia;
use Tests\TestCase;

/**
 * An admin may raise a collection request on a provider's behalf and attach that
 * provider's requested orders to it. Covers the gate, the eligibility rules for
 * the attached orders, and the resulting order/sample bookkeeping.
 */
class AdminCollectRequestCreationTest extends TestCase
{
    use RefreshDatabase;

    private function admin(): User
    {
        $this->seed(RoleAndPermissionSeeder::class);

        return User::factory()->admin()->create();
    }

    private function requestedOrder(User $provider): Order
    {
        return Order::factory()->create([
            'user_id' => $provider->id,
            'status' => OrderStatus::REQUESTED,
        ]);
    }

    public function test_non_admin_cannot_open_the_create_form(): void
    {
        $this->seed(RoleAndPermissionSeeder::class);

        $this->actingAs(User::factory()->create())
            ->get(route('admin.collectRequests.create'))
            ->assertForbidden();
    }

    public function test_non_admin_cannot_create_a_collect_request_for_a_provider(): void
    {
        $this->seed(RoleAndPermissionSeeder::class);
        $provider = User::factory()->create();
        $order = $this->requestedOrder($provider);

        $this->actingAs(User::factory()->create())
            ->post(route('admin.collectRequests.store'), [
                'user_id' => $provider->id,
                'selectedOrders' => [$order->id],
                'preferred_date' => now()->addDay()->toDateString(),
            ])
            ->assertForbidden();

        $this->assertDatabaseCount('collect_requests', 0);
        $this->assertSame(OrderStatus::REQUESTED, $order->refresh()->status);
    }

    public function test_admin_sees_the_create_form(): void
    {
        $this->actingAs($this->admin())
            ->get(route('admin.collectRequests.create'))
            ->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page->component('CollectRequest/Add'));
    }

    public function test_admin_creates_a_collect_request_for_a_provider_and_attaches_the_orders(): void
    {
        Queue::fake();

        $admin = $this->admin();
        $provider = User::factory()->create();
        $order = $this->requestedOrder($provider);
        $orderItem = OrderItem::factory()->create(['order_id' => $order->id]);
        $sample = Sample::factory()->create();
        $sample->OrderItems()->attach($orderItem->id);

        $response = $this->actingAs($admin)
            ->post(route('admin.collectRequests.store'), [
                'user_id' => $provider->id,
                'selectedOrders' => [$order->id],
                'preferred_date' => now()->addDay()->toDateString(),
                'notes' => 'Front desk pickup.',
            ]);

        $response->assertSessionHasNoErrors();

        $collectRequest = CollectRequest::sole();

        $response->assertRedirect(route('admin.collectRequests.show', $collectRequest->id));

        // The request belongs to the provider, not to the admin who raised it.
        $this->assertSame($provider->id, $collectRequest->user_id);
        $this->assertSame(CollectRequestStatus::REQUESTED, $collectRequest->status);
        $this->assertSame('Front desk pickup.', $collectRequest->notes);

        $order->refresh();
        $this->assertSame($collectRequest->id, $order->collect_request_id);
        $this->assertSame(OrderStatus::LOGISTIC_REQUESTED, $order->status);
        $this->assertSame($collectRequest->id, $sample->refresh()->collect_request_id);

        Queue::assertPushed(SendCollectionRequest::class);
    }

    public function test_it_rejects_orders_that_belong_to_another_provider(): void
    {
        Queue::fake();

        $provider = User::factory()->create();
        $otherOrder = $this->requestedOrder(User::factory()->create());

        $this->actingAs($this->admin())
            ->post(route('admin.collectRequests.store'), [
                'user_id' => $provider->id,
                'selectedOrders' => [$otherOrder->id],
                'preferred_date' => now()->addDay()->toDateString(),
            ])
            ->assertSessionHasErrors('selectedOrders');

        $this->assertDatabaseCount('collect_requests', 0);
        $this->assertNull($otherOrder->refresh()->collect_request_id);
        Queue::assertNotPushed(SendCollectionRequest::class);
    }

    public function test_it_rejects_orders_that_are_not_in_the_requested_status(): void
    {
        Queue::fake();

        $provider = User::factory()->create();
        $order = Order::factory()->create([
            'user_id' => $provider->id,
            'status' => OrderStatus::PENDING,
        ]);

        $this->actingAs($this->admin())
            ->post(route('admin.collectRequests.store'), [
                'user_id' => $provider->id,
                'selectedOrders' => [$order->id],
                'preferred_date' => now()->addDay()->toDateString(),
            ])
            ->assertSessionHasErrors('selectedOrders');

        $this->assertDatabaseCount('collect_requests', 0);
        Queue::assertNotPushed(SendCollectionRequest::class);
    }

    public function test_it_rejects_orders_already_attached_to_another_collect_request(): void
    {
        Queue::fake();

        $provider = User::factory()->create();
        $existing = CollectRequest::create([
            'user_id' => $provider->id,
            'status' => CollectRequestStatus::REQUESTED,
            'details' => [],
        ]);
        $order = Order::factory()->create([
            'user_id' => $provider->id,
            'status' => OrderStatus::REQUESTED,
            'collect_request_id' => $existing->id,
        ]);

        $this->actingAs($this->admin())
            ->post(route('admin.collectRequests.store'), [
                'user_id' => $provider->id,
                'selectedOrders' => [$order->id],
                'preferred_date' => now()->addDay()->toDateString(),
            ])
            ->assertSessionHasErrors('selectedOrders');

        $this->assertSame($existing->id, $order->refresh()->collect_request_id);
        Queue::assertNotPushed(SendCollectionRequest::class);
    }

    public function test_it_requires_a_provider_orders_and_a_future_pickup_date(): void
    {
        $this->actingAs($this->admin())
            ->post(route('admin.collectRequests.store'), [
                'preferred_date' => now()->subDay()->toDateString(),
            ])
            ->assertSessionHasErrors(['user_id', 'selectedOrders', 'preferred_date']);
    }

    public function test_the_collectable_orders_endpoint_lists_only_the_providers_available_orders(): void
    {
        $provider = User::factory()->create();
        $collectable = $this->requestedOrder($provider);
        $pending = Order::factory()->create(['user_id' => $provider->id, 'status' => OrderStatus::PENDING]);
        $someoneElses = $this->requestedOrder(User::factory()->create());

        $response = $this->actingAs($this->admin())
            ->getJson(route('admin.collectRequests.collectableOrders', ['user_id' => $provider->id]))
            ->assertOk();

        $ids = array_column($response->json('data'), 'id');
        $this->assertSame([$collectable->id], $ids);
        $this->assertNotContains($pending->id, $ids);
        $this->assertNotContains($someoneElses->id, $ids);
    }

    public function test_non_admin_cannot_list_collectable_orders_or_providers(): void
    {
        $this->seed(RoleAndPermissionSeeder::class);
        $provider = User::factory()->create();

        $this->actingAs(User::factory()->create())
            ->getJson(route('admin.collectRequests.collectableOrders', ['user_id' => $provider->id]))
            ->assertForbidden();

        $this->actingAs(User::factory()->create())
            ->getJson(route('admin.collectRequests.providers'))
            ->assertForbidden();
    }

    public function test_the_providers_endpoint_can_be_searched(): void
    {
        $provider = User::factory()->create(['name' => 'Muscat Clinic']);
        User::factory()->create(['name' => 'Salalah Lab']);

        $response = $this->actingAs($this->admin())
            ->getJson(route('admin.collectRequests.providers', ['search' => 'Muscat']))
            ->assertOk();

        $names = array_column($response->json('data'), 'name');
        $this->assertContains('Muscat Clinic', $names);
        $this->assertNotContains('Salalah Lab', $names);
    }
}
