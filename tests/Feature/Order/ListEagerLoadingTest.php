<?php

namespace Tests\Feature\Order;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Patient;
use App\Models\Sample;
use App\Models\Test;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Guards the order/patient index list paths against N+1 regressions. Each test
 * seeds several rows (so a per-row lazy load would fire) and turns on Eloquent's
 * strict lazy-loading guard for the duration of the request: any relation the
 * list path forgot to eager-load throws LazyLoadingViolationException, failing
 * the test instead of silently degrading to N+1.
 */
class ListEagerLoadingTest extends TestCase
{
    use RefreshDatabase;

    protected function tearDown(): void
    {
        Model::preventLazyLoading(false);
        parent::tearDown();
    }

    public function test_orders_index_eager_loads_its_list_relations(): void
    {
        $provider = User::factory()->create();

        // Three orders, each with an item, test, and sample, so the serialized
        // list (Tests + OrderItems.Samples + appended editable/deletable) would
        // trigger a lazy load per row if any of them were not eager-loaded.
        Order::factory()->count(3)->for($provider, 'User')->create()->each(function (Order $order) {
            $item = OrderItem::factory()->for($order, 'Order')->for(Test::factory(), 'Test')->create();
            $item->Samples()->attach(Sample::factory()->create());
        });

        Model::preventLazyLoading();

        $this->actingAs($provider)
            ->get(route('orders.index'))
            ->assertOk();
    }

    public function test_patients_index_eager_loads_its_list_relations(): void
    {
        $provider = User::factory()->create();
        Patient::factory()->count(3)->for($provider, 'User')->create();

        Model::preventLazyLoading();

        $this->actingAs($provider)
            ->get(route('patients.index'))
            ->assertOk();
    }
}
