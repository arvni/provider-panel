<?php

namespace Tests\Feature\Admin;

use App\Models\OrderForm;
use App\Models\User;
use Database\Seeders\RoleAndPermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia;
use Tests\TestCase;

/**
 * Admin CRUD coverage for the OrderForm resource (gated by OrderFormPolicy).
 * The resource route excludes `show`. Companion to SampleTypeAdminTest.
 */
class OrderFormAdminTest extends TestCase
{
    use RefreshDatabase;

    /**
     * @return array<int, array<string, string>>
     */
    private function formData(): array
    {
        return [['label' => 'Field', 'type' => 'text']];
    }

    private function admin(): User
    {
        $this->seed(RoleAndPermissionSeeder::class);

        return User::factory()->admin()->create();
    }

    public function test_non_admin_cannot_create_an_order_form(): void
    {
        $this->actingAs(User::factory()->create())
            ->post(route('admin.orderForms.store'), ['name' => 'Form A', 'file' => null, 'formData' => $this->formData()])
            ->assertForbidden();

        $this->assertDatabaseMissing('order_forms', ['name' => 'Form A']);
    }

    public function test_non_admin_cannot_update_an_order_form(): void
    {
        $orderForm = OrderForm::factory()->create(['name' => 'Original']);

        $this->actingAs(User::factory()->create())
            ->put(route('admin.orderForms.update', $orderForm), ['name' => 'Renamed', 'file' => null, 'formData' => $this->formData()])
            ->assertForbidden();

        $this->assertDatabaseHas('order_forms', ['id' => $orderForm->id, 'name' => 'Original']);
    }

    public function test_non_admin_cannot_list_order_forms(): void
    {
        $this->actingAs(User::factory()->create())
            ->get(route('admin.orderForms.index'))
            ->assertForbidden();
    }

    public function test_non_admin_cannot_delete_an_order_form(): void
    {
        $orderForm = OrderForm::factory()->create();

        $this->actingAs(User::factory()->create())
            ->delete(route('admin.orderForms.destroy', $orderForm))
            ->assertForbidden();

        $this->assertDatabaseHas('order_forms', ['id' => $orderForm->id]);
    }

    public function test_admin_can_create_an_order_form(): void
    {
        $this->actingAs($this->admin())
            ->post(route('admin.orderForms.store'), ['name' => 'Form A', 'file' => null, 'formData' => $this->formData()])
            ->assertRedirect(route('admin.orderForms.index'));

        $this->assertDatabaseHas('order_forms', ['name' => 'Form A']);
    }

    public function test_admin_can_update_an_order_form(): void
    {
        $orderForm = OrderForm::factory()->create(['name' => 'Original']);

        $this->actingAs($this->admin())
            ->put(route('admin.orderForms.update', $orderForm), ['name' => 'Updated', 'file' => null, 'formData' => $this->formData()])
            ->assertRedirect(route('admin.orderForms.index'));

        $this->assertDatabaseHas('order_forms', ['id' => $orderForm->id, 'name' => 'Updated']);
    }

    public function test_admin_can_list_order_forms(): void
    {
        OrderForm::factory()->count(2)->create();

        $this->actingAs($this->admin())
            ->get(route('admin.orderForms.index'))
            ->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page->component('OrderForm/Index'));
    }

    public function test_admin_can_delete_an_order_form(): void
    {
        $orderForm = OrderForm::factory()->create();

        $this->actingAs($this->admin())
            ->delete(route('admin.orderForms.destroy', $orderForm))
            ->assertRedirect(route('admin.orderForms.index'));

        $this->assertDatabaseMissing('order_forms', ['id' => $orderForm->id]);
    }
}
