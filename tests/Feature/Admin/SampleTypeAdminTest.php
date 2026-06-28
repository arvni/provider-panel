<?php

namespace Tests\Feature\Admin;

use App\Models\SampleType;
use App\Models\User;
use Database\Seeders\RoleAndPermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia;
use Tests\TestCase;

/**
 * Admin CRUD coverage for a representative resource controller (SampleType).
 * Every action is gated by the SampleTypePolicy (store/update via their form
 * requests; index/show/destroy via explicit authorize() calls added to close a
 * gap where they were reachable by any authenticated user). A role-less provider
 * is rejected across the board; an Admin gets the happy path.
 */
class SampleTypeAdminTest extends TestCase
{
    use RefreshDatabase;

    private function admin(): User
    {
        $this->seed(RoleAndPermissionSeeder::class);

        return User::factory()->admin()->create();
    }

    public function test_non_admin_cannot_create_a_sample_type(): void
    {
        $this->actingAs(User::factory()->create())
            ->post(route('admin.sampleTypes.store'), ['name' => 'Blood'])
            ->assertForbidden();

        $this->assertDatabaseMissing('sample_types', ['name' => 'Blood']);
    }

    public function test_non_admin_cannot_update_a_sample_type(): void
    {
        $sampleType = SampleType::factory()->create(['name' => 'Plasma']);

        $this->actingAs(User::factory()->create())
            ->put(route('admin.sampleTypes.update', $sampleType), ['name' => 'Renamed'])
            ->assertForbidden();

        $this->assertDatabaseHas('sample_types', ['id' => $sampleType->id, 'name' => 'Plasma']);
    }

    public function test_non_admin_cannot_list_sample_types(): void
    {
        SampleType::factory()->create();

        $this->actingAs(User::factory()->create())
            ->get(route('admin.sampleTypes.index'))
            ->assertForbidden();
    }

    public function test_non_admin_cannot_view_a_sample_type(): void
    {
        $sampleType = SampleType::factory()->create();

        $this->actingAs(User::factory()->create())
            ->getJson(route('admin.sampleTypes.show', $sampleType))
            ->assertForbidden();
    }

    public function test_non_admin_cannot_delete_a_sample_type(): void
    {
        $sampleType = SampleType::factory()->create();

        $this->actingAs(User::factory()->create())
            ->delete(route('admin.sampleTypes.destroy', $sampleType))
            ->assertForbidden();

        $this->assertDatabaseHas('sample_types', ['id' => $sampleType->id]);
    }

    public function test_admin_can_create_a_sample_type(): void
    {
        $this->actingAs($this->admin())
            ->post(route('admin.sampleTypes.store'), ['name' => 'Blood'])
            ->assertRedirect();

        $this->assertDatabaseHas('sample_types', ['name' => 'Blood']);
    }

    public function test_admin_can_update_a_sample_type(): void
    {
        $sampleType = SampleType::factory()->create(['name' => 'Plasma']);

        $this->actingAs($this->admin())
            ->put(route('admin.sampleTypes.update', $sampleType), ['name' => 'Serum'])
            ->assertRedirect();

        $this->assertDatabaseHas('sample_types', ['id' => $sampleType->id, 'name' => 'Serum']);
    }

    public function test_admin_can_list_sample_types(): void
    {
        SampleType::factory()->count(2)->create();

        $this->actingAs($this->admin())
            ->get(route('admin.sampleTypes.index'))
            ->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->component('SampleType/Index')
                ->has('sampleTypes.data', 2)
            );
    }

    public function test_admin_can_delete_a_sample_type(): void
    {
        $sampleType = SampleType::factory()->create();

        $this->actingAs($this->admin())
            ->delete(route('admin.sampleTypes.destroy', $sampleType))
            ->assertRedirect();

        $this->assertDatabaseMissing('sample_types', ['id' => $sampleType->id]);
    }
}
