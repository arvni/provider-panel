<?php

namespace Tests\Feature\Order;

use App\Enums\OrderStatus;
use App\Enums\OrderStep;
use App\Interfaces\OrderRepositoryInterface;
use App\Models\Material;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Patient;
use App\Models\Sample;
use App\Models\SampleType;
use App\Models\Test;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Direct coverage for OrderRepository's per-step mutations. These bypass the
 * HTTP request validation (some of which is exercised in OrderControllerTest)
 * so the repository's own create/update/sample logic is tested in isolation.
 */
class OrderRepositoryTest extends TestCase
{
    use RefreshDatabase;

    private OrderRepositoryInterface $repository;

    protected function setUp(): void
    {
        parent::setUp();
        $this->repository = app(OrderRepositoryInterface::class);
    }

    public function test_create_makes_a_pending_order_and_syncs_tests_as_items(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user);
        $tests = Test::factory()->count(2)->create();

        $order = $this->repository->create([
            'tests' => $tests->map(fn (Test $t) => ['id' => $t->id])->all(),
        ]);

        $this->assertSame(OrderStatus::PENDING, $order->status);
        $this->assertSame(OrderStep::PATIENT_DETAILS, $order->step);
        $this->assertSame($user->id, $order->user_id);
        $this->assertEqualsCanonicalizing(
            $tests->pluck('id')->all(),
            $order->OrderItems()->pluck('test_id')->all(),
        );
    }

    public function test_test_method_step_resyncs_the_orders_tests(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user);
        [$original, $replacement] = Test::factory()->count(2)->create();
        $order = Order::factory()->for($user, 'User')->state(['step' => OrderStep::TEST_METHOD])->create();
        OrderItem::factory()->for($order, 'Order')->for($original, 'Test')->create();

        $this->repository->update($order, ['tests' => [['id' => $replacement->id]]], OrderStep::TEST_METHOD);

        $this->assertSame([$replacement->id], $order->OrderItems()->pluck('test_id')->all());
        $this->assertSame(OrderStep::PATIENT_DETAILS, $order->refresh()->step);
    }

    public function test_finalize_step_sets_status_to_requested(): void
    {
        $user = User::factory()->create();
        $order = Order::factory()->for($user, 'User')->state(['step' => OrderStep::FINALIZE])->create();

        $this->repository->update($order, [], OrderStep::FINALIZE);

        $this->assertSame(OrderStatus::REQUESTED, $order->refresh()->status);
    }

    public function test_patient_details_step_creates_patient_and_records_main_and_ids(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user);
        $order = Order::factory()->for($user, 'User')->state(['step' => OrderStep::PATIENT_DETAILS])->create();

        $this->repository->update($order, [
            'patients' => [[
                'fullName' => 'Mona Patient',
                'gender' => '0',
                'dateOfBirth' => '1985-05-05',
                'consanguineousParents' => '0',
                'nationality' => ['code' => 'IR'],
            ]],
        ], OrderStep::PATIENT_DETAILS);

        $patient = Patient::where('fullName', 'Mona Patient')->firstOrFail();
        $order->refresh();
        $this->assertSame($patient->id, $order->main_patient_id);
        $this->assertSame([$patient->id], $order->patient_ids);
        $this->assertSame($user->id, $patient->user_id);
    }

    public function test_sample_details_step_creates_and_links_samples_to_order_items(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user);
        $sampleType = SampleType::factory()->create();
        $order = Order::factory()->for($user, 'User')->state(['step' => OrderStep::SAMPLE_DETAILS])->create();
        $orderItem = OrderItem::factory()->for($order, 'Order')->create();
        $patient = Patient::factory()->for($user, 'User')->create();

        $this->repository->update($order, [
            'samples' => [[
                'sample_type' => ['id' => $sampleType->id],
                'collectionDate' => now()->toDateString(),
                'order_item_id' => $orderItem->id,
                'patient_id' => $patient->id,
            ]],
        ], OrderStep::SAMPLE_DETAILS);

        $sample = Sample::where('sample_type_id', $sampleType->id)->firstOrFail();
        $this->assertSame($patient->id, $sample->patient_id);
        $this->assertTrue($orderItem->Samples()->where('samples.id', $sample->id)->exists());
    }

    public function test_sample_details_step_resolves_material_by_barcode_when_required(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user);
        $sampleType = SampleType::factory()->requiresSampleId()->create();
        $material = Material::factory()->for($user, 'User')->for($sampleType, 'SampleType')->create();
        $order = Order::factory()->for($user, 'User')->state(['step' => OrderStep::SAMPLE_DETAILS])->create();
        $orderItem = OrderItem::factory()->for($order, 'Order')->create();

        $this->repository->update($order, [
            'samples' => [[
                'sample_type' => ['id' => $sampleType->id],
                'sampleId' => $material->barcode,
                'collectionDate' => now()->toDateString(),
                'order_item_id' => $orderItem->id,
            ]],
        ], OrderStep::SAMPLE_DETAILS);

        $sample = Sample::where('sample_type_id', $sampleType->id)->firstOrFail();
        $this->assertSame($material->id, $sample->material_id);
    }

    public function test_sample_details_step_throws_when_required_barcode_is_unknown(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user);
        $sampleType = SampleType::factory()->requiresSampleId()->create();
        $order = Order::factory()->for($user, 'User')->state(['step' => OrderStep::SAMPLE_DETAILS])->create();
        $orderItem = OrderItem::factory()->for($order, 'Order')->create();

        $this->expectException(\Exception::class);

        $this->repository->update($order, [
            'samples' => [[
                'sample_type' => ['id' => $sampleType->id],
                'sampleId' => 'does-not-exist',
                'collectionDate' => now()->toDateString(),
                'order_item_id' => $orderItem->id,
            ]],
        ], OrderStep::SAMPLE_DETAILS);
    }

    public function test_get_user_orders_returns_only_the_current_users_orders(): void
    {
        $user = User::factory()->create();
        $other = User::factory()->create();
        $mine = Order::factory()->for($user, 'User')->create();
        Order::factory()->for($other, 'User')->create();

        $this->actingAs($user);
        $orders = $this->repository->getUserOrders([]);

        $this->assertSame(1, $orders->total());
        $this->assertSame($mine->id, $orders->items()[0]->id);
    }
}
