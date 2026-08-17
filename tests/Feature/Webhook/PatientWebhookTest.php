<?php

namespace Tests\Feature\Webhook;

use App\Models\Order;
use App\Models\Patient;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Coverage for the patient sync webhook, which links a patient (or relative)
 * added to a referrer order on the main server to the local order.
 *
 * The main server used to send its own "OR.<Ymd>.<id>" key here, which this
 * endpoint validates as an integer and so rejected outright; these tests pin
 * the numeric contract and the order resolution that replaced it.
 */
class PatientWebhookTest extends TestCase
{
    use RefreshDatabase;

    private const SECRET = 'test-webhook-secret';

    protected function setUp(): void
    {
        parent::setUp();
        config(['webhook.secret' => self::SECRET]);
    }

    /**
     * @param  array<string, mixed>  $overrides
     * @return array<string, mixed>
     */
    private function payload(int $referrerId, array $overrides = []): array
    {
        return [
            'referrer_id' => $referrerId,
            'patient' => [
                'id' => 7001,
                'fullName' => 'Bob Relative',
                'nationality' => 'IR',
                'dateOfBirth' => '1985-05-05',
                'gender' => 1,
                'idNo' => 'ID-7001',
                'is_main' => false,
            ],
            ...$overrides,
        ];
    }

    private function postSigned(array $payload)
    {
        $body = json_encode($payload);

        return $this->call(
            'POST',
            route('api.patients.update-by-webhook'),
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

    public function test_it_links_the_patient_to_the_order_matched_by_acceptance_id(): void
    {
        $user = User::factory()->create(['referrer_id' => 42]);
        $order = Order::factory()->create(['user_id' => $user->id, 'server_id' => 1001]);

        $this->postSigned($this->payload(42, ['acceptance_id' => 1001]))
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('order_id', $order->id);

        $patient = Patient::where('server_id', 7001)->firstOrFail();
        $this->assertSame([$patient->id], $order->fresh()->patient_ids);
    }

    /**
     * An order that has not been stamped with its acceptance id yet is still
     * reachable by the provider's own order id.
     */
    public function test_it_falls_back_to_the_providers_own_order_id(): void
    {
        $user = User::factory()->create(['referrer_id' => 42]);
        $order = Order::factory()->create(['user_id' => $user->id, 'server_id' => null]);

        $this->postSigned($this->payload(42, ['order_id' => $order->id]))
            ->assertOk()
            ->assertJsonPath('order_id', $order->id);

        $patient = Patient::where('server_id', 7001)->firstOrFail();
        $this->assertSame([$patient->id], $order->fresh()->patient_ids);
    }

    /**
     * The acceptance id is the more reliable key, so it wins when both are sent
     * and disagree -- the local id may be stale.
     */
    public function test_the_acceptance_id_wins_over_the_order_id(): void
    {
        $user = User::factory()->create(['referrer_id' => 42]);
        $stale = Order::factory()->create(['user_id' => $user->id, 'server_id' => null]);
        $current = Order::factory()->create(['user_id' => $user->id, 'server_id' => 1001]);

        $this->postSigned($this->payload(42, ['acceptance_id' => 1001, 'order_id' => $stale->id]))
            ->assertOk()
            ->assertJsonPath('order_id', $current->id);

        $this->assertSame([], $stale->fresh()->patient_ids);
    }

    public function test_it_promotes_the_patient_to_main_when_flagged(): void
    {
        $user = User::factory()->create(['referrer_id' => 42]);
        $order = Order::factory()->create(['user_id' => $user->id, 'server_id' => 1001]);

        $payload = $this->payload(42, ['acceptance_id' => 1001]);
        $payload['patient']['is_main'] = true;

        $this->postSigned($payload)->assertOk();

        $patient = Patient::where('server_id', 7001)->firstOrFail();
        $this->assertSame($patient->id, $order->fresh()->main_patient_id);
    }

    /**
     * A patient sync must never reach across tenants: an order belonging to a
     * different referrer is left untouched.
     */
    public function test_it_does_not_link_an_order_owned_by_another_referrer(): void
    {
        User::factory()->create(['referrer_id' => 42]);
        $other = User::factory()->create(['referrer_id' => 43]);
        $order = Order::factory()->create(['user_id' => $other->id, 'server_id' => 1001]);

        $this->postSigned($this->payload(42, ['acceptance_id' => 1001]))
            ->assertOk()
            ->assertJsonPath('order_id', null);

        $this->assertSame([], $order->fresh()->patient_ids);
        // The patient itself is still upserted, for the referrer it was sent for.
        $this->assertDatabaseHas('patients', ['server_id' => 7001]);
    }

    /**
     * The patient can reach the provider before its order does; the upsert
     * stands and the later order webhook carries the patient itself.
     */
    public function test_it_upserts_the_patient_when_the_order_has_not_synced_yet(): void
    {
        $user = User::factory()->create(['referrer_id' => 42]);

        $this->postSigned($this->payload(42, ['acceptance_id' => 1001]))
            ->assertOk()
            ->assertJsonPath('order_id', null);

        $this->assertDatabaseHas('patients', [
            'server_id' => 7001,
            'fullName' => 'Bob Relative',
            'user_id' => $user->id,
        ]);
    }
}
