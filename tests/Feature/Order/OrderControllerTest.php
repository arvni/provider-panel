<?php

namespace Tests\Feature\Order;

use App\Enums\OrderStatus;
use App\Enums\OrderStep;
use App\Models\Order;
use App\Models\Patient;
use App\Models\Test;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

/**
 * HTTP-level coverage for the order lifecycle driven through OrderController:
 * create -> patient details -> finalize, plus the index/show/destroy authz
 * rules that gate a provider to their own orders. The repository-level details
 * (per-step mutations) live in OrderRepositoryTest.
 */
class OrderControllerTest extends TestCase
{
    use RefreshDatabase;

    /**
     * A provider granted the provider role (which carries the provider-facing
     * permissions). Role-less users now have no access, so the common acting
     * user for the provider-facing order flow holds this role explicitly.
     */
    private function provider(): User
    {
        $user = User::factory()->create();

        $role = Role::findOrCreate('provider');
        foreach (User::PROVIDER_PERMISSIONS as $permission) {
            Permission::findOrCreate($permission);
        }
        $role->syncPermissions(User::PROVIDER_PERMISSIONS);
        $user->assignRole($role);

        return $user;
    }

    /**
     * Valid single-patient PATIENT_DETAILS payload for the update endpoint.
     */
    private function patientPayload(string $name = 'Alice Provider'): array
    {
        return [
            'fullName' => $name,
            'gender' => '1',
            'dateOfBirth' => '1990-01-01',
            'consanguineousParents' => '0',
            'nationality' => ['code' => 'IR'],
        ];
    }

    public function test_provider_can_create_an_order(): void
    {
        $provider = $this->provider();
        $test = Test::factory()->create();

        $response = $this->actingAs($provider)
            ->post(route('orders.store'), ['tests' => [['id' => $test->id]]]);

        $order = Order::where('user_id', $provider->id)->firstOrFail();
        $response->assertRedirect(route('orders.edit', ['order' => $order, 'step' => OrderStep::PATIENT_DETAILS]));

        $this->assertSame(OrderStatus::PENDING, $order->status);
        $this->assertSame(OrderStep::PATIENT_DETAILS, $order->step);
        $this->assertDatabaseHas('order_items', ['order_id' => $order->id, 'test_id' => $test->id]);
    }

    public function test_index_only_lists_the_authenticated_providers_orders(): void
    {
        $provider = $this->provider();
        $other = $this->provider();
        $mine = Order::factory()->for($provider, 'User')->create();
        Order::factory()->for($other, 'User')->create();

        $this->actingAs($provider)
            ->get(route('orders.index'))
            ->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->component('Order/Index')
                ->has('orders.data', 1)
                ->where('orders.data.0.id', $mine->id)
            );
    }

    public function test_owner_can_view_their_order(): void
    {
        $provider = $this->provider();
        $order = Order::factory()->for($provider, 'User')->create();

        $this->actingAs($provider)
            ->get(route('orders.show', $order))
            ->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page->component('Order/Show'));
    }

    public function test_other_provider_cannot_view_someone_elses_order(): void
    {
        $order = Order::factory()->for($this->provider(), 'User')->create();

        $this->actingAs($this->provider())
            ->get(route('orders.show', $order))
            ->assertForbidden();
    }

    public function test_owner_can_delete_a_pending_order(): void
    {
        $provider = $this->provider();
        $order = Order::factory()->for($provider, 'User')->create();

        $this->actingAs($provider)
            ->delete(route('orders.destroy', $order))
            ->assertRedirect();

        $this->assertDatabaseMissing('orders', ['id' => $order->id]);
    }

    public function test_owner_cannot_delete_an_order_already_sent(): void
    {
        $provider = $this->provider();
        $order = Order::factory()->for($provider, 'User')->status(OrderStatus::SENT)->create();

        $this->actingAs($provider)
            ->delete(route('orders.destroy', $order))
            ->assertForbidden();

        $this->assertDatabaseHas('orders', ['id' => $order->id]);
    }

    public function test_other_provider_cannot_delete_an_order(): void
    {
        $order = Order::factory()->for($this->provider(), 'User')->create();

        $this->actingAs($this->provider())
            ->delete(route('orders.destroy', $order))
            ->assertForbidden();

        $this->assertDatabaseHas('orders', ['id' => $order->id]);
    }

    public function test_patient_details_step_creates_a_patient_and_skips_assignment_for_a_single_patient(): void
    {
        $provider = $this->provider();
        $order = Order::factory()->for($provider, 'User')->state(['step' => OrderStep::PATIENT_DETAILS])->create();

        $this->actingAs($provider)
            ->put(route('orders.update', ['order' => $order, 'step' => OrderStep::PATIENT_DETAILS->value]), [
                'patients' => [$this->patientPayload()],
            ])
            // A single patient auto-skips the patient/test assignment step.
            ->assertRedirect(route('orders.edit', ['order' => $order, 'step' => OrderStep::CLINICAL_DETAILS->value]));

        $order->refresh();
        $this->assertNotNull($order->main_patient_id);
        $this->assertCount(1, $order->patient_ids);
        $this->assertDatabaseHas('patients', ['fullName' => 'Alice Provider', 'user_id' => $provider->id]);
    }

    public function test_patient_details_step_routes_to_assignment_for_multiple_patients(): void
    {
        $provider = $this->provider();
        $order = Order::factory()->for($provider, 'User')->state(['step' => OrderStep::PATIENT_DETAILS])->create();

        $this->actingAs($provider)
            ->put(route('orders.update', ['order' => $order, 'step' => OrderStep::PATIENT_DETAILS->value]), [
                'patients' => [$this->patientPayload('Alice'), $this->patientPayload('Bob')],
            ])
            ->assertRedirect(route('orders.edit', ['order' => $order, 'step' => OrderStep::PATIENT_TEST_ASSIGNMENT->value]));

        $order->refresh();
        $this->assertCount(2, $order->patient_ids);
    }

    public function test_finalize_step_marks_the_order_requested_and_redirects_to_show(): void
    {
        $provider = $this->provider();
        $order = Order::factory()->for($provider, 'User')->state(['step' => OrderStep::FINALIZE])->create();

        $this->actingAs($provider)
            ->put(route('orders.update', ['order' => $order, 'step' => OrderStep::FINALIZE->value]), [])
            // FINALIZE is the last step, so step->next() returns 'finalize', which
            // tags along as a query param on the show redirect.
            ->assertRedirect(route('orders.show', ['order' => $order, 'step' => OrderStep::FINALIZE->value]));

        $this->assertSame(OrderStatus::REQUESTED, $order->refresh()->status);
    }

    public function test_other_provider_cannot_update_an_order(): void
    {
        $order = Order::factory()->for($this->provider(), 'User')->state(['step' => OrderStep::PATIENT_DETAILS])->create();

        $this->actingAs($this->provider())
            ->put(route('orders.update', ['order' => $order, 'step' => OrderStep::PATIENT_DETAILS->value]), [
                'patients' => [$this->patientPayload()],
            ])
            ->assertForbidden();
    }

    public function test_patient_details_step_validates_required_fields(): void
    {
        $provider = $this->provider();
        $order = Order::factory()->for($provider, 'User')->state(['step' => OrderStep::PATIENT_DETAILS])->create();

        $this->actingAs($provider)
            ->put(route('orders.update', ['order' => $order, 'step' => OrderStep::PATIENT_DETAILS->value]), [
                'patients' => [['fullName' => 'No Birthday']],
            ])
            ->assertSessionHasErrors(['patients.0.dateOfBirth', 'patients.0.gender']);
    }
}
