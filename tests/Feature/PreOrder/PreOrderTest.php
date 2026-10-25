<?php

namespace Tests\Feature\PreOrder;

use App\Enums\OrderStatus;
use App\Models\Order;
use App\Models\Patient;
use App\Models\PreOrder;
use App\Models\PreOrderAction;
use App\Models\Test;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\Request as HttpRequest;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

/**
 * Pre-orders on the panel: a mirror of the LIS snapshot (signed webhook), center actions sent to
 * the api app, released lines turned into pending orders, and the order wizard keeping
 * pre-order tests out.
 */
class PreOrderTest extends TestCase
{
    use RefreshDatabase;

    private const SECRET = 'test-webhook-secret';

    private User $center;

    protected function setUp(): void
    {
        parent::setUp();
        config(['webhook.secret' => self::SECRET]);
        Cache::put('api_sanctum_token', encrypt('test-token'));
        Http::preventStrayRequests();
        $this->center = $this->provider(['referrer_id' => 77]);
    }

    private function provider(array $attributes = []): User
    {
        $user = User::factory()->create($attributes);
        $role = Role::findOrCreate(User::PROVIDER_ROLE);
        foreach (User::PROVIDER_PERMISSIONS as $permission) {
            Permission::findOrCreate($permission);
        }
        $role->syncPermissions(User::PROVIDER_PERMISSIONS);
        $user->assignRole($role);

        return $user;
    }

    private function signed(string $uri, array $body)
    {
        $raw = json_encode($body);

        return $this->call('POST', $uri, [], [], [], [
            'CONTENT_TYPE' => 'application/json',
            'HTTP_X_WEBHOOK_SIGNATURE' => hash_hmac('sha256', $raw, self::SECRET),
        ], $raw);
    }

    private function snapshot(array $overrides = []): array
    {
        return array_merge([
            'id' => 501,
            'code' => 'PO-26-0501',
            'version' => 2,
            'referrer_id' => 77,
            'stage' => ['code' => 'UNDER_REVIEW', 'label' => 'BION review', 'next_action' => 'BION is reviewing', 'owner' => 'bion'],
            'exception' => null,
            'progress' => [['code' => 'SUBMITTED', 'label' => 'Submitted', 'done' => true, 'current' => false], ['code' => 'UNDER_REVIEW', 'label' => 'BION review', 'done' => false, 'current' => true]],
            'patients' => [['ref' => '1', 'fullName' => 'Invented Mother']],
            'main_patient_ref' => '1',
            'main_test' => null,
            'items' => [],
            'requests' => [],
            'orders_to_place' => [],
            'history' => [],
            'closed_at' => null,
        ], $overrides);
    }

    private function upsert(array $snapshot)
    {
        return $this->signed('/api/webhooks/pre-orders/upsert', $snapshot);
    }

    public function test_the_snapshot_webhook_needs_a_valid_signature(): void
    {
        $this->call('POST', '/api/webhooks/pre-orders/upsert', [], [], [], [
            'CONTENT_TYPE' => 'application/json',
            'HTTP_X_WEBHOOK_SIGNATURE' => 'forged',
        ], json_encode($this->snapshot()))->assertUnauthorized();

        $this->assertSame(0, PreOrder::count());
    }

    public function test_a_snapshot_is_mirrored_and_an_older_one_never_replaces_it(): void
    {
        $this->upsert($this->snapshot(['version' => 3]))->assertOk()->assertJson(['applied' => true]);
        $this->upsert($this->snapshot(['version' => 2, 'stage' => ['code' => 'SUBMITTED', 'owner' => 'bion']]))
            ->assertOk()->assertJson(['applied' => false]);

        $preOrder = PreOrder::where('server_id', 501)->firstOrFail();
        $this->assertSame($this->center->id, $preOrder->user_id);
        $this->assertSame('UNDER_REVIEW', $preOrder->stage);
        $this->assertSame(3, $preOrder->version);
    }

    public function test_a_released_group_becomes_one_pending_order_with_its_tests_and_patients(): void
    {
        $mother = Patient::factory()->create(['user_id' => $this->center->id]);
        $father = Patient::factory()->create(['user_id' => $this->center->id]);
        $foreign = Patient::factory()->create();
        $nipt = Test::factory()->create(['server_id' => 9001, 'flow_id' => 3]);
        $karyo = Test::factory()->create(['server_id' => 9002, 'flow_id' => 3]);

        $snapshot = $this->snapshot([
            'main_patient_ref' => (string) $mother->id,
            'orders_to_place' => [[
                'release_key' => 'PO-26-0501-M1',
                'purpose' => 'main',
                'items' => [
                    ['test_id' => 9001, 'patient_ref' => (string) $mother->id, 'qty' => 1],
                    ['test_id' => 9002, 'patient_ref' => (string) $father->id, 'qty' => 1],
                ],
            ], [
                // A patient that isn't this center's is never used.
                'release_key' => 'PO-26-0501-M2',
                'purpose' => 'main',
                'items' => [['test_id' => 9001, 'patient_ref' => (string) $foreign->id, 'qty' => 1]],
            ]],
        ]);
        $this->upsert($snapshot)->assertOk();
        $this->upsert([...$snapshot, 'version' => 3])->assertOk();

        $orders = Order::where('pre_order_release_key', 'PO-26-0501-M1')->get();
        $this->assertCount(1, $orders, 'placed once per release key');
        $order = $orders->first();
        $this->assertSame(OrderStatus::PENDING, $order->status);
        $this->assertSame($this->center->id, $order->user_id);
        $this->assertSame($mother->id, $order->main_patient_id);
        $this->assertEqualsCanonicalizing([$nipt->id, $karyo->id], $order->Tests()->pluck('tests.id')->all());
        $this->assertSame([$father->id], $order->OrderItems()->where('test_id', $karyo->id)->first()->Patients()->pluck('patients.id')->all());
        $this->assertSame(0, Order::where('pre_order_release_key', 'PO-26-0501-M2')->count());
    }

    public function test_creating_a_pre_order_sends_it_to_the_api_with_the_panel_patient_ids_as_refs(): void
    {
        Http::fake(['*' => Http::response(['status' => 'pending'], 202)]);
        $test = Test::factory()->create(['server_id' => 9001, 'flow_id' => 3, 'is_active' => true]);
        $this->center->Tests()->attach($test->id);

        $this->actingAs($this->center)->post(route('preOrders.store'), [
            'start_mode' => 'tests',
            'patients' => [['fullName' => 'Invented Mother', 'gender' => '0', 'dateOfBirth' => '1990-05-01', 'nationality' => ['code' => 'OM'], 'relationship' => 'self']],
            'tests' => [['id' => $test->id]],
        ])->assertRedirect(route('preOrders.index'))->assertSessionHasNoErrors();

        $patient = Patient::where('user_id', $this->center->id)->firstOrFail();
        $action = PreOrderAction::firstOrFail();
        Http::assertSent(function (HttpRequest $request) use ($patient, $action) {
            $body = json_decode($request->body(), true);

            return str_ends_with($request->url(), 'pre-orders/77')
                && $body['id'] === $action->uuid
                && $body['payload']['patients'][0]['ref'] === (string) $patient->id
                && $body['payload']['patients'][0]['gender'] === 'female'
                && $body['payload']['tests'][0]['test_id'] === 9001
                && $body['payload']['submit'] === true;
        });
    }

    public function test_a_test_not_switched_on_for_pre_orders_cannot_start_one(): void
    {
        $direct = Test::factory()->create(['is_active' => true]);
        $this->center->Tests()->attach($direct->id);

        $this->actingAs($this->center)->post(route('preOrders.store'), [
            'start_mode' => 'tests',
            'patients' => [['fullName' => 'X', 'gender' => '1', 'dateOfBirth' => '1990-05-01', 'nationality' => ['code' => 'OM']]],
            'tests' => [['id' => $direct->id]],
        ])->assertSessionHasErrors('tests.0.id');

        $this->assertSame(0, PreOrderAction::count());
    }

    public function test_a_center_cannot_see_or_act_on_another_centers_pre_order(): void
    {
        $this->upsert($this->snapshot())->assertOk();
        $preOrder = PreOrder::firstOrFail();
        $other = $this->provider(['referrer_id' => 88]);

        $this->actingAs($other)->get(route('preOrders.show', $preOrder))->assertForbidden();
        $this->actingAs($other)->post(route('preOrders.message', $preOrder), ['body' => 'hi'])->assertForbidden();
        $this->actingAs($this->center)->get(route('preOrders.show', $preOrder))->assertOk();
    }

    public function test_an_answer_goes_to_the_api_and_the_result_webhook_settles_it(): void
    {
        Http::fake(['*' => Http::response(['status' => 'pending'], 202)]);
        $this->upsert($this->snapshot())->assertOk();
        $preOrder = PreOrder::firstOrFail();

        $this->actingAs($this->center)
            ->post(route('preOrders.answer', $preOrder), ['request' => 1, 'answer' => 'Pedigree uploaded'])
            ->assertSessionHasNoErrors();

        $action = PreOrderAction::firstOrFail();
        Http::assertSent(fn (HttpRequest $r) => str_ends_with($r->url(), 'pre-orders/77/501/actions') && $r['type'] === 'answer_request');

        $this->signed('/api/webhooks/pre-orders/action-result', ['action_id' => $action->uuid, 'ok' => false, 'error' => 'Request R1 is closed.', 'pre_order_id' => 501])->assertOk();
        $this->assertSame(PreOrderAction::FAILED, $action->refresh()->status);
        $this->assertSame('Request R1 is closed.', $action->error);
    }

    public function test_an_unreachable_api_is_reported_to_the_user(): void
    {
        Http::fake(['*' => Http::response('down', 503)]);
        $this->upsert($this->snapshot())->assertOk();

        $this->actingAs($this->center)
            ->post(route('preOrders.message', PreOrder::firstOrFail()), ['body' => 'Any news?'])
            ->assertSessionHasErrors('action');
        $this->assertSame(PreOrderAction::FAILED, PreOrderAction::firstOrFail()->status);
    }

    public function test_the_order_wizard_hides_and_refuses_pre_order_tests(): void
    {
        $direct = Test::factory()->create(['is_active' => true]);
        $preorder = Test::factory()->create(['is_active' => true, 'flow_id' => 3]);
        $this->center->Tests()->attach([$direct->id, $preorder->id]);

        $ids = collect($this->actingAs($this->center)->getJson(route('api.user.tests.list'))->assertOk()->json('data'))->pluck('id');
        $this->assertTrue($ids->contains($direct->id));
        $this->assertFalse($ids->contains($preorder->id));

        $this->actingAs($this->center)
            ->post(route('orders.store'), ['tests' => [['id' => $preorder->id]]])
            ->assertSessionHasErrors('tests.0.id');
    }

    public function test_the_tests_of_an_order_placed_from_a_pre_order_cannot_be_changed(): void
    {
        $this->upsert($this->snapshot())->assertOk();
        $order = Order::factory()->create(['user_id' => $this->center->id, 'pre_order_id' => PreOrder::firstOrFail()->id, 'pre_order_release_key' => 'PO-26-0501-M1', 'status' => OrderStatus::PENDING]);
        $direct = Test::factory()->create(['is_active' => true]);

        $this->actingAs($this->center)
            ->put(route('orders.update', ['order' => $order, 'step' => 'test method']), ['tests' => [['id' => $direct->id]]])
            ->assertSessionHasErrors('tests');
    }

    private function pdf(string $name = 'pedigree.pdf'): UploadedFile
    {
        return UploadedFile::fake()->createWithContent($name, "%PDF-1.4\n1 0 obj\n<< >>\nendobj\n%%EOF\n");
    }

    private function withOpenRequest(): PreOrder
    {
        $this->upsert($this->snapshot([
            'stage' => ['code' => 'AWAITING_INFO', 'owner' => 'center'],
            'requests' => [['number' => 1, 'label' => 'R1 · Information', 'status' => 'open', 'message' => 'Pedigree please']],
            'documents' => [['hash' => '1b4e28ba-2fa1-11d2-883f-0016d3cca427', 'name' => 'scan.pdf', 'tag' => 'MEDICAL_HISTORY']],
        ]))->assertOk();

        return PreOrder::firstOrFail();
    }

    public function test_a_file_is_sent_to_the_api_as_multipart_with_its_action_id(): void
    {
        Http::fake(['*' => Http::response(['status' => 'pending'], 202)]);
        $preOrder = $this->withOpenRequest();

        $this->actingAs($this->center)
            ->post(route('preOrders.documents.store', $preOrder), ['file' => $this->pdf(), 'tag' => 'MEDICAL_HISTORY', 'request' => 1])
            ->assertSessionHasNoErrors();

        $action = PreOrderAction::where('type', 'upload_document')->firstOrFail();
        Http::assertSent(fn (HttpRequest $r) => str_ends_with($r->url(), 'pre-orders/77/501/documents')
            && $r->isMultipart()
            && collect($r->data())->contains(fn ($part) => $part['name'] === 'id' && $part['contents'] === $action->uuid)
            && collect($r->data())->contains(fn ($part) => $part['name'] === 'file' && $part['filename'] === 'pedigree.pdf'));
    }

    public function test_only_pdf_png_and_jpeg_leave_the_panel(): void
    {
        Http::fake();
        $preOrder = $this->withOpenRequest();
        // A real file, not UploadedFile::fake(): the fake reports a type from its name, a real
        // upload is typed from its bytes.
        $path = (string) tempnam(sys_get_temp_dir(), 'svg');
        file_put_contents($path, '<svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)"/>');
        $svg = new UploadedFile($path, 'scan.png', null, null, true);

        $this->actingAs($this->center)
            ->post(route('preOrders.documents.store', $preOrder), ['file' => $svg, 'tag' => 'DOCUMENT'])
            ->assertSessionHasErrors('file');
        $this->actingAs($this->center)
            ->post(route('preOrders.documents.store', $preOrder), ['file' => $this->pdf(), 'tag' => 'DOCUMENT', 'request' => 9])
            ->assertSessionHasErrors('request');

        Http::assertNothingSent();
        $this->assertSame(0, PreOrderAction::count());
    }

    public function test_a_file_refused_by_the_api_is_reported(): void
    {
        Http::fake(['*' => Http::response(['errors' => ['file' => ['x']]], 422)]);
        $preOrder = $this->withOpenRequest();

        $this->actingAs($this->center)
            ->post(route('preOrders.documents.store', $preOrder), ['file' => $this->pdf(), 'tag' => 'DOCUMENT'])
            ->assertSessionHasErrors(['file' => 'The file was not accepted. Only PDF, PNG and JPEG files up to 20 MB can be sent.']);
        $this->assertSame(PreOrderAction::FAILED, PreOrderAction::firstOrFail()->status);
    }

    public function test_a_center_downloads_only_files_listed_on_its_pre_order_with_safe_headers(): void
    {
        $preOrder = $this->withOpenRequest();
        $hash = '1b4e28ba-2fa1-11d2-883f-0016d3cca427';
        Http::fake(['*documents/'.$hash => Http::response("%PDF-1.4\n%%EOF\n", 200)]);

        $this->actingAs($this->center)
            ->get(route('preOrders.documents.show', [$preOrder, '9b4e28ba-2fa1-11d2-883f-0016d3cca427']))
            ->assertNotFound();
        $this->actingAs($this->provider(['referrer_id' => 88]))
            ->get(route('preOrders.documents.show', [$preOrder, $hash]))
            ->assertForbidden();

        $this->actingAs($this->center)
            ->get(route('preOrders.documents.show', [$preOrder, $hash]))
            ->assertOk()
            ->assertHeader('Content-Type', 'application/pdf')
            ->assertHeader('X-Content-Type-Options', 'nosniff');
    }

    public function test_a_stored_file_that_is_not_pdf_or_an_image_is_only_ever_a_download(): void
    {
        $preOrder = $this->withOpenRequest();
        Http::fake(['*' => Http::response('<html><script>alert(1)</script></html>', 200)]);

        $response = $this->actingAs($this->center)
            ->get(route('preOrders.documents.show', [$preOrder, '1b4e28ba-2fa1-11d2-883f-0016d3cca427']))
            ->assertOk()
            ->assertHeader('Content-Type', 'application/octet-stream');
        $this->assertStringStartsWith('attachment', (string) $response->headers->get('Content-Disposition'));
        $this->assertStringContainsString('sandbox', (string) $response->headers->get('Content-Security-Policy'));
    }
}
