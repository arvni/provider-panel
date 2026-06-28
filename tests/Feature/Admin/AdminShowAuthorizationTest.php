<?php

namespace Tests\Feature\Admin;

use App\Models\ConsentTerm;
use App\Models\Permission;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * The admin `show` endpoints for Permission and ConsentTerm previously returned
 * their resource to any authenticated user (no authorize() call). They now run
 * the policy's `view` ability; these tests lock that in.
 */
class AdminShowAuthorizationTest extends TestCase
{
    use RefreshDatabase;

    public function test_non_admin_cannot_view_a_permission(): void
    {
        $permission = Permission::create(['name' => 'Admin.Order.Index']);

        $this->actingAs(User::factory()->create())
            ->getJson(route('admin.permissions.show', $permission))
            ->assertForbidden();
    }

    public function test_non_admin_cannot_view_a_consent_term(): void
    {
        $consentTerm = ConsentTerm::create(['name' => 'Some term', 'is_active' => true]);

        $this->actingAs(User::factory()->create())
            ->getJson(route('admin.consentTerms.show', $consentTerm))
            ->assertForbidden();
    }
}
