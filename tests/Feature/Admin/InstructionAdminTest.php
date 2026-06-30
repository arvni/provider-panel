<?php

namespace Tests\Feature\Admin;

use App\Models\Instruction;
use App\Models\User;
use Database\Seeders\RoleAndPermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia;
use Tests\TestCase;

/**
 * Admin CRUD coverage for the Instruction resource (gated by InstructionPolicy).
 * Companion to SampleTypeAdminTest.
 */
class InstructionAdminTest extends TestCase
{
    use RefreshDatabase;

    private function admin(): User
    {
        $this->seed(RoleAndPermissionSeeder::class);

        return User::factory()->admin()->create();
    }

    public function test_non_admin_cannot_create_an_instruction(): void
    {
        $this->actingAs(User::factory()->create())
            ->post(route('admin.instructions.store'), ['name' => 'Instruction A', 'file' => null])
            ->assertForbidden();

        $this->assertDatabaseMissing('instructions', ['name' => 'Instruction A']);
    }

    public function test_non_admin_cannot_update_an_instruction(): void
    {
        $instruction = Instruction::factory()->create(['name' => 'Original']);

        $this->actingAs(User::factory()->create())
            ->put(route('admin.instructions.update', $instruction), ['name' => 'Renamed'])
            ->assertForbidden();

        $this->assertDatabaseHas('instructions', ['id' => $instruction->id, 'name' => 'Original']);
    }

    public function test_non_admin_cannot_list_instructions(): void
    {
        $this->actingAs(User::factory()->create())
            ->get(route('admin.instructions.index'))
            ->assertForbidden();
    }

    public function test_non_admin_cannot_view_an_instruction(): void
    {
        $instruction = Instruction::factory()->create();

        $this->actingAs(User::factory()->create())
            ->getJson(route('admin.instructions.show', $instruction))
            ->assertForbidden();
    }

    public function test_non_admin_cannot_delete_an_instruction(): void
    {
        $instruction = Instruction::factory()->create();

        $this->actingAs(User::factory()->create())
            ->delete(route('admin.instructions.destroy', $instruction))
            ->assertForbidden();

        $this->assertDatabaseHas('instructions', ['id' => $instruction->id]);
    }

    public function test_admin_can_create_an_instruction(): void
    {
        $this->actingAs($this->admin())
            ->post(route('admin.instructions.store'), ['name' => 'Instruction A', 'file' => null])
            ->assertRedirect();

        $this->assertDatabaseHas('instructions', ['name' => 'Instruction A']);
    }

    public function test_admin_can_update_an_instruction(): void
    {
        $instruction = Instruction::factory()->create(['name' => 'Original']);

        $this->actingAs($this->admin())
            ->put(route('admin.instructions.update', $instruction), ['name' => 'Updated', 'file' => null])
            ->assertRedirect();

        $this->assertDatabaseHas('instructions', ['id' => $instruction->id, 'name' => 'Updated']);
    }

    public function test_admin_can_list_instructions(): void
    {
        Instruction::factory()->count(2)->create();

        $this->actingAs($this->admin())
            ->get(route('admin.instructions.index'))
            ->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page->component('Instruction/Index'));
    }

    public function test_admin_can_delete_an_instruction(): void
    {
        $instruction = Instruction::factory()->create();

        $this->actingAs($this->admin())
            ->delete(route('admin.instructions.destroy', $instruction))
            ->assertRedirect();

        $this->assertDatabaseMissing('instructions', ['id' => $instruction->id]);
    }
}
