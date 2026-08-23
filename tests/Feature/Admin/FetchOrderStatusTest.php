<?php

namespace Tests\Feature\Admin;

use App\Enums\OrderStatus;
use App\Models\Order;
use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

/**
 * sync:orders sweeps every in-flight order every five minutes, which is no use
 * to an admin on the phone to a provider. The per-order button asks the lab the
 * same question on demand -- so it must inherit the sweep's guarantees too: it
 * sends nothing but the order's id, only ever advances a status, and writes
 * nothing on a pass that learned nothing.
 */
class FetchOrderStatusTest extends TestCase
{
    use RefreshDatabase;

    private function admin(): User
    {
        $user = User::factory()->create();
        $role = Role::findOrCreate('Admin');
        $role->givePermissionTo(Permission::findOrCreate('Admin.Order.Update'));
        $user->assignRole($role);

        return $user;
    }

    private function order(OrderStatus $status, array $attributes = []): Order
    {
        return Order::create(array_merge([
            'user_id' => User::factory()->create()->id,
            'status' => $status,
        ], $attributes));
    }

    private function fakeOrdersApi(array $rows): void
    {
        Cache::put('api_sanctum_token', encrypt('test-token'));

        Http::fake([
            config('api.server_url').config('api.orders_path').'*' => Http::response(['data' => $rows]),
        ]);
    }

    private function failingOrdersApi(): void
    {
        Cache::put('api_sanctum_token', encrypt('test-token'));

        Http::fake([
            config('api.server_url').config('api.orders_path').'*' => Http::response('boom', 500),
        ]);
    }

    public function test_admin_can_fetch_the_current_status_for_one_order(): void
    {
        $order = $this->order(OrderStatus::PROCESSING);
        $this->fakeOrdersApi([[
            'order_id' => $order->orderId,
            'status' => 'reported',
            'acceptance_id' => '9001',
            'received_at' => '2026-08-01 10:00:00',
        ]]);

        $this->actingAs($this->admin())
            ->post(route('admin.orders.fetchStatus', $order))
            ->assertRedirect()
            ->assertSessionHas('success', true);

        $order->refresh();
        $this->assertSame(OrderStatus::REPORTED, $order->status);
        $this->assertEquals('9001', $order->server_id);
    }

    /**
     * The button is a lookup, not a push: the lab is sent the chosen order's
     * two identifiers and nothing else. Anything more in the payload would make
     * a read action capable of changing what the lab holds, and sweeping the
     * neighbours in would let one row's button move orders nobody was looking at.
     */
    public function test_the_request_carries_nothing_but_the_chosen_orders_identifiers(): void
    {
        $order = $this->order(OrderStatus::PROCESSING, ['server_id' => '4210']);
        $other = $this->order(OrderStatus::PROCESSING, ['server_id' => '4211']);
        $this->fakeOrdersApi([['order_id' => $order->orderId, 'status' => 'reported']]);

        $this->actingAs($this->admin())->post(route('admin.orders.fetchStatus', $order));

        Http::assertSent(function ($request) use ($order) {
            // The payload is recorded pre-serialisation, so the two lists are
            // still Collections.
            return array_keys($request->data()) === ['orders', 'acceptances']
                && collect($request['orders'])->all() === [$order->orderId]
                && collect($request['acceptances'])->all() === [4210];
        });
        $this->assertSame(OrderStatus::PROCESSING, $other->fresh()->status);
    }

    public function test_a_stale_row_does_not_drag_the_status_backwards(): void
    {
        $order = $this->order(OrderStatus::WAITING_FOR_FINANCIAL_APPROVAL);
        $this->fakeOrdersApi([['order_id' => $order->orderId, 'status' => 'processing']]);

        $this->actingAs($this->admin())->post(route('admin.orders.fetchStatus', $order));

        $this->assertSame(OrderStatus::WAITING_FOR_FINANCIAL_APPROVAL, $order->fresh()->status);
    }

    public function test_a_pass_with_nothing_new_writes_nothing(): void
    {
        $order = $this->order(OrderStatus::PROCESSING, [
            'server_id' => '9001',
            'received_at' => '2026-08-01 10:00:00',
        ]);
        $this->fakeOrdersApi([[
            'order_id' => $order->orderId,
            'status' => 'processing',
            'acceptance_id' => '9001',
            'received_at' => '2026-08-01 10:00:00',
        ]]);

        $updates = 0;
        DB::listen(function ($query) use (&$updates) {
            if (str_starts_with(strtolower(ltrim($query->sql)), 'update')) {
                $updates++;
            }
        });

        $this->actingAs($this->admin())
            ->post(route('admin.orders.fetchStatus', $order))
            ->assertSessionHas('success', true);

        $this->assertSame(0, $updates);
    }

    public function test_an_order_the_lab_has_no_record_of_reports_back(): void
    {
        $order = $this->order(OrderStatus::SENT);
        $this->fakeOrdersApi([]);

        $this->actingAs($this->admin())
            ->post(route('admin.orders.fetchStatus', $order))
            ->assertRedirect()
            ->assertSessionHas('error', true);

        $this->assertSame(OrderStatus::SENT, $order->fresh()->status);
    }

    public function test_an_unreachable_lab_reports_back_instead_of_failing(): void
    {
        $order = $this->order(OrderStatus::PROCESSING);
        $this->failingOrdersApi();

        $this->actingAs($this->admin())
            ->post(route('admin.orders.fetchStatus', $order))
            ->assertRedirect()
            ->assertSessionHas('error', true);

        $this->assertSame(OrderStatus::PROCESSING, $order->fresh()->status);
    }

    /**
     * Orders below `logistic requested` have never been handed over, so the lab
     * has never heard of them.
     */
    public function test_an_order_never_handed_to_the_lab_cannot_be_looked_up(): void
    {
        $order = $this->order(OrderStatus::REQUESTED);
        $this->fakeOrdersApi([['order_id' => $order->orderId, 'status' => 'reported']]);

        $this->actingAs($this->admin())
            ->post(route('admin.orders.fetchStatus', $order))
            ->assertForbidden();

        Http::assertNothingSent();
    }

    /**
     * The bug this covers: an order raised inside the lab is known there as
     * SC-<acceptance>-<timestamp> and never carries our "OR.<Ymd>.<id>" key, so
     * asking by order_id alone could never reach it -- the button reported "no
     * record" and the five-minute sweep skipped it in silence. Both sides do
     * agree on the acceptance id, stored here as server_id.
     */
    public function test_a_lab_raised_order_is_found_by_its_acceptance_id(): void
    {
        $order = $this->order(OrderStatus::PROCESSING, ['server_id' => '4210']);

        // Exactly what the lab holds for an order it raised itself: no provider
        // key anywhere in the row.
        $this->fakeOrdersApi([[
            'order_id' => 'SC-4210-20260823231550',
            'acceptance_id' => 4210,
            'status' => 'reported',
        ]]);

        $this->actingAs($this->admin())
            ->post(route('admin.orders.fetchStatus', $order))
            ->assertRedirect()
            ->assertSessionHas('success', true);

        $this->assertSame(OrderStatus::REPORTED, $order->fresh()->status);
    }

    public function test_the_request_asks_by_acceptance_id_as_well(): void
    {
        $order = $this->order(OrderStatus::PROCESSING, ['server_id' => '4210']);
        $this->fakeOrdersApi([]);

        $this->actingAs($this->admin())->post(route('admin.orders.fetchStatus', $order));

        Http::assertSent(fn ($request) => collect($request['acceptances'])->all() === [4210]);
    }

    /**
     * An order the lab has not linked to an acceptance yet has no server_id, so
     * there is nothing to ask about and the provider key must carry it alone.
     */
    public function test_an_order_without_a_server_id_still_matches_on_the_provider_key(): void
    {
        $order = $this->order(OrderStatus::PROCESSING);
        $this->fakeOrdersApi([[
            'order_id' => $order->orderId,
            'acceptance_id' => null,
            'status' => 'reported',
        ]]);

        $this->actingAs($this->admin())->post(route('admin.orders.fetchStatus', $order));

        $this->assertSame(OrderStatus::REPORTED, $order->fresh()->status);
        Http::assertSent(fn ($request) => collect($request['acceptances'])->all() === []);
    }

    /**
     * One acceptance can carry several referrer orders (pooling), so the reply
     * may name the same order twice. Applying each row is safe because apply()
     * only ever advances, but the order must be counted once -- a double count
     * would have the button report work it did not do.
     */
    public function test_several_rows_for_one_acceptance_land_on_the_highest_status_and_count_once(): void
    {
        $order = $this->order(OrderStatus::RECEIVED, ['server_id' => '4210']);
        $this->fakeOrdersApi([
            ['order_id' => 'SC-4210-a', 'acceptance_id' => 4210, 'status' => 'reported'],
            ['order_id' => 'SC-4210-b', 'acceptance_id' => 4210, 'status' => 'processing'],
        ]);

        $this->actingAs($this->admin())
            ->post(route('admin.orders.fetchStatus', $order))
            ->assertSessionHas('success', true);

        $this->assertSame(OrderStatus::REPORTED, $order->fresh()->status);
    }

    public function test_a_provider_cannot_look_up_their_own_order(): void
    {
        $owner = User::factory()->create();
        $order = $this->order(OrderStatus::PROCESSING, ['user_id' => $owner->id]);
        $this->fakeOrdersApi([['order_id' => $order->orderId, 'status' => 'reported']]);

        $this->actingAs($owner)
            ->post(route('admin.orders.fetchStatus', $order))
            ->assertForbidden();

        Http::assertNothingSent();
    }
}
