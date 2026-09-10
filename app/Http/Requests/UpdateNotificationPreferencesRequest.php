<?php

namespace App\Http\Requests;

use App\Enums\NotificationType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * The shape of a settings-screen save.
 *
 * Only the shape is checked here. Whether a given switch belongs to this
 * particular user -- their audience, and the channels the type actually
 * delivers on -- is settled in NotificationPreferences::save(), which is the
 * one place that knows, and which both the self-service and the admin path go
 * through.
 */
class UpdateNotificationPreferencesRequest extends FormRequest
{
    public function authorize(): bool
    {
        // Authorization is the controller's business: the two routes that use
        // this request answer to different rules (your own settings vs an
        // admin editing someone else's).
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            // present, not required: switching everything on leaves nothing to
            // store, and that is a legitimate save rather than an empty one.
            'preferences' => ['present', 'array'],
            'preferences.*.type' => ['required', Rule::enum(NotificationType::class)],
            'preferences.*.channel' => ['required', Rule::in(NotificationType::allChannels())],
            // Which flavour of the notification, e.g. an order status. Absent
            // for types that are simply on or off; whether a given type accepts
            // a given variant is settled in NotificationPreferences::save().
            'preferences.*.variant' => ['nullable', 'string', 'max:64'],
            'preferences.*.enabled' => ['required', 'boolean'],
        ];
    }

    /**
     * @return array<int, array{type: string, channel: string, enabled: bool, variant?: string|null}>
     */
    public function answers(): array
    {
        return $this->validated()['preferences'];
    }
}
