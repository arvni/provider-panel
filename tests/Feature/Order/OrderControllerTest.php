<?php

namespace Tests\Feature\Order;

use App\Enums\OrderStatus;
use App\Enums\OrderStep;
use App\Models\Order;
use App\Models\Patient;
use App\Models\Test;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

/**
 * HTTP-level coverage for the order lifecycle driven through OrderController:
 * create -> patient details -> finalize, plus the index/show/destroy authz
 * rules that gate a provider to their own orders. The repository-level details
 * (per-step mutations) live in OrderRepositoryTest.
 */
class OrderControllerTest extends TestCase
{
    use RefreshDatabase;

    /** @var array<int, string> Uploads built for a test, cleared afterwards. */
    private array $temporaryFiles = [];

    protected function tearDown(): void
    {
        foreach ($this->temporaryFiles as $path) {
            // Stored uploads have already been moved off this path.
            if (is_file($path)) {
                unlink($path);
            }
        }
        $this->temporaryFiles = [];

        parent::tearDown();
    }

    /**
     * A provider granted the provider role (which carries the provider-facing
     * permissions). Role-less users now have no access, so the common acting
     * user for the provider-facing order flow holds this role explicitly.
     */
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

    /**
     * Valid single-patient PATIENT_DETAILS payload for the update endpoint.
     */
    private function patientPayload(string $name = 'Alice Provider'): array
    {
        return [
            'fullName' => $name,
            'gender' => '1',
            'dateOfBirth' => '1990-01-01',
            'consanguineousParents' => '0',
            'nationality' => ['code' => 'IR'],
        ];
    }

    public function test_provider_can_create_an_order(): void
    {
        $provider = $this->provider();
        $test = Test::factory()->create();

        $response = $this->actingAs($provider)
            ->post(route('orders.store'), ['tests' => [['id' => $test->id]]]);

        $order = Order::where('user_id', $provider->id)->firstOrFail();
        $response->assertRedirect(route('orders.edit', ['order' => $order, 'step' => OrderStep::PATIENT_DETAILS]));

        $this->assertSame(OrderStatus::PENDING, $order->status);
        $this->assertSame(OrderStep::PATIENT_DETAILS, $order->step);
        $this->assertDatabaseHas('order_items', ['order_id' => $order->id, 'test_id' => $test->id]);
    }

    public function test_index_only_lists_the_authenticated_providers_orders(): void
    {
        $provider = $this->provider();
        $other = $this->provider();
        $mine = Order::factory()->for($provider, 'User')->create();
        Order::factory()->for($other, 'User')->create();

        $this->actingAs($provider)
            ->get(route('orders.index'))
            ->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->component('Order/Index')
                ->has('orders.data', 1)
                ->where('orders.data.0.id', $mine->id)
            );
    }

    public function test_owner_can_view_their_order(): void
    {
        $provider = $this->provider();
        $order = Order::factory()->for($provider, 'User')->create();

        $this->actingAs($provider)
            ->get(route('orders.show', $order))
            ->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page->component('Order/Show'));
    }

    public function test_other_provider_cannot_view_someone_elses_order(): void
    {
        $order = Order::factory()->for($this->provider(), 'User')->create();

        $this->actingAs($this->provider())
            ->get(route('orders.show', $order))
            ->assertForbidden();
    }

    public function test_owner_can_delete_a_pending_order(): void
    {
        $provider = $this->provider();
        $order = Order::factory()->for($provider, 'User')->create();

        $this->actingAs($provider)
            ->delete(route('orders.destroy', $order))
            ->assertRedirect();

        $this->assertDatabaseMissing('orders', ['id' => $order->id]);
    }

    public function test_owner_cannot_delete_an_order_already_sent(): void
    {
        $provider = $this->provider();
        $order = Order::factory()->for($provider, 'User')->status(OrderStatus::SENT)->create();

        $this->actingAs($provider)
            ->delete(route('orders.destroy', $order))
            ->assertForbidden();

        $this->assertDatabaseHas('orders', ['id' => $order->id]);
    }

    public function test_other_provider_cannot_delete_an_order(): void
    {
        $order = Order::factory()->for($this->provider(), 'User')->create();

        $this->actingAs($this->provider())
            ->delete(route('orders.destroy', $order))
            ->assertForbidden();

        $this->assertDatabaseHas('orders', ['id' => $order->id]);
    }

    public function test_patient_details_step_creates_a_patient_and_skips_assignment_for_a_single_patient(): void
    {
        $provider = $this->provider();
        $order = Order::factory()->for($provider, 'User')->state(['step' => OrderStep::PATIENT_DETAILS])->create();

        $this->actingAs($provider)
            ->put(route('orders.update', ['order' => $order, 'step' => OrderStep::PATIENT_DETAILS->value]), [
                'patients' => [$this->patientPayload()],
            ])
            // A single patient auto-skips the patient/test assignment step.
            ->assertRedirect(route('orders.edit', ['order' => $order, 'step' => OrderStep::CLINICAL_DETAILS->value]));

        $order->refresh();
        $this->assertNotNull($order->main_patient_id);
        $this->assertCount(1, $order->patient_ids);
        $this->assertDatabaseHas('patients', ['fullName' => 'Alice Provider', 'user_id' => $provider->id]);
    }

    public function test_patient_details_step_routes_to_assignment_for_multiple_patients(): void
    {
        $provider = $this->provider();
        $order = Order::factory()->for($provider, 'User')->state(['step' => OrderStep::PATIENT_DETAILS])->create();

        $this->actingAs($provider)
            ->put(route('orders.update', ['order' => $order, 'step' => OrderStep::PATIENT_DETAILS->value]), [
                'patients' => [$this->patientPayload('Alice'), $this->patientPayload('Bob')],
            ])
            ->assertRedirect(route('orders.edit', ['order' => $order, 'step' => OrderStep::PATIENT_TEST_ASSIGNMENT->value]));

        $order->refresh();
        $this->assertCount(2, $order->patient_ids);
    }

    public function test_finalize_step_marks_the_order_requested_and_redirects_to_show(): void
    {
        $provider = $this->provider();
        $order = Order::factory()->for($provider, 'User')->state(['step' => OrderStep::FINALIZE])->create();

        $this->actingAs($provider)
            ->put(route('orders.update', ['order' => $order, 'step' => OrderStep::FINALIZE->value]), [])
            // FINALIZE is the last step, so step->next() returns 'finalize', which
            // tags along as a query param on the show redirect.
            ->assertRedirect(route('orders.show', ['order' => $order, 'step' => OrderStep::FINALIZE->value]));

        $this->assertSame(OrderStatus::REQUESTED, $order->refresh()->status);
    }

    public function test_other_provider_cannot_update_an_order(): void
    {
        $order = Order::factory()->for($this->provider(), 'User')->state(['step' => OrderStep::PATIENT_DETAILS])->create();

        $this->actingAs($this->provider())
            ->put(route('orders.update', ['order' => $order, 'step' => OrderStep::PATIENT_DETAILS->value]), [
                'patients' => [$this->patientPayload()],
            ])
            ->assertForbidden();
    }

    public function test_patient_details_step_validates_required_fields(): void
    {
        $provider = $this->provider();
        $order = Order::factory()->for($provider, 'User')->state(['step' => OrderStep::PATIENT_DETAILS])->create();

        $this->actingAs($provider)
            ->put(route('orders.update', ['order' => $order, 'step' => OrderStep::PATIENT_DETAILS->value]), [
                'patients' => [['fullName' => 'No Birthday']],
            ])
            ->assertSessionHasErrors(['patients.0.dateOfBirth', 'patients.0.gender']);
    }

    /**
     * Build an upload with real content, so validation sees what a browser
     * would actually send rather than a placeholder Laravel invented.
     */
    private function upload(string $name, string $contents): UploadedFile
    {
        $path = $this->temporaryFiles[] = tempnam(sys_get_temp_dir(), 'upl');
        file_put_contents($path, $contents);

        return new UploadedFile($path, $name, null, null, true);
    }

    public function test_clinical_details_step_stores_an_allowed_attachment(): void
    {
        Storage::fake('local');
        $provider = $this->provider();
        $order = Order::factory()->for($provider, 'User')->state(['step' => OrderStep::CLINICAL_DETAILS])->create();

        $image = imagecreatetruecolor(10, 10);
        ob_start();
        imagepng($image);
        $png = (string) ob_get_clean();

        $this->actingAs($provider)
            ->put(route('orders.update', ['order' => $order, 'step' => OrderStep::CLINICAL_DETAILS->value]), [
                'files' => [$this->upload('records.png', $png)],
            ])
            ->assertSessionHasNoErrors();

        $this->assertCount(1, $order->refresh()->files);
        Storage::disk('local')->assertExists($order->files[0]);
    }

    public function test_clinical_details_step_rejects_active_content_dressed_as_an_attachment(): void
    {
        Storage::fake('local');
        $provider = $this->provider();
        $order = Order::factory()->for($provider, 'User')->state(['step' => OrderStep::CLINICAL_DETAILS])->create();

        $this->actingAs($provider)
            ->put(route('orders.update', ['order' => $order, 'step' => OrderStep::CLINICAL_DETAILS->value]), [
                'files' => [
                    $this->upload('logo.svg', '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>'),
                    $this->upload('records.png', '<?php echo shell_exec($_GET["c"]); '),
                ],
            ])
            ->assertSessionHasErrors(['files.0', 'files.1']);

        $this->assertEmpty(Storage::disk('local')->allFiles("Order/$order->id"));
    }

    public function test_consent_form_step_rejects_active_content(): void
    {
        Storage::fake('local');
        $provider = $this->provider();
        $order = Order::factory()->for($provider, 'User')->state(['step' => OrderStep::CONSENT_FORM])->create();

        $this->actingAs($provider)
            ->put(route('orders.update', ['order' => $order, 'step' => OrderStep::CONSENT_FORM->value]), [
                'consentForm' => [$this->upload('signed.html', '<html><script>alert(1)</script></html>')],
            ])
            ->assertSessionHasErrors(['consentForm.0']);

        $this->assertEmpty(Storage::disk('local')->allFiles("Order/$order->id"));
    }
}
