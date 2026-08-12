<?php

namespace Tests\Feature\Admin;

use App\Enums\CollectRequestStatus;
use App\Jobs\SendCollectionRequest;
use App\Models\CollectRequest;
use App\Models\User;
use Database\Seeders\RoleAndPermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;
use Tests\TestCase;

/**
 * A logistic request where the provider ordered kits has nothing to say to the
 * logistics endpoint: the lab acts on the order material it created, which
 * syncs on its own. The admin "send to server" action must refuse it rather
 * than post a request with no orders in it.
 */
class AdminSendKitOrderTest extends TestCase
{
    use RefreshDatabase;

    private function admin(): User
    {
        $this->seed(RoleAndPermissionSeeder::class);

        return User::factory()->admin()->create();
    }

    private function standaloneRequest(array $details): CollectRequest
    {
        return CollectRequest::create([
            'user_id' => User::factory()->create()->id,
            'status' => CollectRequestStatus::REQUESTED,
            'preferred_date' => now()->addDay()->format('Y-m-d'),
            'details' => $details + ['type' => 'standalone'],
        ]);
    }

    public function test_an_admin_cannot_send_a_kit_order_to_the_logistics_endpoint(): void
    {
        Queue::fake();

        $admin = $this->admin();
        $collectRequest = $this->standaloneRequest([
            'mode' => 'order',
            'kits' => [['id' => 1, 'name' => 'Blood', 'amount' => 2, 'order_material_id' => 9]],
        ]);

        $this->actingAs($admin)
            ->post(route('admin.collectRequests.send', $collectRequest->id))
            ->assertRedirect();

        Queue::assertNotPushed(SendCollectionRequest::class);
    }

    public function test_an_admin_can_still_send_a_pickup(): void
    {
        Queue::fake();

        $admin = $this->admin();
        $collectRequest = $this->standaloneRequest([
            'mode' => 'collect',
            'sample_types' => [['id' => 1, 'server_id' => 55, 'name' => 'Blood']],
        ]);

        $this->actingAs($admin)
            ->post(route('admin.collectRequests.send', $collectRequest->id))
            ->assertRedirect();

        Queue::assertPushed(SendCollectionRequest::class);
    }
}
