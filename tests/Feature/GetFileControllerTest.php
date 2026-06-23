<?php

namespace Tests\Feature;

use App\Models\Consent;
use App\Models\Order;
use App\Models\User;
use Database\Seeders\RoleAndPermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\File;
use Tests\TestCase;

class GetFileControllerTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Relative paths (under storage/app) created during a test so they can be
     * removed afterwards without touching real application files.
     */
    private array $createdPaths = [];

    protected function tearDown(): void
    {
        foreach ($this->createdPaths as $relative) {
            $full = storage_path("app/" . $relative);
            if (File::exists($full)) {
                File::delete($full);
            }
        }

        parent::tearDown();
    }

    private function makeFile(string $relativePath): void
    {
        $full = storage_path("app/" . $relativePath);
        File::ensureDirectoryExists(dirname($full));
        File::put($full, "test-content");
        $this->createdPaths[] = $relativePath;
    }

    public function test_guests_are_redirected_to_login(): void
    {
        $owner = User::factory()->create();
        $order = Order::create(["user_id" => $owner->id]);

        $response = $this->get(route("file", ["type" => "order", "id" => $order->id, "filename" => "report.pdf"]));

        $response->assertRedirect(route("login"));
    }

    public function test_owner_can_download_their_order_file(): void
    {
        $owner = User::factory()->create();
        $order = Order::create(["user_id" => $owner->id]);
        $this->makeFile("order/{$order->id}/report.pdf");

        $response = $this->actingAs($owner)
            ->get(route("file", ["type" => "order", "id" => $order->id, "filename" => "report.pdf"]));

        $response->assertOk();
    }

    public function test_other_provider_cannot_download_another_users_order_file(): void
    {
        $owner = User::factory()->create();
        $intruder = User::factory()->create();
        $order = Order::create(["user_id" => $owner->id]);
        $this->makeFile("order/{$order->id}/report.pdf");

        $response = $this->actingAs($intruder)
            ->get(route("file", ["type" => "order", "id" => $order->id, "filename" => "report.pdf"]));

        $response->assertForbidden();
    }

    public function test_admin_can_download_any_order_file(): void
    {
        $this->seed(RoleAndPermissionSeeder::class);
        $owner = User::factory()->create();
        $admin = User::factory()->admin()->create();
        $order = Order::create(["user_id" => $owner->id]);
        $this->makeFile("order/{$order->id}/report.pdf");

        $response = $this->actingAs($admin)
            ->get(route("file", ["type" => "order", "id" => $order->id, "filename" => "report.pdf"]));

        $response->assertOk();
    }

    public function test_shared_consent_file_is_available_to_any_authenticated_provider(): void
    {
        $consent = Consent::create([
            "name" => "Genetic Testing Consent",
            "file" => "consent/shared-consent.pdf",
        ]);
        $this->makeFile($consent->file);

        $response = $this->actingAs(User::factory()->create())
            ->get(route("file", ["type" => "consent", "id" => $consent->id]));

        $response->assertOk();
    }

    public function test_filename_path_traversal_is_neutralised(): void
    {
        $owner = User::factory()->create();
        $order = Order::create(["user_id" => $owner->id]);

        // basename() strips any directory component, so a traversal attempt
        // resolves to a file inside the order's own directory (404 here).
        $response = $this->actingAs($owner)
            ->get(route("file", ["type" => "order", "id" => $order->id, "filename" => "..%2F..%2F.env"]));

        $response->assertNotFound();
    }
}
