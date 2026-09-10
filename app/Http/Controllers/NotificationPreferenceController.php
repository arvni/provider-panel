<?php

namespace App\Http\Controllers;

use App\Http\Requests\UpdateNotificationPreferencesRequest;
use App\Services\NotificationPreferences;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

/**
 * A user's own notification switches.
 */
class NotificationPreferenceController extends Controller
{
    public function __construct(private readonly NotificationPreferences $preferences) {}

    public function edit(): Response
    {
        $user = auth()->user();

        return Inertia::render('Settings/Notifications', [
            'preferences' => $this->preferences->matrixFor($user),
        ]);
    }

    public function update(UpdateNotificationPreferencesRequest $request): RedirectResponse
    {
        $this->preferences->save(auth()->user(), $request->answers());

        return redirect()
            ->route('settings.notifications.edit')
            ->with(['status' => 'Notification settings saved', 'success' => true]);
    }
}
