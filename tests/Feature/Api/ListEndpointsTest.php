<?php

namespace Tests\Feature\Api;

use App\Models\Patient;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

/**
 * Happy-path + auth coverage for the reference-data list endpoints the SPA
 * consumes. Authorization (guests rejected) is the security-relevant half;
 * the authenticated assertions lock in the paginated `data` envelope each
 * resource collection returns.
 */
class ListEndpointsTest extends TestCase
{
    use RefreshDatabase;

    /**
     * The /api list routes, all gated by auth:sanctum and returning a paginated
     * resource collection. `roles` and `check-materials` already have dedicated
     * coverage in ApiEndpointAuthorizationTest.
     *
     * @return array<string, array{0: string}>
     */
    public static function sanctumListRoutes(): array
    {
        return [
            'sample types' => ['api.sampleTypes.list'],
            'consents' => ['api.consents.list'],
            'instructions' => ['api.instructions.list'],
            'order forms' => ['api.orderForms.list'],
            'tests' => ['api.tests.list'],
        ];
    }

    #[DataProvider('sanctumListRoutes')]
    public function test_guests_are_rejected(string $routeName): void
    {
        $this->getJson(route($routeName))->assertUnauthorized();
    }

    #[DataProvider('sanctumListRoutes')]
    public function test_authenticated_user_gets_a_paginated_collection(string $routeName): void
    {
        $this->actingAs(User::factory()->create())
            ->getJson(route($routeName))
            ->assertOk()
            ->assertJsonStructure(['data', 'meta' => ['current_page', 'total']]);
    }

    public function test_patient_list_requires_authentication(): void
    {
        // The patient list lives on the web (session) stack, so a guest is
        // redirected to login rather than getting a 401.
        $this->get(route('api.patients.list'))->assertRedirect(route('login'));
    }

    public function test_patient_list_returns_only_the_authenticated_users_patients(): void
    {
        $owner = User::factory()->create();
        $other = User::factory()->create();
        Patient::factory()->count(2)->for($owner, 'User')->create();
        Patient::factory()->for($other, 'User')->create();

        $this->actingAs($owner)
            ->getJson(route('api.patients.list'))
            ->assertOk()
            ->assertJsonPath('meta.total', 2);
    }
}
