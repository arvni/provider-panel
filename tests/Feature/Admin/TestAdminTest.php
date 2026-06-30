<?php

namespace Tests\Feature\Admin;

use App\Models\SampleType;
use App\Models\Test;
use App\Models\User;
use Database\Seeders\RoleAndPermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia;
use Tests\TestCase;

/**
 * Admin CRUD coverage for the Test resource (gated by TestPolicy). The resource
 * route excludes `show`. Store/update validate a rich payload (gender, sample
 * types, turnaround) and sync the test's sample types. Companion to
 * SampleTypeAdminTest.
 */
class TestAdminTest extends TestCase
{
    use RefreshDatabase;

    private function admin(): User
    {
        $this->seed(RoleAndPermissionSeeder::class);

        return User::factory()->admin()->create();
    }

    /**
     * A fully valid Test store/update payload.
     *
     * @param  array<string, mixed>  $overrides
     * @return array<string, mixed>
     */
    private function payload(array $overrides = []): array
    {
        $sampleType = SampleType::factory()->create();

        return array_merge([
            'name' => 'Karyotype',
            'shortName' => 'KAR',
            'code' => 'T-100',
            'gender' => ['1'],
            'turnaroundTime' => 5,
            'description' => 'Standard karyotype analysis',
            'sample_types' => [
                ['sample_type' => ['id' => $sampleType->id], 'description' => 'Whole blood'],
            ],
        ], $overrides);
    }

    public function test_non_admin_cannot_create_a_test(): void
    {
        $this->actingAs(User::factory()->create())
            ->post(route('admin.tests.store'), $this->payload())
            ->assertForbidden();

        $this->assertDatabaseMissing('tests', ['name' => 'Karyotype']);
    }

    public function test_non_admin_cannot_update_a_test(): void
    {
        $test = Test::factory()->create(['name' => 'Original']);

        $this->actingAs(User::factory()->create())
            ->put(route('admin.tests.update', $test), $this->payload(['name' => 'Renamed']))
            ->assertForbidden();

        $this->assertDatabaseHas('tests', ['id' => $test->id, 'name' => 'Original']);
    }

    public function test_non_admin_cannot_list_tests(): void
    {
        $this->actingAs(User::factory()->create())
            ->get(route('admin.tests.index'))
            ->assertForbidden();
    }

    public function test_non_admin_cannot_delete_a_test(): void
    {
        $test = Test::factory()->create();

        $this->actingAs(User::factory()->create())
            ->delete(route('admin.tests.destroy', $test))
            ->assertForbidden();

        $this->assertDatabaseHas('tests', ['id' => $test->id]);
    }

    public function test_admin_can_create_a_test_with_sample_types(): void
    {
        $this->actingAs($this->admin())
            ->post(route('admin.tests.store'), $this->payload())
            ->assertRedirect(route('admin.tests.index'));

        $this->assertDatabaseHas('tests', ['name' => 'Karyotype', 'code' => 'T-100']);
        $this->assertDatabaseHas('sample_type_test', ['description' => 'Whole blood']);
    }

    public function test_admin_can_update_a_test(): void
    {
        $test = Test::factory()->create(['name' => 'Original', 'code' => 'OLD-1']);

        $this->actingAs($this->admin())
            ->put(route('admin.tests.update', $test), $this->payload(['name' => 'Updated', 'code' => 'NEW-1']))
            ->assertRedirect(route('admin.tests.index'));

        $this->assertDatabaseHas('tests', ['id' => $test->id, 'name' => 'Updated', 'code' => 'NEW-1']);
    }

    public function test_admin_can_list_tests(): void
    {
        Test::factory()->count(2)->create();

        $this->actingAs($this->admin())
            ->get(route('admin.tests.index'))
            ->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page->component('Test/Index'));
    }

    public function test_admin_can_delete_a_test(): void
    {
        $test = Test::factory()->create();

        $this->actingAs($this->admin())
            ->delete(route('admin.tests.destroy', $test))
            ->assertRedirect(route('admin.tests.index'));

        // Test uses SoftDeletes — the row remains with a deleted_at timestamp.
        $this->assertSoftDeleted('tests', ['id' => $test->id]);
    }
}
