<?php

namespace Tests\Feature\Notification;

use App\Enums\CollectRequestStatus;
use App\Enums\NotificationType;
use App\Enums\OrderStatus;
use App\Models\CollectRequest;
use App\Models\NotificationPreference;
use App\Models\Order;
use App\Models\User;
use App\Notifications\CollectRequestUpdated;
use App\Notifications\OrderRemovedByAdmin;
use App\Notifications\OrderStatusUpdated;
use App\Notifications\TwoFactorCodeNotification;
use App\Services\NotificationPreferences;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

/**
 * The switches themselves: that a stored preference actually stops delivery on
 * the channel it names, that it stops nothing else, and that the notifications
 * a user must not be able to silence stay unsilenceable.
 */
class NotificationPreferenceTest extends TestCase
{
    use RefreshDatabase;

    private function preference(
        User $user,
        NotificationType $type,
        string $channel,
        bool $enabled,
        string $variant = ''
    ): void {
        NotificationPreference::query()->create([
            'user_id' => $user->id,
            'type' => $type->value,
            'variant' => $variant,
            'channel' => $channel,
            'enabled' => $enabled,
        ]);

        // The resolver memoizes per request; tests write behind its back.
        app(NotificationPreferences::class)->forget();
    }

    /**
     * A request built without firing the observer: its created() hook sends the
     * very notification these tests are counting.
     */
    private function collectRequest(User $user, CollectRequestStatus $status): CollectRequest
    {
        return CollectRequest::withoutEvents(fn () => CollectRequest::create([
            'user_id' => $user->id,
            'status' => $status,
            'details' => [],
        ]));
    }

    public function test_a_user_with_no_preferences_receives_everything(): void
    {
        $user = User::factory()->create();
        $order = Order::factory()->for($user, 'User')->status(OrderStatus::REPORTED)->create();

        $user->notify(new OrderStatusUpdated($order));

        $this->assertDatabaseCount('notifications', 1);
        $this->assertSame([$user->email], $this->mailedTo());
    }

    public function test_disabling_mail_stops_the_email_but_keeps_the_in_app_record(): void
    {
        $user = User::factory()->create();
        $order = Order::factory()->for($user, 'User')->status(OrderStatus::REPORTED)->create();

        $this->preference($user, NotificationType::ORDER_STATUS_UPDATED, 'mail', false, 'reported');

        $user->notify(new OrderStatusUpdated($order));

        $this->assertSame([], $this->mailedTo(), 'The email should have been cancelled.');
        $this->assertDatabaseCount('notifications', 1);
    }

    public function test_disabling_the_in_app_channel_stops_the_record_but_keeps_the_email(): void
    {
        $user = User::factory()->create();
        $order = Order::factory()->for($user, 'User')->status(OrderStatus::REPORTED)->create();

        $this->preference($user, NotificationType::ORDER_STATUS_UPDATED, 'database', false, 'reported');

        $user->notify(new OrderStatusUpdated($order));

        $this->assertDatabaseCount('notifications', 0);
        $this->assertSame([$user->email], $this->mailedTo(), 'The email should still have been sent.');
    }

    public function test_a_preference_only_silences_the_type_it_names(): void
    {
        $user = User::factory()->create();
        $order = Order::factory()->for($user, 'User')->status(OrderStatus::REPORTED)->create();

        // A switch for a different notification entirely.
        $this->preference(
            $user, NotificationType::COLLECT_REQUEST_UPDATED, 'database', false, 'scheduled'
        );

        $user->notify(new OrderStatusUpdated($order));

        $this->assertSame([$user->email], $this->mailedTo());
        $this->assertDatabaseCount('notifications', 1);
    }

    public function test_one_users_preference_does_not_silence_another_user(): void
    {
        $quiet = User::factory()->create();
        $loud = User::factory()->create();
        $order = Order::factory()->for($quiet, 'User')->status(OrderStatus::REPORTED)->create();

        $this->preference($quiet, NotificationType::ORDER_STATUS_UPDATED, 'mail', false, 'reported');

        // Sent as one batch, the case where a shared per-request cache could
        // leak one recipient's answer onto the next.
        Notification::send([$quiet, $loud], new OrderStatusUpdated($order));

        $this->assertSame(
            [$loud->email],
            $this->mailedTo(),
            'Only the user who opted out should be skipped.'
        );
    }

    public function test_two_factor_codes_cannot_be_switched_off(): void
    {
        $user = User::factory()->create();

        // There is no enum case for it, so no preference row can name it -- the
        // closest a determined user could get is a row for the wrong type.
        $this->assertNull(NotificationType::forNotification(
            new TwoFactorCodeNotification('123456', 1)
        ));

        $user->notify(new TwoFactorCodeNotification('123456', $user->id));

        $this->assertSame([$user->email], $this->mailedTo());
    }

    public function test_an_enabled_preference_sends_as_normal(): void
    {
        $user = User::factory()->create();
        $order = Order::factory()->for($user, 'User')->status(OrderStatus::REPORTED)->create();

        $this->preference($user, NotificationType::ORDER_STATUS_UPDATED, 'mail', true, 'reported');

        $user->notify(new OrderStatusUpdated($order));

        $this->assertSame([$user->email], $this->mailedTo());
    }

    /**
     * The point of splitting the order status mail: silencing one stage must
     * leave the others alone.
     */
    public function test_silencing_one_status_does_not_silence_the_others(): void
    {
        $user = User::factory()->create();

        $this->preference($user, NotificationType::ORDER_STATUS_UPDATED, 'mail', false, 'received');

        $received = Order::factory()->for($user, 'User')->status(OrderStatus::RECEIVED)->create();
        $reported = Order::factory()->for($user, 'User')->status(OrderStatus::REPORTED)->create();

        $user->notify(new OrderStatusUpdated($received));
        $this->assertSame([], $this->mailedTo(), 'The silenced status should not be mailed.');

        $user->notify(new OrderStatusUpdated($reported));
        $this->assertSame([$user->email], $this->mailedTo(), 'Results ready should still arrive.');
    }

    /**
     * The two switches on one status are independent of each other, exactly as
     * they are for a whole type.
     */
    public function test_a_status_can_be_silenced_on_one_channel_only(): void
    {
        $user = User::factory()->create();
        $order = Order::factory()->for($user, 'User')->status(OrderStatus::PROCESSING)->create();

        $this->preference($user, NotificationType::ORDER_STATUS_UPDATED, 'mail', false, 'processing');

        $user->notify(new OrderStatusUpdated($order));

        $this->assertSame([], $this->mailedTo());
        $this->assertDatabaseCount('notifications', 1);
    }

    /**
     * A status nobody has expressed an opinion about keeps sending. This is the
     * fail-open path that also covers an admin resending the notification for a
     * status the observer never announces on its own.
     */
    public function test_a_status_with_no_preference_still_sends(): void
    {
        $user = User::factory()->create();
        $order = Order::factory()->for($user, 'User')->status(OrderStatus::SENT)->create();

        $this->preference($user, NotificationType::ORDER_STATUS_UPDATED, 'mail', false, 'reported');

        $user->notify(new OrderStatusUpdated($order));

        $this->assertSame([$user->email], $this->mailedTo());
    }

    /**
     * Every status the observer announces on must have a switch, and no switch
     * may exist for one it never announces -- otherwise the screen offers a
     * control that does nothing, or hides one that is needed.
     */
    public function test_the_offered_statuses_match_the_ones_that_notify(): void
    {
        $offered = array_keys(NotificationType::ORDER_STATUS_UPDATED->variants());
        $notifying = array_map(fn (OrderStatus $status) => $status->value, OrderStatus::notifiable());

        sort($offered);
        sort($notifying);

        $this->assertSame($notifying, $offered);
    }

    /**
     * A type that does not split keeps its single switch, addressed by the
     * empty variant.
     */
    public function test_a_type_without_variants_is_still_a_single_switch(): void
    {
        $user = User::factory()->create();

        $this->preference($user, NotificationType::ORDER_REMOVED_BY_ADMIN, 'mail', false);

        $user->notify(new OrderRemovedByAdmin('ORD-1'));

        $this->assertSame([], $this->mailedTo());
    }

    /**
     * A collection request moves through several steps, and a provider does not
     * want them equally: the collector being on the way matters in a way that
     * the request being scheduled a week earlier does not.
     */
    public function test_silencing_one_collect_request_step_leaves_the_others(): void
    {
        $user = User::factory()->create();

        $this->preference(
            $user, NotificationType::COLLECT_REQUEST_UPDATED, 'database', false, 'scheduled'
        );

        $request = $this->collectRequest($user, CollectRequestStatus::SCHEDULED);

        $user->notify(new CollectRequestUpdated($request, 'updated', ['status']));
        $this->assertSame(
            0,
            DB::table('notifications')->count(),
            'The silenced step should not be recorded.'
        );

        // Saved, not just assigned: notifications carry their model by id and
        // re-read it at delivery, which is what the observer's ordering gives
        // them in production.
        $request->status = CollectRequestStatus::ON_THE_WAY;
        $request->saveQuietly();

        $user->notify(new CollectRequestUpdated($request, 'updated', ['status']));
        $this->assertSame(
            1,
            DB::table('notifications')->count(),
            'A different step should still arrive.'
        );
    }

    /**
     * A date or kit details edit moves no status but still reaches the
     * provider, so it is its own switch rather than riding on a status one.
     */
    public function test_a_details_only_change_is_its_own_step(): void
    {
        $user = User::factory()->create();

        $this->preference(
            $user, NotificationType::COLLECT_REQUEST_UPDATED, 'database', false, 'details'
        );

        $request = $this->collectRequest($user, CollectRequestStatus::SCHEDULED);

        $user->notify(new CollectRequestUpdated($request, 'updated', ['preferred_date']));
        $this->assertDatabaseCount('notifications', 0);

        // The same request moving status is a different step, still wanted.
        $user->notify(new CollectRequestUpdated($request, 'updated', ['status']));
        $this->assertDatabaseCount('notifications', 1);
        $this->assertSame(
            CollectRequestStatus::SCHEDULED->value,
            DB::table('notifications')->value('data')
                ? json_decode(DB::table('notifications')->value('data'), true)['status']
                : null
        );
    }

    /**
     * When both move together the status is the news; the notification must not
     * be matched against the details switch and silenced by it.
     */
    public function test_a_status_move_wins_over_a_details_edit_riding_along(): void
    {
        $user = User::factory()->create();

        $this->preference(
            $user, NotificationType::COLLECT_REQUEST_UPDATED, 'database', false, 'details'
        );

        $request = $this->collectRequest($user, CollectRequestStatus::RECEIVED);

        $user->notify(new CollectRequestUpdated($request, 'updated', ['status', 'preferred_date']));

        $this->assertDatabaseCount('notifications', 1);
    }

    /**
     * Raising a request is the one step that is emailed, and it is switchable
     * on both channels independently.
     */
    public function test_the_created_step_can_be_silenced_on_email_alone(): void
    {
        $user = User::factory()->create();

        $this->preference(
            $user, NotificationType::COLLECT_REQUEST_UPDATED, 'mail', false, 'created'
        );

        $request = $this->collectRequest($user, CollectRequestStatus::REQUESTED);

        $user->notify(new CollectRequestUpdated($request, 'created'));

        $this->assertSame([], $this->mailedTo());
        $this->assertDatabaseCount('notifications', 1);
    }

    /**
     * Every step the request can reach must have a switch, and none may exist
     * for a step it never reaches.
     */
    public function test_the_offered_steps_match_the_request_lifecycle(): void
    {
        $offered = array_keys(NotificationType::COLLECT_REQUEST_UPDATED->variants());
        $statuses = array_map(
            fn (CollectRequestStatus $status) => $status->value,
            CollectRequestStatus::notifiable()
        );

        $this->assertSame(
            array_merge(
                [CollectRequestUpdated::VARIANT_CREATED],
                $statuses,
                [CollectRequestUpdated::VARIANT_DETAILS]
            ),
            $offered
        );

        $this->assertNotContains(
            CollectRequestStatus::REQUESTED->value,
            $offered,
            'Nothing transitions back into requested, so a switch would do nothing.'
        );
    }

    /**
     * Only the opening announcement is mailed, so the later steps must not be
     * offered an email switch that could never take effect.
     */
    public function test_only_the_created_step_supports_email(): void
    {
        $type = NotificationType::COLLECT_REQUEST_UPDATED;

        $this->assertTrue($type->supports('mail', CollectRequestUpdated::VARIANT_CREATED));

        foreach ([CollectRequestStatus::SCHEDULED->value, CollectRequestUpdated::VARIANT_DETAILS] as $step) {
            $this->assertFalse($type->supports('mail', $step));
            $this->assertTrue($type->supports('database', $step));
        }
    }

    /**
     * Who actually received an email.
     *
     * phpunit.xml pins MAIL_MAILER to the array transport, so its collected
     * messages are the record of what really went out -- which is the point:
     * Notification::fake() would swap out the very sender whose cancellation
     * hook this feature hangs off, and pass no matter what the listener did.
     *
     * @return array<int, string>
     */
    private function mailedTo(): array
    {
        return app('mailer')->getSymfonyTransport()->messages()
            ->flatMap(fn ($message) => $message->getOriginalMessage()->getTo())
            ->map(fn ($address) => $address->getAddress())
            ->all();
    }
}
