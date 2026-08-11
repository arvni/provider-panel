<?php

namespace Tests\Feature\Order;

use App\Enums\OrderStatus;
use App\Models\Order;
use App\Models\User;
use App\Notifications\OrderStatusUpdated;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

/**
 * The status email announces a transition, not a state. Orders are written to
 * repeatedly while parked on a notifiable status — sync:orders runs every five
 * minutes and refreshes server_id/received_at — so the observer must key off
 * the status actually changing or providers get the same mail over and over.
 */
class OrderStatusNotificationTest extends TestCase
{
    use RefreshDatabase;

    public function test_status_transition_notifies_the_owner_once(): void
    {
        Notification::fake();
        $owner = User::factory()->create();
        $order = Order::create(['user_id' => $owner->id, 'status' => OrderStatus::RECEIVED]);

        $order->update(['status' => OrderStatus::PROCESSING]);

        Notification::assertSentToTimes($owner, OrderStatusUpdated::class, 1);
    }

    public function test_unrelated_writes_while_parked_on_a_status_do_not_renotify(): void
    {
        $owner = User::factory()->create();
        $order = Order::create(['user_id' => $owner->id, 'status' => OrderStatus::RECEIVED]);
        $order->update(['status' => OrderStatus::PROCESSING]);

        Notification::fake();

        // What sync:orders does on every pass once the status has settled.
        $order->update(['server_id' => '12345']);
        $order->update(['received_at' => now()]);

        Notification::assertNothingSent();
    }

    public function test_resaving_the_same_status_does_not_renotify(): void
    {
        $owner = User::factory()->create();
        $order = Order::create(['user_id' => $owner->id, 'status' => OrderStatus::PROCESSING]);

        Notification::fake();

        $order->update(['status' => OrderStatus::PROCESSING]);

        Notification::assertNothingSent();
    }

    /**
     * These two statuses are bookkeeping, not news the provider needs mailed:
     * "report downloaded" is stamped by the provider's own download click, and
     * "logistic requested" by their own collection request. Both are excluded
     * from the observer's allow-list; this pins that down so widening the list
     * later doesn't quietly start mailing them.
     */
    #[DataProvider('nonNotifiableStatuses')]
    public function test_bookkeeping_statuses_do_not_notify(OrderStatus $status): void
    {
        $owner = User::factory()->create();
        $order = Order::create(['user_id' => $owner->id, 'status' => OrderStatus::REPORTED]);

        Notification::fake();

        $order->update(['status' => $status]);

        Notification::assertNothingSent();
    }

    public static function nonNotifiableStatuses(): array
    {
        return [
            'report downloaded' => [OrderStatus::REPORT_DOWNLOADED],
            'logistic requested' => [OrderStatus::LOGISTIC_REQUESTED],
        ];
    }
}
