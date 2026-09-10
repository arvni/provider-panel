<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateNotificationPreferencesRequest;
use App\Models\User;
use App\Services\NotificationPreferences;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Another user's notification switches, for an admin.
 *
 * Gated on the same 'update user' permission as the rest of the user editing
 * screens -- an admin who may change someone's email may change what reaches
 * that inbox. The matrix comes from the same service as the self-service
 * screen, so what an admin sees is what that user sees.
 */
class UserNotificationPreferenceController extends Controller
{
    public function __construct(private readonly NotificationPreferences $preferences) {}

    /**
     * @throws AuthorizationException
     */
    public function edit(User $user): Response
    {
        $this->authorize('update', $user);

        return Inertia::render('User/NotificationPreferences', [
            'user' => $user->only(['id', 'name', 'email']),
            'preferences' => $this->preferences->matrixFor($user),
        ]);
    }

    /**
     * @throws AuthorizationException
     */
    public function update(UpdateNotificationPreferencesRequest $request, User $user): RedirectResponse
    {
        $this->authorize('update', $user);

        $this->preferences->save($user, $request->answers());

        return redirect()
            ->route('admin.users.notifications.edit', $user->id)
            ->with(['status' => "Notification settings saved for {$user->name}", 'success' => true]);
    }
}
