<?php

namespace Tests\Feature\Queue;

use App\Enums\OrderStatus;
use App\Jobs\SendCollectionRequest;
use App\Jobs\SendOrderMaterial;
use App\Models\Order;
use App\Models\User;
use App\Notifications\AdminCollectRequestNotification;
use App\Notifications\AdminOrderMaterialNotification;
use App\Notifications\CollectRequestDeleted;
use App\Notifications\CollectRequestUpdated;
use App\Notifications\OrderMaterialRequested;
use App\Notifications\OrderMaterialUpdated;
use App\Notifications\OrderRemovedByAdmin;
use App\Notifications\OrderStatusUpdated;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use PHPUnit\Framework\Attributes\DataProvider;
use ReflectionClass;
use Tests\TestCase;

/**
 * Guards the "heavy work runs off-request" contract. The outbound webhook jobs
 * and every user-facing notification implement ShouldQueue, so on a non-sync
 * QUEUE_CONNECTION (see .env.example -> database) they leave the request cycle.
 * If someone drops ShouldQueue from one of these, that work silently goes back
 * to blocking the HTTP request — these tests fail instead.
 */
class HeavyWorkIsQueuedTest extends TestCase
{
    use RefreshDatabase;

    /**
     * @return array<string, array{0: class-string}>
     */
    public static function queueableClasses(): array
    {
        return [
            // Outbound HTTP to the main server.
            'SendCollectionRequest job' => [SendCollectionRequest::class],
            'SendOrderMaterial job' => [SendOrderMaterial::class],
            // User- and admin-facing notifications.
            'OrderStatusUpdated' => [OrderStatusUpdated::class],
            'OrderRemovedByAdmin' => [OrderRemovedByAdmin::class],
            'OrderMaterialRequested' => [OrderMaterialRequested::class],
            'OrderMaterialUpdated' => [OrderMaterialUpdated::class],
            'CollectRequestUpdated' => [CollectRequestUpdated::class],
            'CollectRequestDeleted' => [CollectRequestDeleted::class],
            'AdminCollectRequestNotification' => [AdminCollectRequestNotification::class],
            'AdminOrderMaterialNotification' => [AdminOrderMaterialNotification::class],
        ];
    }

    /**
     * @param  class-string  $class
     */
    #[DataProvider('queueableClasses')]
    public function test_class_is_queueable(string $class): void
    {
        $this->assertTrue(
            (new ReflectionClass($class))->implementsInterface(ShouldQueue::class),
            "{$class} must implement ShouldQueue so it runs off-request.",
        );
    }

    public function test_order_reaching_a_terminal_status_notifies_its_owner(): void
    {
        Notification::fake();
        $owner = User::factory()->create();
        $order = Order::create(['user_id' => $owner->id, 'status' => OrderStatus::PROCESSING]);

        $order->update(['status' => OrderStatus::REPORTED]);

        Notification::assertSentTo($owner, OrderStatusUpdated::class);
    }

    public function test_intermediate_status_changes_do_not_notify(): void
    {
        Notification::fake();
        $owner = User::factory()->create();
        $order = Order::create(['user_id' => $owner->id, 'status' => OrderStatus::PENDING]);

        $order->update(['status' => OrderStatus::REQUESTED]);

        Notification::assertNothingSent();
    }
}
