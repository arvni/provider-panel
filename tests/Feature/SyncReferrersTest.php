<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

/**
 * Covers the LIS referrer sync: newly created providers must be granted the
 * default provider role so they have access (role-less users have none).
 */
class SyncReferrersTest extends TestCase
{
    use RefreshDatabase;

    private function fakeReferrers(array $referrers): void
    {
        // Pre-seed the API token so ApiService skips the auth round-trip.
        Cache::put('api_sanctum_token', encrypt('test-token'));

        Http::fake([
            config('api.server_url').config('api.referrers_path').'*' => Http::response([
                'data' => $referrers,
            ]),
        ]);
    }

    private function referrer(int $id, string $email): array
    {
        return [
            'id' => $id,
            'name' => 'Synced Provider',
            'email' => $email,
            'phoneNo' => '0000000000',
            'isActive' => true,
            'billingInfo' => [],
            'contactInfo' => [],
        ];
    }

    public function test_newly_synced_referrer_is_granted_the_provider_role(): void
    {
        Role::findOrCreate(User::PROVIDER_ROLE);
        $this->fakeReferrers([$this->referrer(101, 'new-provider@example.com')]);

        $this->artisan('sync:referrers')->assertSuccessful();

        $user = User::where('referrer_id', 101)->firstOrFail();
        $this->assertTrue($user->hasRole(User::PROVIDER_ROLE));
    }

    public function test_existing_referrer_is_not_re_roled_on_sync(): void
    {
        Role::findOrCreate(User::PROVIDER_ROLE);
        $existing = User::factory()->create(['referrer_id' => 202, 'email' => 'existing@example.com']);

        $this->fakeReferrers([$this->referrer(202, 'existing@example.com')]);

        $this->artisan('sync:referrers')->assertSuccessful();

        // The sync only updates meta/active for known referrers; it must not
        // retroactively assign the provider role to pre-existing users.
        $this->assertFalse($existing->fresh()->hasRole(User::PROVIDER_ROLE));
    }
}
