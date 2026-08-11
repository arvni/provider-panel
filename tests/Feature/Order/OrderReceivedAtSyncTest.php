<?php

namespace Tests\Feature\Order;

use App\Enums\CollectRequestStatus;
use App\Enums\OrderStatus;
use App\Models\CollectRequest;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Sample;
use App\Models\User;
use App\Services\OrderReceivedAtSync;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

/**
 * An order is received once its samples have arrived, and samples travel in
 * collect requests. One order can span several requests -- samples get picked
 * up over more than one visit -- so it counts as received when the last of
 * them lands. The order's own collect_request_id is deliberately not used: it
 * records the request the order was attached to, not where its samples went.
 */
class OrderReceivedAtSyncTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Notification::fake();
    }

    private function orderWithSampleIn(CollectRequest $request, User $owner): Order
    {
        $order = Order::create(['user_id' => $owner->id, 'status' => OrderStatus::SENT]);
        $item = OrderItem::factory()->create(['order_id' => $order->id]);
        $sample = Sample::factory()->create(['collect_request_id' => $request->id]);
        $item->Samples()->attach($sample->id);

        return $order;
    }

    private function receivedRequest(User $owner, string $at): CollectRequest
    {
        return CollectRequest::create([
            'user_id' => $owner->id,
            'status' => CollectRequestStatus::RECEIVED,
            'received_at' => $at,
        ]);
    }

    public function test_received_at_comes_from_the_collect_request_behind_the_sample(): void
    {
        $owner = User::factory()->create();
        $request = $this->receivedRequest($owner, '2026-08-05 09:30:00');
        $order = $this->orderWithSampleIn($request, $owner);

        app(OrderReceivedAtSync::class)->forCollectRequest($request);

        $this->assertSame(
            '2026-08-05 09:30:00',
            $order->refresh()->received_at->format('Y-m-d H:i:s')
        );
    }

    public function test_the_latest_request_wins_when_samples_span_several(): void
    {
        $owner = User::factory()->create();
        $early = $this->receivedRequest($owner, '2026-08-05 09:30:00');
        $late = $this->receivedRequest($owner, '2026-08-09 14:00:00');

        $order = $this->orderWithSampleIn($early, $owner);
        // A second sample on the same order, collected in a later visit.
        $item = OrderItem::factory()->create(['order_id' => $order->id]);
        $item->Samples()->attach(
            Sample::factory()->create(['collect_request_id' => $late->id])->id
        );

        app(OrderReceivedAtSync::class)->forCollectRequest($early);

        $this->assertSame(
            '2026-08-09 14:00:00',
            $order->refresh()->received_at->format('Y-m-d H:i:s')
        );
    }

    public function test_receiving_a_request_stamps_it_and_reaches_the_orders(): void
    {
        $owner = User::factory()->create();
        $request = CollectRequest::create([
            'user_id' => $owner->id,
            'status' => CollectRequestStatus::PICKED_UP,
        ]);
        $order = $this->orderWithSampleIn($request, $owner);

        // No webhook, no explicit received_at -- just the status moving, which is
        // all sync:orders does when it catches up with the lab.
        $request->update(['status' => CollectRequestStatus::RECEIVED]);

        $this->assertNotNull($request->refresh()->received_at);
        $this->assertEquals(
            $request->received_at->format('Y-m-d H:i:s'),
            $order->refresh()->received_at?->format('Y-m-d H:i:s')
        );
    }

    public function test_a_request_that_has_not_arrived_leaves_received_at_alone(): void
    {
        $owner = User::factory()->create();
        $pending = CollectRequest::create([
            'user_id' => $owner->id,
            'status' => CollectRequestStatus::PICKED_UP,
        ]);
        $order = $this->orderWithSampleIn($pending, $owner);
        $order->update(['received_at' => '2026-08-01 08:00:00']);

        app(OrderReceivedAtSync::class)->forCollectRequest($pending);

        // Nothing to derive yet, so a date stamped elsewhere must survive.
        $this->assertSame(
            '2026-08-01 08:00:00',
            $order->refresh()->received_at->format('Y-m-d H:i:s')
        );
    }
}
