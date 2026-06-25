<?php

namespace Tests\Feature\Webhook;

use App\Models\Order;
use App\Models\Patient;
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

    public function test_update_refreshes_an_existing_patients_changed_fields(): void
    {
        $user = User::factory()->create(['referrer_id' => 42]);
        $this->postSigned('api.orders.update-by-webhook', $this->orderPayload(42))->assertOk();

        $this->postSigned('api.orders.update-by-webhook', $this->orderPayload(42, 'pending', 'Alice Renamed'))
            ->assertOk();

        $this->assertSame(1, Patient::where('server_id', 5001)->count());
        $this->assertDatabaseHas('patients', ['server_id' => 5001, 'fullName' => 'Alice Renamed']);
    }
}
