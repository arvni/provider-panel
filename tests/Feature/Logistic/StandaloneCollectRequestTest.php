<?php

namespace Tests\Feature\Logistic;

use App\Enums\CollectRequestStatus;
use App\Jobs\SendCollectionRequest;
use App\Jobs\SendOrderMaterial;
use App\Models\CollectRequest;
use App\Models\OrderMaterial;
use App\Models\SampleType;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Queue;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

/**
 * Logistic requests raised from the logistic request index without any order.
 * The provider chooses what they need: a pickup for the collectable sample
 * types they have ready, or one kit sent out — which becomes a real
 * OrderMaterial linked back to the request.
 */
class StandaloneCollectRequestTest extends TestCase
{
    use RefreshDatabase;

    private function provider(array $permissions = User::PROVIDER_PERMISSIONS): User
    {
        $user = User::factory()->create();

        $role = Role::findOrCreate(User::PROVIDER_ROLE);
        foreach ($permissions as $permission) {
            Permission::findOrCreate($permission);
        }
        $role->syncPermissions($permissions);
        $user->assignRole($role);

        return $user;
    }

    private function sampleType(
        string $name,
        ?int $serverId = null,
        bool $orderable = true,
        bool $collectable = true
    ): SampleType {
        return SampleType::create([
            'name' => $name,
            'server_id' => $serverId,
            'orderable' => $orderable,
            'collectable' => $collectable,
            'sample_id_required' => false,
        ]);
    }

    public function test_a_provider_can_ask_for_a_collection_of_the_samples_they_have(): void
    {
        Queue::fake();

        $provider = $this->provider();
        $blood = $this->sampleType('Blood', 55);
        $saliva = $this->sampleType('Saliva', 56);

        $response = $this->actingAs($provider)->post(route('collectRequests.store'), [
            'mode' => 'collect',
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
        $this->assertSame('collect', $collectRequest->details['mode']);
        $this->assertSame('Two boxes ready at the front desk.', $collectRequest->details['comment']);
        // The chosen types are snapshotted (name + server id) into details.
        $this->assertSame(
            [['id' => $blood->id, 'server_id' => 55, 'name' => 'Blood'], ['id' => $saliva->id, 'server_id' => 56, 'name' => 'Saliva']],
            $collectRequest->details['sample_types']
        );
        // Asking for a pickup never orders materials.
        $this->assertSame(0, OrderMaterial::count());

        Queue::assertPushed(SendCollectionRequest::class);
    }

    public function test_an_ordered_kit_becomes_an_order_material_linked_to_the_request(): void
    {
        Queue::fake();
        Notification::fake();

        $provider = $this->provider();
        $blood = $this->sampleType('Blood', 55);

        $this->actingAs($provider)
            ->post(route('collectRequests.store'), [
                'mode' => 'order',
                'kit_sample_type' => $blood->id,
                'kit_amount' => 3,
                'preferred_date' => now()->addDay()->format('Y-m-d'),
            ])
            ->assertSessionHasNoErrors();

        $collectRequest = CollectRequest::firstOrFail();
        $orderMaterial = OrderMaterial::firstOrFail();

        $this->assertSame('order', $collectRequest->details['mode']);
        $this->assertSame($collectRequest->id, $orderMaterial->collect_request_id);
        $this->assertSame($provider->id, $orderMaterial->user_id);
        $this->assertSame($blood->id, $orderMaterial->sample_type_id);
        $this->assertSame(3, $orderMaterial->amount);

        // The kit is snapshotted into details, so the request keeps describing
        // what was asked for even if the sample type is later renamed.
        $this->assertSame([
            'id' => $blood->id,
            'server_id' => 55,
            'name' => 'Blood',
            'amount' => 3,
            'order_material_id' => $orderMaterial->id,
        ], $collectRequest->details['kit']);

        // Ordering a kit does not also claim samples are waiting for pickup.
        $this->assertArrayNotHasKey('sample_types', $collectRequest->details);
    }

    public function test_a_kit_order_syncs_as_a_material_and_never_as_a_collect_request(): void
    {
        Queue::fake();
        Notification::fake();

        $provider = $this->provider();
        $blood = $this->sampleType('Blood', 55);

        $this->actingAs($provider)
            ->post(route('collectRequests.store'), [
                'mode' => 'order',
                'kit_sample_type' => $blood->id,
                'kit_amount' => 2,
                'preferred_date' => now()->addDay()->format('Y-m-d'),
            ])
            ->assertSessionHasNoErrors();

        // The logistics endpoint has nothing to act on for a kit order.
        Queue::assertNotPushed(SendCollectionRequest::class);
        // The material carries it instead.
        Queue::assertPushed(SendOrderMaterial::class);

        $this->assertTrue(CollectRequest::firstOrFail()->isKitOrder());
    }

    public function test_a_pickup_syncs_as_a_collect_request_and_orders_no_material(): void
    {
        Queue::fake();

        $provider = $this->provider();
        $blood = $this->sampleType('Blood', 55);

        $this->actingAs($provider)
            ->post(route('collectRequests.store'), [
                'mode' => 'collect',
                'sample_types' => [$blood->id],
                'preferred_date' => now()->addDay()->format('Y-m-d'),
            ])
            ->assertSessionHasNoErrors();

        Queue::assertPushed(SendCollectionRequest::class);
        Queue::assertNotPushed(SendOrderMaterial::class);

        $this->assertFalse(CollectRequest::firstOrFail()->isKitOrder());
    }

    public function test_the_comment_is_optional(): void
    {
        Queue::fake();

        $provider = $this->provider();
        $blood = $this->sampleType('Blood');

        $this->actingAs($provider)
            ->post(route('collectRequests.store'), [
                'mode' => 'collect',
                'sample_types' => [$blood->id],
                'preferred_date' => now()->addDay()->format('Y-m-d'),
            ])
            ->assertSessionHasNoErrors();

        $this->assertNull(CollectRequest::firstOrFail()->details['comment']);
    }

    public function test_it_requires_a_mode_and_a_future_preferred_date(): void
    {
        Queue::fake();

        $provider = $this->provider();

        $this->actingAs($provider)
            ->post(route('collectRequests.store'), [
                'preferred_date' => now()->subDay()->format('Y-m-d'),
            ])
            ->assertSessionHasErrors(['mode', 'preferred_date']);

        $this->assertSame(0, CollectRequest::count());
        Queue::assertNothingPushed();
    }

    public function test_collecting_requires_at_least_one_sample_type(): void
    {
        Queue::fake();

        $provider = $this->provider();

        $this->actingAs($provider)
            ->post(route('collectRequests.store'), [
                'mode' => 'collect',
                'sample_types' => [],
                'preferred_date' => now()->addDay()->format('Y-m-d'),
            ])
            ->assertSessionHasErrors('sample_types');

        $this->assertSame(0, CollectRequest::count());
    }

    public function test_ordering_requires_a_kit_and_a_quantity_between_one_and_a_hundred(): void
    {
        Queue::fake();

        $provider = $this->provider();
        $blood = $this->sampleType('Blood');

        $this->actingAs($provider)
            ->post(route('collectRequests.store'), [
                'mode' => 'order',
                'preferred_date' => now()->addDay()->format('Y-m-d'),
            ])
            ->assertSessionHasErrors(['kit_sample_type', 'kit_amount']);

        $this->actingAs($provider)
            ->post(route('collectRequests.store'), [
                'mode' => 'order',
                'kit_sample_type' => $blood->id,
                'kit_amount' => 101,
                'preferred_date' => now()->addDay()->format('Y-m-d'),
            ])
            ->assertSessionHasErrors('kit_amount');

        $this->assertSame(0, CollectRequest::count());
        $this->assertSame(0, OrderMaterial::count());
    }

    public function test_the_unused_branch_is_ignored_rather_than_validated(): void
    {
        Queue::fake();

        $provider = $this->provider();
        $blood = $this->sampleType('Blood');

        // A stale kit left over from switching modes must not block a pickup,
        // and must not be recorded either.
        $this->actingAs($provider)
            ->post(route('collectRequests.store'), [
                'mode' => 'collect',
                'sample_types' => [$blood->id],
                'kit_sample_type' => 9999,
                'kit_amount' => 999,
                'preferred_date' => now()->addDay()->format('Y-m-d'),
            ])
            ->assertSessionHasNoErrors();

        $this->assertArrayNotHasKey('kit', CollectRequest::firstOrFail()->details);
        $this->assertSame(0, OrderMaterial::count());
    }

    public function test_it_rejects_a_sample_type_that_is_not_collectable(): void
    {
        Queue::fake();

        $provider = $this->provider();
        $internal = $this->sampleType('Internal Control', collectable: false);

        $this->actingAs($provider)
            ->post(route('collectRequests.store'), [
                'mode' => 'collect',
                'sample_types' => [$internal->id],
                'preferred_date' => now()->addDay()->format('Y-m-d'),
            ])
            ->assertSessionHasErrors('sample_types.0');

        $this->assertSame(0, CollectRequest::count());
    }

    public function test_it_rejects_a_kit_that_is_not_orderable(): void
    {
        Queue::fake();

        $provider = $this->provider();
        $internal = $this->sampleType('Internal Control', orderable: false);

        $this->actingAs($provider)
            ->post(route('collectRequests.store'), [
                'mode' => 'order',
                'kit_sample_type' => $internal->id,
                'kit_amount' => 1,
                'preferred_date' => now()->addDay()->format('Y-m-d'),
            ])
            ->assertSessionHasErrors('kit_sample_type');

        $this->assertSame(0, CollectRequest::count());
    }

    public function test_a_provider_who_may_not_order_materials_cannot_order_a_kit(): void
    {
        Queue::fake();

        $provider = $this->provider(['CollectRequest.Index']);
        $blood = $this->sampleType('Blood');

        $this->actingAs($provider)
            ->post(route('collectRequests.store'), [
                'mode' => 'order',
                'kit_sample_type' => $blood->id,
                'kit_amount' => 1,
                'preferred_date' => now()->addDay()->format('Y-m-d'),
            ])
            ->assertSessionHasErrors('mode');

        $this->assertSame(0, CollectRequest::count());
        $this->assertSame(0, OrderMaterial::count());

        // A pickup is still open to them.
        $this->actingAs($provider)
            ->post(route('collectRequests.store'), [
                'mode' => 'collect',
                'sample_types' => [$blood->id],
                'preferred_date' => now()->addDay()->format('Y-m-d'),
            ])
            ->assertSessionHasNoErrors();

        $this->assertSame(1, CollectRequest::count());
    }

    public function test_a_user_without_the_collect_request_permission_cannot_request_one(): void
    {
        Queue::fake();

        $user = User::factory()->create();
        $blood = $this->sampleType('Blood');

        $this->actingAs($user)
            ->post(route('collectRequests.store'), [
                'mode' => 'collect',
                'sample_types' => [$blood->id],
                'preferred_date' => now()->addDay()->format('Y-m-d'),
            ])
            ->assertForbidden();

        $this->assertSame(0, CollectRequest::count());
    }

    public function test_the_index_page_offers_each_branch_its_own_sample_types(): void
    {
        $provider = $this->provider();
        $this->sampleType('Saliva', orderable: true, collectable: false);
        $this->sampleType('Blood', orderable: true, collectable: true);
        $this->sampleType('Swab', orderable: false, collectable: true);
        $this->sampleType('Internal Control', orderable: false, collectable: false);

        $this->actingAs($provider)
            ->get(route('collectRequests.index'))
            ->assertInertia(fn ($page) => $page
                ->component('CollectRequest/UserIndex')
                // Ordered by name, so both lists read alphabetically.
                ->has('sampleTypes', 2)
                ->where('sampleTypes.0.name', 'Blood')
                ->where('sampleTypes.1.name', 'Saliva')
                ->has('collectableSampleTypes', 2)
                ->where('collectableSampleTypes.0.name', 'Blood')
                ->where('collectableSampleTypes.1.name', 'Swab')
                ->where('canRequestKit', true)
            );
    }

    public function test_the_index_page_hides_the_kit_branch_without_the_permission(): void
    {
        $provider = $this->provider(['CollectRequest.Index']);

        $this->actingAs($provider)
            ->get(route('collectRequests.index'))
            ->assertInertia(fn ($page) => $page->where('canRequestKit', false));
    }
}
