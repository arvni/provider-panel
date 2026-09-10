<?php

namespace Tests\Feature\Notification;

use App\Enums\NotificationType;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

/**
 * The two screens that write preferences: a user's own, and an admin editing
 * someone else's. What matters here is what each is allowed to save -- the
 * table is a whitelist, and the request body is the untrusted half of it.
 */
class NotificationPreferenceScreenTest extends TestCase
{
    use RefreshDatabase;

    private function admin(): User
    {
        $user = User::factory()->create();

        $role = Role::findOrCreate('Admin');
        Permission::findOrCreate('Admin.User.Update');
        $role->givePermissionTo('Admin.User.Update');
        $user->assignRole($role);

        return $user;
    }

    public function test_the_settings_screen_lists_the_types_a_provider_can_configure(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->get(route('settings.notifications.edit'));

        $response->assertOk();
        $types = collect($response->viewData('page')['props']['preferences'])->pluck('type');

        $this->assertContains(NotificationType::ORDER_STATUS_UPDATED->value, $types);
        $this->assertNotContains(
            NotificationType::ADMIN_COLLECT_REQUEST->value,
            $types,
            'A provider never receives the lab-wide notifications, so must not be offered a switch.'
        );
    }

    public function test_an_admin_is_also_offered_the_lab_wide_types(): void
    {
        $admin = $this->admin();

        $response = $this->actingAs($admin)->get(route('settings.notifications.edit'));

        $types = collect($response->viewData('page')['props']['preferences'])->pluck('type');
        $this->assertContains(NotificationType::ADMIN_COLLECT_REQUEST->value, $types);
    }

    public function test_a_user_can_switch_a_channel_off(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->put(route('settings.notifications.update'), [
                'preferences' => [
                    [
                        'type' => NotificationType::ORDER_STATUS_UPDATED->value,
                        'variant' => 'reported',
                        'channel' => 'mail',
                        'enabled' => false,
                    ],
                ],
            ])
            ->assertRedirect(route('settings.notifications.edit'));

        $this->assertDatabaseHas('notification_preferences', [
            'user_id' => $user->id,
            'type' => NotificationType::ORDER_STATUS_UPDATED->value,
            'variant' => 'reported',
            'channel' => 'mail',
            'enabled' => false,
        ]);
    }

    public function test_a_save_replaces_the_users_previous_answers(): void
    {
        $user = User::factory()->create();
        $url = route('settings.notifications.update');
        $type = NotificationType::ORDER_STATUS_UPDATED->value;

        $this->actingAs($user)->put($url, [
            'preferences' => [
                ['type' => $type, 'variant' => 'reported', 'channel' => 'mail', 'enabled' => false],
                ['type' => $type, 'variant' => 'reported', 'channel' => 'database', 'enabled' => false],
            ],
        ]);

        $this->actingAs($user)->put($url, [
            'preferences' => [
                ['type' => $type, 'variant' => 'reported', 'channel' => 'mail', 'enabled' => true],
                ['type' => $type, 'variant' => 'reported', 'channel' => 'database', 'enabled' => true],
            ],
        ]);

        $this->assertDatabaseCount('notification_preferences', 2);
        $this->assertDatabaseMissing('notification_preferences', ['enabled' => false]);
    }

    public function test_an_unknown_type_is_rejected(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->put(route('settings.notifications.update'), [
                'preferences' => [
                    ['type' => 'password_reset', 'channel' => 'mail', 'enabled' => false],
                ],
            ])
            ->assertSessionHasErrors('preferences.0.type');

        $this->assertDatabaseCount('notification_preferences', 0);
    }

    public function test_an_unknown_channel_is_rejected(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->put(route('settings.notifications.update'), [
                'preferences' => [
                    [
                        'type' => NotificationType::ORDER_STATUS_UPDATED->value,
                        'variant' => 'reported',
                        'channel' => 'sms',
                        'enabled' => false,
                    ],
                ],
            ])
            ->assertSessionHasErrors('preferences.0.channel');
    }

    /**
     * A hand-made request naming a real type on a channel that type never
     * delivers on. Valid in shape, so it passes the form request; the service
     * drops it rather than storing a switch for a mail that is never sent.
     */
    public function test_a_channel_the_type_does_not_use_is_dropped(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->put(route('settings.notifications.update'), [
                'preferences' => [
                    [
                        // Delivered in-app only.
                        'type' => NotificationType::COLLECT_REQUEST_DELETED->value,
                        'channel' => 'mail',
                        'enabled' => false,
                    ],
                ],
            ])
            ->assertSessionHasNoErrors();

        $this->assertDatabaseCount('notification_preferences', 0);
    }

    /**
     * The audience filter is enforced on save, not just hidden in the UI.
     */
    public function test_a_provider_cannot_store_a_switch_for_an_admin_only_type(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->put(route('settings.notifications.update'), [
                'preferences' => [
                    [
                        'type' => NotificationType::ADMIN_COLLECT_REQUEST->value,
                        'channel' => 'mail',
                        'enabled' => false,
                    ],
                ],
            ])
            ->assertSessionHasNoErrors();

        $this->assertDatabaseCount('notification_preferences', 0);
    }

    /**
     * The order status row is offered as one switch per status rather than a
     * single switch for the lot.
     */
    public function test_the_order_status_row_is_offered_per_status(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->get(route('settings.notifications.edit'));

        $row = collect($response->viewData('page')['props']['preferences'])
            ->firstWhere('type', NotificationType::ORDER_STATUS_UPDATED->value);

        $this->assertSame(
            ['received', 'processing', 'waiting for financial approval', 'reported'],
            array_column($row['variants'], 'key')
        );

        $plain = collect($response->viewData('page')['props']['preferences'])
            ->firstWhere('type', NotificationType::ORDER_REMOVED_BY_ADMIN->value);

        $this->assertSame([], $plain['variants'], 'A type that does not split has no sub-rows.');
    }

    /**
     * A hand-made request naming a status the type does not split into. Valid in
     * shape, dropped on the way to the table.
     */
    public function test_an_unknown_status_is_dropped(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->put(route('settings.notifications.update'), [
                'preferences' => [
                    [
                        'type' => NotificationType::ORDER_STATUS_UPDATED->value,
                        'variant' => 'report downloaded',
                        'channel' => 'mail',
                        'enabled' => false,
                    ],
                ],
            ])
            ->assertSessionHasNoErrors();

        $this->assertDatabaseCount('notification_preferences', 0);
    }

    /**
     * The whole-type switch is no longer meaningful for a type that splits, so
     * an answer that omits the status must not be stored -- it would sit on the
     * empty variant matching nothing.
     */
    public function test_an_order_status_answer_without_a_status_is_dropped(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->put(route('settings.notifications.update'), [
                'preferences' => [
                    [
                        'type' => NotificationType::ORDER_STATUS_UPDATED->value,
                        'channel' => 'mail',
                        'enabled' => false,
                    ],
                ],
            ])
            ->assertSessionHasNoErrors();

        $this->assertDatabaseCount('notification_preferences', 0);
    }

    public function test_statuses_are_saved_independently(): void
    {
        $user = User::factory()->create();
        $type = NotificationType::ORDER_STATUS_UPDATED->value;

        $this->actingAs($user)->put(route('settings.notifications.update'), [
            'preferences' => [
                ['type' => $type, 'variant' => 'received', 'channel' => 'mail', 'enabled' => false],
                ['type' => $type, 'variant' => 'reported', 'channel' => 'mail', 'enabled' => true],
            ],
        ]);

        $this->assertDatabaseHas('notification_preferences', [
            'variant' => 'received',
            'enabled' => false,
        ]);
        $this->assertDatabaseHas('notification_preferences', [
            'variant' => 'reported',
            'enabled' => true,
        ]);
    }

    public function test_an_admin_can_edit_another_users_preferences(): void
    {
        $admin = $this->admin();
        $provider = User::factory()->create();

        $this->actingAs($admin)
            ->put(route('admin.users.notifications.update', $provider->id), [
                'preferences' => [
                    [
                        'type' => NotificationType::ORDER_STATUS_UPDATED->value,
                        'variant' => 'reported',
                        'channel' => 'mail',
                        'enabled' => false,
                    ],
                ],
            ])
            ->assertRedirect(route('admin.users.notifications.edit', $provider->id));

        $this->assertDatabaseHas('notification_preferences', [
            'user_id' => $provider->id,
            'enabled' => false,
        ]);
    }

    public function test_a_provider_cannot_edit_another_users_preferences(): void
    {
        $provider = User::factory()->create();
        $victim = User::factory()->create();

        $this->actingAs($provider)
            ->get(route('admin.users.notifications.edit', $victim->id))
            ->assertForbidden();

        $this->actingAs($provider)
            ->put(route('admin.users.notifications.update', $victim->id), [
                'preferences' => [
                    [
                        'type' => NotificationType::ORDER_STATUS_UPDATED->value,
                        'variant' => 'reported',
                        'channel' => 'mail',
                        'enabled' => false,
                    ],
                ],
            ])
            ->assertForbidden();

        $this->assertDatabaseCount('notification_preferences', 0);
    }

    public function test_the_admin_screen_shows_the_edited_users_audience_not_the_admins(): void
    {
        $admin = $this->admin();
        $provider = User::factory()->create();

        $response = $this->actingAs($admin)
            ->get(route('admin.users.notifications.edit', $provider->id));

        $response->assertOk();
        $types = collect($response->viewData('page')['props']['preferences'])->pluck('type');

        $this->assertNotContains(NotificationType::ADMIN_COLLECT_REQUEST->value, $types);
    }
}
