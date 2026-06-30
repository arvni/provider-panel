<?php

namespace Tests\Feature\Admin;

use App\Models\Consent;
use App\Models\User;
use Database\Seeders\RoleAndPermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia;
use Tests\TestCase;

/**
 * Admin CRUD coverage for the Consent resource (gated by ConsentPolicy).
 * Companion to SampleTypeAdminTest.
 */
class ConsentAdminTest extends TestCase
{
    use RefreshDatabase;

    private function admin(): User
    {
        $this->seed(RoleAndPermissionSeeder::class);

        return User::factory()->admin()->create();
    }

    public function test_non_admin_cannot_create_a_consent(): void
    {
        $this->actingAs(User::factory()->create())
            ->post(route('admin.consents.store'), ['name' => 'Consent A', 'file' => null])
            ->assertForbidden();

        $this->assertDatabaseMissing('consents', ['name' => 'Consent A']);
    }

    public function test_non_admin_cannot_update_a_consent(): void
    {
        $consent = Consent::factory()->create(['name' => 'Original']);

        $this->actingAs(User::factory()->create())
            ->put(route('admin.consents.update', $consent), ['name' => 'Renamed', 'file' => null])
            ->assertForbidden();

        $this->assertDatabaseHas('consents', ['id' => $consent->id, 'name' => 'Original']);
    }

    public function test_non_admin_cannot_list_consents(): void
    {
        $this->actingAs(User::factory()->create())
            ->get(route('admin.consents.index'))
            ->assertForbidden();
    }

    public function test_non_admin_cannot_view_a_consent(): void
    {
        $consent = Consent::factory()->create();

        $this->actingAs(User::factory()->create())
            ->getJson(route('admin.consents.show', $consent))
            ->assertForbidden();
    }

    public function test_non_admin_cannot_delete_a_consent(): void
    {
        $consent = Consent::factory()->create();

        $this->actingAs(User::factory()->create())
            ->delete(route('admin.consents.destroy', $consent))
            ->assertForbidden();

        $this->assertDatabaseHas('consents', ['id' => $consent->id]);
    }

    public function test_admin_can_create_a_consent(): void
    {
        $this->actingAs($this->admin())
            ->post(route('admin.consents.store'), ['name' => 'Consent A', 'file' => null])
            ->assertRedirect();

        $this->assertDatabaseHas('consents', ['name' => 'Consent A']);
    }

    public function test_admin_can_update_a_consent(): void
    {
        $consent = Consent::factory()->create(['name' => 'Original']);

        $this->actingAs($this->admin())
            ->put(route('admin.consents.update', $consent), ['name' => 'Updated', 'file' => null])
            ->assertRedirect();

        $this->assertDatabaseHas('consents', ['id' => $consent->id, 'name' => 'Updated']);
    }

    public function test_admin_can_list_consents(): void
    {
        Consent::factory()->count(2)->create();

        $this->actingAs($this->admin())
            ->get(route('admin.consents.index'))
            ->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page->component('Consent/Index'));
    }

    public function test_admin_can_delete_a_consent(): void
    {
        $consent = Consent::factory()->create();

        $this->actingAs($this->admin())
            ->delete(route('admin.consents.destroy', $consent))
            ->assertRedirect();

        $this->assertDatabaseMissing('consents', ['id' => $consent->id]);
    }
}
