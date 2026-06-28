<?php

namespace Tests\Feature\Logistic;

use App\Enums\CollectRequestStatus;
use App\Enums\OrderStatus;
use App\Enums\OrderStep;
use App\Exceptions\ApiServiceException;
use App\Models\CollectRequest;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Patient;
use App\Models\Sample;
use App\Models\SampleType;
use App\Models\Test;
use App\Models\User;
use App\Services\RequestLogistic;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

/**
 * Characterization tests for the (previously untested) logistic submission to
 * the main server. They pin both the entry-guard validation and the shape of
 * the multipart payload built from a collect request's order graph, so the
 * service can be refactored without silently changing what the main server
 * receives.
 */
class RequestLogisticTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        // Skip the token-fetch round trip: RequestLogistic reads the cached,
        // encrypted Sanctum token via ApiService::getApiToken().
        Cache::put('api_sanctum_token', encrypt('test-token'), now()->addHour());
    }

    public function test_it_rejects_a_request_whose_user_has_no_referrer_id(): void
    {
        $user = User::factory()->create(['referrer_id' => null]);
        $collectRequest = CollectRequest::create([
            'user_id' => $user->id,
            'status' => CollectRequestStatus::REQUESTED,
            'details' => [],
        ]);

        $this->expectException(ApiServiceException::class);
        $this->expectExceptionMessage('referrer_id is missing');

        RequestLogistic::send($collectRequest);
    }

    public function test_it_rejects_a_request_with_no_orders(): void
    {
        $user = User::factory()->create(['referrer_id' => 7]);
        $collectRequest = CollectRequest::create([
            'user_id' => $user->id,
            'status' => CollectRequestStatus::REQUESTED,
            'details' => [],
        ]);

        $this->expectException(ApiServiceException::class);
        $this->expectExceptionMessage('has no orders');

        RequestLogistic::send($collectRequest);
    }

    public function test_it_sends_the_order_graph_and_records_the_server_id(): void
    {
        Http::fake(['*' => Http::response(['id' => 999], 200)]);

        [$collectRequest, $expected] = $this->buildSendableCollectRequest();

        $response = RequestLogistic::send($collectRequest);

        $this->assertTrue($response->successful());
        // The main server's id for the collect request is persisted back.
        $this->assertSame(999, $collectRequest->refresh()->server_id);

        // Inspect the JSON `data` part of the multipart body.
        $payload = $this->capturedDataPayload();

        $this->assertSame($collectRequest->id, $payload['id']);
        $this->assertSame(7, $payload['user']['referrer_id']);
        $this->assertCount(1, $payload['orders']);

        $order = array_values($payload['orders'])[0];
        $this->assertSame($expected['orderId'], $order['id']);
        $this->assertSame($expected['patientName'], $order['patient']['fullName']);
        $this->assertCount(1, $order['orderItems']);

        $item = $order['orderItems'][0];
        $this->assertSame($expected['testServerId'], $item['test_id']);
        $this->assertCount(1, $item['samples']);
        $this->assertSame($expected['sampleTypeServerId'], $item['samples'][0]['sample_type_id']);
        // is_main comes straight off the pivot (uncast), so it serializes as 1.
        $this->assertEquals(1, $item['patients'][0]['is_main']);
    }

    public function test_it_throws_when_a_test_is_missing_its_server_id(): void
    {
        [$collectRequest] = $this->buildSendableCollectRequest(testServerId: null);

        $this->expectException(ApiServiceException::class);
        $this->expectExceptionMessage('has no server_id');

        RequestLogistic::send($collectRequest);
    }

    /**
     * Build a complete, sendable collect request: one order with a patient, a
     * test (with server_id), an order item, and a sample tagged to the request.
     *
     * @return array{0: CollectRequest, 1: array<string, mixed>}
     */
    private function buildSendableCollectRequest(?int $testServerId = 101): array
    {
        $user = User::factory()->create(['referrer_id' => 7]);
        $patient = Patient::create([
            'user_id' => $user->id,
            'fullName' => 'Logistic Patient',
            'nationality' => 'IR',
            'dateOfBirth' => '1990-01-01',
            'gender' => '1',
            'consanguineousParents' => '0',
        ]);

        $collectRequest = CollectRequest::create([
            'user_id' => $user->id,
            'status' => CollectRequestStatus::REQUESTED,
            'details' => ['address' => '1 Main St', 'phone' => '123'],
            'preferred_date' => '2026-07-01',
        ]);

        $order = Order::create([
            'user_id' => $user->id,
            'main_patient_id' => $patient->id,
            'patient_ids' => [$patient->id],
            'status' => OrderStatus::REQUESTED,
            'step' => OrderStep::FINALIZE,
        ]);

        $test = Test::factory()->create(['server_id' => $testServerId]);
        $orderItem = OrderItem::create(['order_id' => $order->id, 'test_id' => $test->id]);

        $sampleType = SampleType::create(['name' => 'Blood', 'server_id' => 55, 'sample_id_required' => false]);
        $sample = Sample::create([
            'sample_type_id' => $sampleType->id,
            'collect_request_id' => $collectRequest->id,
            'patient_id' => $patient->id,
            'collectionDate' => '2026-06-15',
            'pooling' => false,
        ]);

        $orderItem->Samples()->attach($sample->id);
        $orderItem->Patients()->attach($patient->id, ['is_main' => true]);

        return [$collectRequest, [
            'orderId' => $order->id,
            'patientName' => 'Logistic Patient',
            'testServerId' => $testServerId,
            'sampleTypeServerId' => 55,
        ]];
    }

    /**
     * Decode the JSON `data` part attached to the multipart logistic request.
     *
     * @return array<string, mixed>
     */
    private function capturedDataPayload(): array
    {
        $payload = [];

        Http::assertSent(function (Request $request) use (&$payload) {
            foreach ($request->data() as $part) {
                if (($part['name'] ?? null) === 'data') {
                    $payload = json_decode($part['contents'], true);
                }
            }

            return true;
        });

        return $payload;
    }
}
