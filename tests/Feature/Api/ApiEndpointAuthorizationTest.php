<?php

namespace Tests\Feature\Api;

use App\Models\Material;
use App\Models\OrderMaterial;
use App\Models\SampleType;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * The reference-data lookups under /api used to be public. They are now gated by
 * auth:sanctum, and check-materials is scoped to the authenticated provider
 * rather than a client-supplied user id.
 */
class ApiEndpointAuthorizationTest extends TestCase
{
    use RefreshDatabase;

    public function test_guests_cannot_list_roles(): void
    {
        $this->getJson(route('api.roles.list'))->assertUnauthorized();
    }

    public function test_guests_cannot_check_materials(): void
    {
        $this->getJson(route('api.check_materials'))->assertUnauthorized();
    }

    public function test_authenticated_user_can_list_roles(): void
    {
        $this->actingAs(User::factory()->create())
            ->getJson(route('api.roles.list'))
            ->assertOk();
    }

    public function test_check_materials_ignores_client_supplied_user_and_scopes_to_the_authenticated_provider(): void
    {
        $owner = User::factory()->create();
        $intruder = User::factory()->create();
        $material = $this->makeMaterial($owner, 'BARCODE-1');

        // The intruder spoofs the owner's id in the query string. Previously this
        // leaked whether the owner had the material; now the lookup is scoped to
        // the intruder, who owns nothing, so it reports "no material" (403).
        $this->actingAs($intruder)
            ->getJson(route('api.check_materials', ['sampleId' => 'BARCODE-1', 'user' => $owner->id]))
            ->assertStatus(403)
            ->assertJsonPath('success', false);

        // The owner, even while spoofing someone else's id, still resolves to
        // their own material.
        $this->actingAs($owner)
            ->getJson(route('api.check_materials', [
                'id' => $material->id,
                'sampleId' => 'BARCODE-1',
                'user' => $intruder->id,
            ]))
            ->assertOk()
            ->assertJsonPath('success', true);
    }

    private function makeMaterial(User $user, string $barcode): Material
    {
        $sampleType = SampleType::create(['name' => 'Blood', 'sample_id_required' => false]);

        $orderMaterial = new OrderMaterial(['amount' => 1, 'status' => 'ORDERED']);
        $orderMaterial->user_id = $user->id;
        $orderMaterial->sample_type_id = $sampleType->id;
        $orderMaterial->save();

        $material = new Material(['barcode' => $barcode]);
        $material->user_id = $user->id;
        $material->sample_type_id = $sampleType->id;
        $material->order_material_id = $orderMaterial->id;
        $material->save();

        return $material;
    }
}
