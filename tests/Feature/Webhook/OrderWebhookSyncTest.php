<?php

namespace Tests\Feature\Webhook;

use App\Models\CollectRequest;
use App\Models\Order;
use App\Models\Patient;
use App\Models\Sample;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * End-to-end coverage for the order import and update webhooks, which drive the
 * order/patient/item/sample sync from the main server. These had no tests, so
 * they double as a guard around the shared sync helpers in HandlesCollectRequests.
 */
class OrderWebhookSyncTest extends TestCase
{
    use RefreshDatabase;

    private const SECRET = 'test-webhook-secret';

    protected function setUp(): void
    {
        parent::setUp();
        config(['webhook.secret' => self::SECRET]);
    }

    /**
     * Build a minimal-but-valid order payload for both webhooks. The patient name
     * is threaded through both the main_patient block and the order-item patient
     * so the two stay consistent (the item-patient sync would otherwise overwrite
     * a main_patient-only change).
     */
    private function orderPayload(int $referrerId, string $status = 'pending', string $patientName = 'Alice Original'): array
    {
        return [
            'order' => [
                'id' => 1001,
                'status' => $status,
                'main_patient' => [
                    'id' => 5001,
                    'fullName' => $patientName,
                    'nationality' => 'IR',
                    'dateOfBirth' => '1990-01-01',
                    'gender' => 1,
                ],
                'orderItems' => [
                    [
                        'id' => 'oi-1',
                        'test_id' => 1,
                        'test' => ['id' => 1, 'name' => 'Karyotype', 'code' => 'KAR'],
                        'samples' => [
                            [
                                'sample_type_id' => 1,
                                'sampleType' => ['id' => 1, 'name' => 'Blood'],
                                'patientId' => 5001,
                            ],
                        ],
                        'patients' => [
                            [
                                'id' => '5001',
                                'fullName' => $patientName,
                                'nationality' => 'IR',
                                'dateOfBirth' => '1990-01-01',
                                'gender' => 1,
                                'is_main' => true,
                            ],
                        ],
                    ],
                ],
            ],
            'referrer_id' => $referrerId,
        ];
    }

    /**
     * The order payload carrying a collect request, plus sample barcodes so the
     * same samples can be matched across deliveries.
     *
     * $samples maps each barcode to the collect request server id that sample
     * itself claims (null to leave it to the order's request).
     */
    private function collectRequestPayload(int $referrerId, int $collectRequestServerId, array $samples = ['BC-1' => null]): array
    {
        $payload = $this->orderPayload($referrerId);
        $template = $payload['order']['orderItems'][0]['samples'][0];

        $payload['order']['orderItems'][0]['samples'] = [];
        foreach ($samples as $sampleId => $claimedCollectRequestId) {
            $sample = [...$template, 'sampleId' => $sampleId];
            if ($claimedCollectRequestId) {
                $sample['collect_request_id'] = $claimedCollectRequestId;
            }

            $payload['order']['orderItems'][0]['samples'][] = $sample;
        }

        $payload['collect_request'] = [
            'id' => $collectRequestServerId,
            'status' => 'requested',
        ];

        return $payload;
    }

    private function postSigned(string $routeName, array $payload)
    {
        $body = json_encode($payload);

        return $this->call(
            'POST',
            route($routeName),
            [],
            [],
            [],
            [
                'CONTENT_TYPE' => 'application/json',
                'HTTP_ACCEPT' => 'application/json',
                'HTTP_X_WEBHOOK_SIGNATURE' => hash_hmac('sha256', $body, self::SECRET),
            ],
            $body,
        );
    }

    public function test_import_creates_the_order_with_patients_items_and_samples(): void
    {
        $user = User::factory()->create(['referrer_id' => 42]);

        $this->postSigned('api.webhooks.orders.import', $this->orderPayload(42))
            ->assertOk()
            ->assertJsonPath('success', true);

        $this->assertDatabaseHas('orders', ['server_id' => 1001, 'user_id' => $user->id]);
        $this->assertDatabaseHas('patients', ['server_id' => 5001, 'fullName' => 'Alice Original', 'user_id' => $user->id]);
        $this->assertDatabaseHas('tests', ['server_id' => 1, 'code' => 'KAR']);
        $this->assertDatabaseHas('sample_types', ['server_id' => 1, 'name' => 'Blood']);

        $order = Order::where('server_id', 1001)->first();
        $this->assertSame(1, $order->OrderItems()->count());
    }

    public function test_update_creates_then_updates_an_order(): void
    {
        $user = User::factory()->create(['referrer_id' => 42]);

        // First delivery creates the order.
        $this->postSigned('api.orders.update-by-webhook', $this->orderPayload(42))
            ->assertOk();
        $this->assertDatabaseHas('orders', ['server_id' => 1001, 'status' => 'pending']);

        // Second delivery advances the status on the same order (no duplicate).
        $this->postSigned('api.orders.update-by-webhook', $this->orderPayload(42, 'sent'))
            ->assertOk();

        $this->assertSame(1, Order::where('server_id', 1001)->count());
        $this->assertDatabaseHas('orders', ['server_id' => 1001, 'status' => 'sent']);
        $this->assertNotNull(Order::where('server_id', 1001)->first()->sent_at);
    }

    /**
     * Ownership is set once, on create. A later delivery quoting a different
     * referrer must not hand the order to that referrer's user -- that is how an
     * order disappears from one provider's panel and turns up in another's.
     */
    public function test_update_never_moves_an_existing_order_to_another_referrer(): void
    {
        $owner = User::factory()->create(['referrer_id' => 42]);
        $other = User::factory()->create(['referrer_id' => 43]);

        $this->postSigned('api.orders.update-by-webhook', $this->orderPayload(42))->assertOk();

        $this->postSigned('api.orders.update-by-webhook', $this->orderPayload(43, 'sent'))->assertOk();

        $order = Order::where('server_id', 1001)->first();
        $this->assertSame($owner->id, $order->user_id);
        $this->assertNotSame($other->id, $order->user_id);
        $this->assertSame('sent', $order->status->value);
    }

    public function test_update_refreshes_an_existing_patients_changed_fields(): void
    {
        $user = User::factory()->create(['referrer_id' => 42]);
        $this->postSigned('api.orders.update-by-webhook', $this->orderPayload(42))->assertOk();

        $this->postSigned('api.orders.update-by-webhook', $this->orderPayload(42, 'pending', 'Alice Renamed'))
            ->assertOk();

        $this->assertSame(1, Patient::where('server_id', 5001)->count());
        $this->assertDatabaseHas('patients', ['server_id' => 5001, 'fullName' => 'Alice Renamed']);
    }

    public function test_import_links_the_order_and_its_samples_to_the_collect_request(): void
    {
        User::factory()->create(['referrer_id' => 42]);

        $this->postSigned('api.webhooks.orders.import', $this->collectRequestPayload(42, 9001))
            ->assertOk();

        $collectRequest = CollectRequest::where('server_id', 9001)->firstOrFail();

        $this->assertDatabaseHas('orders', ['server_id' => 1001, 'collect_request_id' => $collectRequest->id]);
        $this->assertDatabaseHas('samples', ['sampleId' => 'BC-1', 'collect_request_id' => $collectRequest->id]);
    }

    public function test_reimport_keeps_collected_samples_on_their_original_request(): void
    {
        User::factory()->create(['referrer_id' => 42]);

        $this->postSigned('api.webhooks.orders.import', $this->collectRequestPayload(42, 9001))
            ->assertOk();

        $this->postSigned('api.webhooks.orders.import', $this->collectRequestPayload(42, 9002))
            ->assertOk();

        $first = CollectRequest::where('server_id', 9001)->firstOrFail();
        $second = CollectRequest::where('server_id', 9002)->firstOrFail();

        // The sample was collected under 9001 and stays there, even though the
        // order itself has moved on to the newer request.
        $this->assertSame(1, Sample::where('sampleId', 'BC-1')->count());
        $this->assertDatabaseHas('samples', ['sampleId' => 'BC-1', 'collect_request_id' => $first->id]);
        $this->assertDatabaseHas('orders', ['server_id' => 1001, 'collect_request_id' => $second->id]);
    }

    public function test_update_attaches_only_the_uncollected_samples_to_the_new_request(): void
    {
        User::factory()->create(['referrer_id' => 42]);

        $this->postSigned('api.orders.update-by-webhook', $this->collectRequestPayload(42, 9001))
            ->assertOk();

        // A second request covering the same order plus a newly added sample.
        $this->postSigned(
            'api.orders.update-by-webhook',
            $this->collectRequestPayload(42, 9002, ['BC-1' => null, 'BC-2' => null])
        )->assertOk();

        $first = CollectRequest::where('server_id', 9001)->firstOrFail();
        $second = CollectRequest::where('server_id', 9002)->firstOrFail();

        $this->assertDatabaseHas('samples', ['sampleId' => 'BC-1', 'collect_request_id' => $first->id]);
        $this->assertDatabaseHas('samples', ['sampleId' => 'BC-2', 'collect_request_id' => $second->id]);
    }

    public function test_a_new_sample_joins_the_collect_request_it_claims(): void
    {
        User::factory()->create(['referrer_id' => 42]);

        $this->postSigned('api.orders.update-by-webhook', $this->collectRequestPayload(42, 9001))
            ->assertOk();

        // The order is delivered under request 9002, but the new sample reports
        // 9001 as its own: the sample's request wins over the order's.
        $this->postSigned(
            'api.orders.update-by-webhook',
            $this->collectRequestPayload(42, 9002, ['BC-1' => null, 'BC-2' => 9001])
        )->assertOk();

        $first = CollectRequest::where('server_id', 9001)->firstOrFail();
        $second = CollectRequest::where('server_id', 9002)->firstOrFail();

        $this->assertDatabaseHas('samples', ['sampleId' => 'BC-2', 'collect_request_id' => $first->id]);
        $this->assertDatabaseHas('orders', ['server_id' => 1001, 'collect_request_id' => $second->id]);
    }
}
