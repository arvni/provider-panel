<?php

namespace App\Notifications;

use App\Interfaces\HasNotificationVariant;
use App\Models\CollectRequest;
use Carbon\Carbon;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class CollectRequestUpdated extends Notification implements HasNotificationVariant, ShouldQueue
{
    use Queueable;

    /** The request being raised in the first place, rather than moving on. */
    public const VARIANT_CREATED = 'created';

    /** A preferred date or kit details edit that moved no status. */
    public const VARIANT_DETAILS = 'details';

    protected CollectRequest $collectRequest;

    protected string $action;

    /** @var array<int, string> */
    protected array $changedFields;

    /**
     * @param  array<int, string>  $changedFields  Which watched fields moved, from
     *                                             CollectRequestObserver. Only meaningful
     *                                             on an update; a creation is its own news.
     */
    public function __construct(
        CollectRequest $collectRequest,
        string $action = 'updated',
        array $changedFields = []
    ) {
        $this->collectRequest = $collectRequest;
        $this->action = $action;
        $this->changedFields = $changedFields;
    }

    /**
     * Which step of the request's life this announcement is about, so the
     * recipient's per-step switches can be applied.
     *
     * A status move is the news; a date or details edit riding along with it is
     * not worth reporting separately, so the status wins when both changed.
     * Null when the caller named no changes -- there is nothing to match a
     * switch against, and an unmatched notification is delivered.
     *
     * The status is read at delivery, not at construction: notifications carry
     * their model by id (Notification uses SerializesModels) and re-read it off
     * the queue. That is deliberate -- it is the same status toMail() and
     * toArray() render, so a user silencing "requests that say scheduled" gets
     * exactly the messages that say it.
     */
    public function notificationVariant(): ?string
    {
        if ($this->action === self::VARIANT_CREATED) {
            return self::VARIANT_CREATED;
        }

        if (in_array('status', $this->changedFields, true)) {
            return $this->collectRequest->getAttribute('status')?->value;
        }

        return $this->changedFields === [] ? null : self::VARIANT_DETAILS;
    }

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        // Only the initial "created" notification is sent by email; updates are
        // silent (in-app only).
        return $this->action === 'created'
            ? ['mail', 'database']
            : ['database'];
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        $statusLabel = $this->collectRequest->status->getLabel();
        $subject = ucfirst($this->action).' Collect Request #'.$this->collectRequest->id;

        return (new MailMessage)
            ->subject($subject)
            ->greeting('Hello '.$notifiable->name.'!')
            ->line("Your collect request #{$this->collectRequest->id} has been {$this->action}.")
            ->line("Status: {$statusLabel}")
            ->when($this->collectRequest->preferred_date, function ($message) {
                $date = Carbon::parse($this->collectRequest->preferred_date, 'Asia/Muscat')->format('M d, Y');

                return $message->line("Preferred Date: {$date}");
            })
            ->line('Thank you for using our service!');
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'collect_request_id' => $this->collectRequest->id,
            'action' => $this->action,
            'status' => $this->collectRequest->status->value,
            'status_label' => $this->collectRequest->status->getLabel(),
            'preferred_date' => Carbon::parse($this->collectRequest->preferred_date, 'Asia/Muscat')?->toDateString(),
            'message' => "Collect request #{$this->collectRequest->id} has been {$this->action}",
        ];
    }
}
