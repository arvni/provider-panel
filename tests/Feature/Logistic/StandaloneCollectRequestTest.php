<?php

namespace Tests\Feature\Logistic;

use App\Enums\CollectRequestStatus;
use App\Jobs\SendCollectionRequest;
use App\Models\CollectRequest;
use App\Models\SampleType;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

/**
 * Collect requests raised from the collect request index without any order:
 * the provider only declares which sample types are ready for pickup, so the
 * selection and the optional comment live in the request's details payload.
 */
class StandaloneCollectRequestTest extends TestCase
{
    use RefreshDatabase;

    private function provider(): User
    {
        $user = User::factory()->create();

        $role = Role::findOrCreate(User::PROVIDER_ROLE);
        foreach (User::PROVIDER_PERMISSIONS as $permission) {
            Permission::findOrCreate($permission);
        }
        $role->syncPermissions(User::PROVIDER_PERMISSIONS);
        $user->assignRole($role);

        return $user;
    }

    private function sampleType(string $name, ?int $serverId = null, bool $orderable = true): SampleType
    {
        return SampleType::create([
            'name' => $name,
            'server_id' => $serverId,
            'orderable' => $orderable,
            'sample_id_required' => false,
        ]);
    }

    public function test_a_provider_can_request_a_collection_without_an_order(): void
    {
        Queue::fake();

        $provider = $this->provider();
        $blood = $this->sampleType('Blood', 55);
        $saliva = $this->sampleType('Saliva', 56);

        $response = $this->actingAs($provider)->post(route('collectRequests.store'), [
            'sample_types' => [$blood->id, $saliva->id],
            'preferred_date' => now()->addDay()->format('Y-m-d'),
            'comment' => 'Two boxes ready at the front desk.',
        ]);

        $response->assertRedirect();
        $response->assertSessionHasNoErrors();

        $collectRequest = CollectRequest::firstOrFail();

        $this->assertSame($provider->id, $collectRequest->user_id);
        $this->assertSame(CollectRequestStatus::REQUESTED, $collectRequest->status);
        $this->assertSame(now()->addDay()->format('Y-m-d'), $collectRequest->preferred_date);
        $this->assertSame('standalone', $collectRequest->details['type']);
        $this->assertSame('Two boxes ready at the front desk.', $collectRequest->details['comment']);
        // The chosen types are snapshotted (name + server id) into details.
        $this->assertSame(
            [['id' => $blood->id, 'server_id' => 55, 'name' => 'Blood'], ['id' => $saliva->id, 'server_id' => 56, 'name' => 'Saliva']],
            $collectRequest->details['sample_types']
        );

        Queue::assertPushed(SendCollectionRequest::class);
    }

    public function test_the_comment_is_optional(): void
    {
        Queue::fake();

        $provider = $this->provider();
        $blood = $this->sampleType('Blood');

        $response = $this->actingAs($provider)->post(route('collectRequests.store'), [
            'sample_types' => [$blood->id],
            'preferred_date' => now()->addDay()->format('Y-m-d'),
        ]);

        $response->assertSessionHasNoErrors();
        $this->assertNull(CollectRequest::firstOrFail()->details['comment']);
    }

    public function test_it_requires_a_sample_type_and_a_future_preferred_date(): void
    {
        Queue::fake();

        $provider = $this->provider();

        $this->actingAs($provider)
            ->post(route('collectRequests.store'), [
                'sample_types' => [],
                'preferred_date' => now()->subDay()->format('Y-m-d'),
            ])
            ->assertSessionHasErrors(['sample_types', 'preferred_date']);

        $this->assertSame(0, CollectRequest::count());
        Queue::assertNothingPushed();
    }

    public function test_it_rejects_a_sample_type_that_does_not_exist(): void
    {
        Queue::fake();

        $provider = $this->provider();

        $this->actingAs($provider)
            ->post(route('collectRequests.store'), [
                'sample_types' => [9999],
                'preferred_date' => now()->addDay()->format('Y-m-d'),
            ])
            ->assertSessionHasErrors('sample_types.0');

        $this->assertSame(0, CollectRequest::count());
    }

    public function test_a_user_without_the_collect_request_permission_cannot_request_one(): void
    {
        Queue::fake();

        $user = User::factory()->create();
        $blood = $this->sampleType('Blood');

        $this->actingAs($user)
            ->post(route('collectRequests.store'), [
                'sample_types' => [$blood->id],
                'preferred_date' => now()->addDay()->format('Y-m-d'),
            ])
            ->assertForbidden();

        $this->assertSame(0, CollectRequest::count());
    }

    public function test_the_index_page_offers_only_orderable_sample_types(): void
    {
        $provider = $this->provider();
        $this->sampleType('Saliva');
        $this->sampleType('Blood');
        $this->sampleType('Internal Control', orderable: false);

        $this->actingAs($provider)
            ->get(route('collectRequests.index'))
            ->assertInertia(fn ($page) => $page
                ->component('CollectRequest/UserIndex')
                ->has('sampleTypes', 2)
                // Ordered by name, so the checkbox list reads alphabetically.
                ->where('sampleTypes.0.name', 'Blood')
                ->where('sampleTypes.1.name', 'Saliva')
            );
    }

    public function test_it_rejects_a_sample_type_that_is_not_orderable(): void
    {
        Queue::fake();

        $provider = $this->provider();
        $internal = $this->sampleType('Internal Control', orderable: false);

        $this->actingAs($provider)
            ->post(route('collectRequests.store'), [
                'sample_types' => [$internal->id],
                'preferred_date' => now()->addDay()->format('Y-m-d'),
            ])
            ->assertSessionHasErrors('sample_types.0');

        $this->assertSame(0, CollectRequest::count());
    }
}
