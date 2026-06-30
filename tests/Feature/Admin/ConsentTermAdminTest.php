<?php

namespace Tests\Feature\Admin;

use App\Models\ConsentTerm;
use App\Models\User;
use Database\Seeders\RoleAndPermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia;
use Tests\TestCase;

/**
 * Admin CRUD coverage for the ConsentTerm resource. Every action is gated by
 * ConsentTermPolicy (store/update via their form requests; index/show/destroy
 * via explicit authorize()). A role-less provider is rejected; an Admin gets
 * the happy path. Companion to SampleTypeAdminTest.
 */
class ConsentTermAdminTest extends TestCase
{
    use RefreshDatabase;

    private function admin(): User
    {
        $this->seed(RoleAndPermissionSeeder::class);

        return User::factory()->admin()->create();
    }

    public function test_non_admin_cannot_create_a_consent_term(): void
    {
        $this->actingAs(User::factory()->create())
            ->post(route('admin.consentTerms.store'), ['name' => 'Terms A', 'is_active' => true])
            ->assertForbidden();

        $this->assertDatabaseMissing('consent_terms', ['name' => 'Terms A']);
    }

    public function test_non_admin_cannot_update_a_consent_term(): void
    {
        $consentTerm = ConsentTerm::factory()->create(['name' => 'Original']);

        $this->actingAs(User::factory()->create())
            ->put(route('admin.consentTerms.update', $consentTerm), ['name' => 'Renamed', 'is_active' => true])
            ->assertForbidden();

        $this->assertDatabaseHas('consent_terms', ['id' => $consentTerm->id, 'name' => 'Original']);
    }

    public function test_non_admin_cannot_list_consent_terms(): void
    {
        $this->actingAs(User::factory()->create())
            ->get(route('admin.consentTerms.index'))
            ->assertForbidden();
    }

    public function test_non_admin_cannot_view_a_consent_term(): void
    {
        $consentTerm = ConsentTerm::factory()->create();

        $this->actingAs(User::factory()->create())
            ->getJson(route('admin.consentTerms.show', $consentTerm))
            ->assertForbidden();
    }

    public function test_non_admin_cannot_delete_a_consent_term(): void
    {
        $consentTerm = ConsentTerm::factory()->create();

        $this->actingAs(User::factory()->create())
            ->delete(route('admin.consentTerms.destroy', $consentTerm))
            ->assertForbidden();

        $this->assertDatabaseHas('consent_terms', ['id' => $consentTerm->id]);
    }

    public function test_admin_can_create_a_consent_term(): void
    {
        $this->actingAs($this->admin())
            ->post(route('admin.consentTerms.store'), ['name' => 'Terms A', 'is_active' => true])
            ->assertRedirect();

        $this->assertDatabaseHas('consent_terms', ['name' => 'Terms A', 'is_active' => true]);
    }

    public function test_admin_can_update_a_consent_term(): void
    {
        $consentTerm = ConsentTerm::factory()->create(['name' => 'Original']);

        $this->actingAs($this->admin())
            ->put(route('admin.consentTerms.update', $consentTerm), ['name' => 'Updated', 'is_active' => false])
            ->assertRedirect();

        $this->assertDatabaseHas('consent_terms', ['id' => $consentTerm->id, 'name' => 'Updated']);
    }

    public function test_admin_can_list_consent_terms(): void
    {
        ConsentTerm::factory()->count(2)->create();

        $this->actingAs($this->admin())
            ->get(route('admin.consentTerms.index'))
            ->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page->component('ConsentTerm/Index'));
    }

    public function test_admin_can_delete_a_consent_term(): void
    {
        $consentTerm = ConsentTerm::factory()->create();

        $this->actingAs($this->admin())
            ->delete(route('admin.consentTerms.destroy', $consentTerm))
            ->assertRedirect();

        $this->assertDatabaseMissing('consent_terms', ['id' => $consentTerm->id]);
    }
}
