<?php

namespace Tests\Feature\Admin;

use App\Enums\OrderStatus;
use App\Models\Order;
use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use App\Notifications\OrderStatusUpdated;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

/**
 * The status email is only ever sent on a transition, so a provider who lost
 * theirs -- bounced address, spam folder, mailbox not set up yet -- had no way
 * to get it back. Admins can now re-send the notification for whatever status
 * the order is sitting on, without touching the order.
 */
class ResendOrderNotificationTest extends TestCase
{
    use RefreshDatabase;

    /**
     * An admin holding the order-administration permission the action is gated on.
     */
    private function admin(): User
    {
        $user = User::factory()->create();
        $role = Role::findOrCreate('Admin');
        $role->givePermissionTo(Permission::findOrCreate('Admin.Order.Update'));
        $user->assignRole($role);

        return $user;
    }

    public function test_admin_can_resend_the_notification_for_the_current_status(): void
    {
        $owner = User::factory()->create();
        $order = Order::create(['user_id' => $owner->id, 'status' => OrderStatus::PROCESSING]);

        Notification::fake();

        $this->actingAs($this->admin())
            ->post(route('admin.orders.resendNotification', $order))
            ->assertRedirect();

        Notification::assertSentToTimes($owner, OrderStatusUpdated::class, 1);
    }

    /**
     * The observer's allow-list decides what a *transition* announces. A resend
     * is a deliberate admin action on a state that already exists, so it is not
     * bound by that list.
     */
    public function test_resend_is_not_limited_to_the_statuses_the_observer_mails(): void
    {
        $owner = User::factory()->create();
        $order = Order::create(['user_id' => $owner->id, 'status' => OrderStatus::SENT]);

        Notification::fake();

        $this->actingAs($this->admin())
            ->post(route('admin.orders.resendNotification', $order))
            ->assertRedirect();

        Notification::assertSentTo($owner, OrderStatusUpdated::class);
    }

    public function test_a_pending_draft_cannot_be_announced(): void
    {
        $owner = User::factory()->create();
        $order = Order::create(['user_id' => $owner->id, 'status' => OrderStatus::PENDING]);

        Notification::fake();

        $this->actingAs($this->admin())
            ->post(route('admin.orders.resendNotification', $order))
            ->assertForbidden();

        Notification::assertNothingSent();
    }

    public function test_the_order_is_left_untouched(): void
    {
        $owner = User::factory()->create();
        $order = Order::create(['user_id' => $owner->id, 'status' => OrderStatus::REPORTED]);
        $updatedAt = $order->updated_at;
        $historyCount = $order->statusHistories()->count();

        Notification::fake();

        $this->actingAs($this->admin())
            ->post(route('admin.orders.resendNotification', $order));

        $order->refresh();
        $this->assertSame(OrderStatus::REPORTED, $order->status);
        $this->assertEquals($updatedAt, $order->updated_at);
        $this->assertSame($historyCount, $order->statusHistories()->count());
    }

    public function test_a_provider_cannot_mail_themselves(): void
    {
        $owner = User::factory()->create();
        $order = Order::create(['user_id' => $owner->id, 'status' => OrderStatus::REPORTED]);

        Notification::fake();

        $this->actingAs($owner)
            ->post(route('admin.orders.resendNotification', $order))
            ->assertForbidden();

        Notification::assertNothingSent();
    }
}
