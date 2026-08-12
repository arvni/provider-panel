<?php

namespace Tests\Feature\Logistic;

use App\Enums\CollectRequestStatus;
use App\Enums\OrderMaterialStatus;
use App\Models\CollectRequest;
use App\Models\OrderMaterial;
use App\Models\SampleType;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

/**
 * A kit order never reaches the logistics endpoint, so no status webhook ever
 * arrives for its logistic request. The materials' progress is the only
 * progress there is, and the request follows it — using the request statuses
 * that already exist rather than giving materials new ones. A request carrying
 * several kits follows the least advanced of them.
 */
class KitOrderStatusTest extends TestCase
{
    use RefreshDatabase;

    private const SECRET = 'test-webhook-secret';

    protected function setUp(): void
    {
        parent::setUp();
        config(['webhook.secret' => self::SECRET]);
        Notification::fake();
    }

    private function sampleType(string $name, int $serverId): SampleType
    {
        return SampleType::create([
            'name' => $name,
            'server_id' => $serverId,
            'orderable' => true,
            'collectable' => true,
            'sample_id_required' => false,
        ]);
    }

    /**
     * user_id and sample_type_id are not fillable; the repository associates
     * them, so the fixtures do the same.
     */
    private function material(User $user, SampleType $sampleType, ?int $collectRequestId = null): OrderMaterial
    {
        $orderMaterial = new OrderMaterial([
            'amount' => 2,
            'status' => OrderMaterialStatus::ORDERED,
            'collect_request_id' => $collectRequestId,
        ]);
        $orderMaterial->User()->associate($user);
        $orderMaterial->SampleType()->associate($sampleType);
        $orderMaterial->save();

        return $orderMaterial;
    }

    /**
     * A kit order with one material per sample type given, in that order.
     *
     * @return array{0: CollectRequest, 1: array<int, OrderMaterial>}
     */
    private function kitOrder(SampleType ...$sampleTypes): array
    {
        $user = User::factory()->create();

        $collectRequest = CollectRequest::create([
            'user_id' => $user->id,
            'status' => CollectRequestStatus::REQUESTED,
            'preferred_date' => now()->addDay()->format('Y-m-d'),
            'details' => [
                'type' => 'standalone',
                'mode' => 'order',
                'kits' => array_map(fn (SampleType $sampleType) => [
                    'id' => $sampleType->id,
                    'name' => $sampleType->name,
                    'amount' => 2,
                ], $sampleTypes),
            ],
        ]);

        $materials = array_map(
            fn (SampleType $sampleType) => $this->material($user, $sampleType, $collectRequest->id),
            $sampleTypes
        );

        return [$collectRequest, $materials];
    }

    public function test_generating_the_kits_moves_the_request_to_scheduled(): void
    {
        $sampleType = $this->sampleType('Blood', 55);
        [$collectRequest, [$orderMaterial]] = $this->kitOrder($sampleType);

        $orderMaterial->update(['status' => OrderMaterialStatus::GENERATED]);

        $this->assertSame(
            CollectRequestStatus::SCHEDULED,
            $collectRequest->fresh()->status
        );
    }

    public function test_a_request_waits_for_its_last_kit_before_it_is_scheduled(): void
    {
        $blood = $this->sampleType('Blood', 55);
        $saliva = $this->sampleType('Saliva', 56);
        [$collectRequest, [$bloodKit, $salivaKit]] = $this->kitOrder($blood, $saliva);

        // One kit made up is not the order made up.
        $bloodKit->update(['status' => OrderMaterialStatus::GENERATED]);
        $this->assertSame(CollectRequestStatus::REQUESTED, $collectRequest->fresh()->status);

        $salivaKit->update(['status' => OrderMaterialStatus::GENERATED]);
        $this->assertSame(CollectRequestStatus::SCHEDULED, $collectRequest->fresh()->status);
    }

    public function test_a_kit_sent_back_to_ordered_takes_the_request_with_it(): void
    {
        $blood = $this->sampleType('Blood', 55);
        $saliva = $this->sampleType('Saliva', 56);
        [$collectRequest, [$bloodKit, $salivaKit]] = $this->kitOrder($blood, $saliva);

        $bloodKit->update(['status' => OrderMaterialStatus::GENERATED]);
        $salivaKit->update(['status' => OrderMaterialStatus::GENERATED]);
        $this->assertSame(CollectRequestStatus::SCHEDULED, $collectRequest->fresh()->status);

        // The request describes the least advanced kit, whichever way it moved.
        $salivaKit->update(['status' => OrderMaterialStatus::ORDERED]);
        $this->assertSame(CollectRequestStatus::REQUESTED, $collectRequest->fresh()->status);
    }

    public function test_a_late_kit_cannot_drag_a_finished_request_backwards(): void
    {
        $blood = $this->sampleType('Blood', 55);
        [$collectRequest, [$orderMaterial]] = $this->kitOrder($blood);

        // An admin has confirmed the provider has the kits.
        $collectRequest->update(['status' => CollectRequestStatus::RECEIVED]);

        $orderMaterial->update(['status' => OrderMaterialStatus::GENERATED]);

        $this->assertSame(CollectRequestStatus::RECEIVED, $collectRequest->fresh()->status);
    }

    public function test_the_material_status_webhook_carries_the_request_along(): void
    {
        $sampleType = $this->sampleType('Blood', 55);
        [$collectRequest, [$orderMaterial]] = $this->kitOrder($sampleType);

        $payload = [
            'materials' => [
                [
                    'barcode' => 'KIT-0001',
                    'expire_date' => null,
                    'sample_type' => ['id' => $sampleType->server_id],
                ],
            ],
        ];

        $this->postJson(
            route('api.orderMaterials.updateStatus', $orderMaterial->id),
            $payload,
            ['X-Webhook-Signature' => hash_hmac('sha256', json_encode($payload), self::SECRET)],
        )->assertOk();

        $this->assertSame(OrderMaterialStatus::GENERATED, $orderMaterial->fresh()->status);
        $this->assertSame(CollectRequestStatus::SCHEDULED, $collectRequest->fresh()->status);
    }

    public function test_a_material_ordered_on_its_own_touches_no_request(): void
    {
        $sampleType = $this->sampleType('Blood', 55);
        $user = User::factory()->create();

        // Ordered from the Order Materials page, so there is no request to move.
        $orderMaterial = $this->material($user, $sampleType);

        // A pickup raised separately must not be dragged along by it.
        $pickup = CollectRequest::create([
            'user_id' => $user->id,
            'status' => CollectRequestStatus::REQUESTED,
            'details' => ['type' => 'standalone', 'mode' => 'collect'],
        ]);

        $orderMaterial->update(['status' => OrderMaterialStatus::GENERATED]);

        $this->assertSame(CollectRequestStatus::REQUESTED, $pickup->fresh()->status);
    }

    public function test_a_change_that_is_not_the_status_leaves_the_request_alone(): void
    {
        $sampleType = $this->sampleType('Blood', 55);
        [$collectRequest, [$orderMaterial]] = $this->kitOrder($sampleType);

        // What MaterialOrder::send does once the central server answers.
        $orderMaterial->update(['server_id' => 4321]);

        $this->assertSame(CollectRequestStatus::REQUESTED, $collectRequest->fresh()->status);
    }
}
