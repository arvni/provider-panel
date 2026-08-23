<?php

namespace Tests\Feature\Logistic;

use App\Enums\CollectRequestStatus;
use App\Models\CollectRequest;
use App\Models\User;
use App\Notifications\AdminCollectRequestNotification;
use App\Services\AdminNotificationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Notifications\DatabaseNotification;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

/**
 * A collect request carries its whole logistic payload in details: barcodes,
 * both locations, and a temperature reading a minute for as long as the box was
 * out -- thousands of them on a three-day pickup. That payload has no business
 * in an admin notification. Storing an old and a new copy of it overran the
 * notifications.data TEXT column ("Data too long for column 'data'") and took
 * the queue worker down with it, so this pins the payload to a size a row can
 * hold, and keeps a poll that rewrites details with the same readings from
 * mailing the admins at all.
 */
class CollectRequestNotificationPayloadTest extends TestCase
{
    use RefreshDatabase;

    /**
     * A day of readings, the shape the logistics webhook sends them in.
     *
     * @return array<int, array{value: string, timestamp: string}>
     */
    private static function temperatureLogs(float $from = 12.0): array
    {
        return array_map(fn ($minute) => [
            'value' => number_format($from + ($minute / 100), 2),
            'timestamp' => now()->addMinutes($minute)->toIso8601String(),
        ], range(1, 1440));
    }

    private function requestWithLogs(User $owner): CollectRequest
    {
        return CollectRequest::create([
            'user_id' => $owner->id,
            'status' => CollectRequestStatus::PICKED_UP,
            'preferred_date' => '2026-08-20',
            'details' => [
                'barcodes' => [],
                'starting_location' => ['latitude' => 23.6131889, 'longitude' => 58.4641624],
                'temperature_logs' => self::temperatureLogs(),
            ],
        ]);
    }

    public function test_the_stored_payload_leaves_the_temperature_logs_behind(): void
    {
        $owner = User::factory()->create();
        $request = $this->requestWithLogs($owner);

        $changes = [
            'status' => ['old' => 'Picked up', 'new' => 'Received'],
            'details' => [
                'old' => $request->details,
                'new' => array_merge($request->details, ['temperature_logs' => self::temperatureLogs(13.0)]),
            ],
        ];

        $payload = (new AdminCollectRequestNotification($request, 'updated', $changes))
            ->toArray($owner);

        $encoded = json_encode($payload);

        // TEXT tops out at 65,535 bytes; a notification has no business coming
        // anywhere near that, so hold it to something a bell can render.
        $this->assertLessThan(4096, strlen($encoded));
        $this->assertStringNotContainsString('temperature', $encoded);

        // The scalar change still reads in full, and details is still reported
        // as having moved -- only its contents are dropped.
        $this->assertSame(['old' => 'Picked up', 'new' => 'Received'], $payload['changes']['status']);
        $this->assertSame(['changed' => true], $payload['changes']['details']);
    }

    public function test_the_notification_is_written_to_the_database(): void
    {
        $admin = User::factory()->create(['userName' => 'notify']);
        $owner = User::factory()->create();
        $request = $this->requestWithLogs($owner);

        // Creating the request already announced itself; this test is about
        // what an update writes.
        DatabaseNotification::query()->delete();

        AdminNotificationService::sendCollectRequestNotification($request, 'updated', [
            'details' => ['old' => [], 'new' => $request->details],
        ]);

        $this->assertStringNotContainsString(
            'temperature',
            (string) $admin->notifications()->sole()->getRawOriginal('data')
        );
    }

    public function test_a_poll_that_rewrites_details_with_the_same_readings_does_not_notify(): void
    {
        $owner = User::factory()->create();
        $request = $this->requestWithLogs($owner);

        Notification::fake();

        // What the logistics webhook does on every pass: details is a JSON
        // column written wholesale, and the numbers come back as strings.
        $request->update(['details' => json_decode(json_encode(array_merge(
            $request->details,
            ['starting_location' => ['latitude' => '23.6131889', 'longitude' => '58.4641624']]
        )), true)]);

        Notification::assertNothingSent();
    }

    public function test_a_real_status_change_still_notifies(): void
    {
        $admin = User::factory()->create(['userName' => 'notify']);
        $owner = User::factory()->create();
        $request = $this->requestWithLogs($owner);

        Notification::fake();

        $request->update(['status' => CollectRequestStatus::RECEIVED]);

        Notification::assertSentTo($admin, AdminCollectRequestNotification::class);
    }
}
