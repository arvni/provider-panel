<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreUserRequest;
use App\Http\Requests\UpdateUserRequest;
use App\Interfaces\UserRepositoryInterface;
use App\Models\User;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Inertia\Inertia;
use Inertia\Response;

class UserController extends Controller
{
    protected UserRepositoryInterface $userRepository;

    public function __construct(UserRepositoryInterface $userRepository)
    {
        $this->middleware('indexProvider')->only('index');
        $this->userRepository = $userRepository;
    }

    /**
     * Display a listing of the resource.
     *
     * @throws AuthorizationException
     */
    public function index(Request $request): Response|RedirectResponse
    {
        $this->authorize('viewAny', User::class);
        $requestInputs = $request->all();
        $users = fn () => $this->userRepository->list($requestInputs);

        return Inertia::render('User/Index', ['users' => $users, 'request' => $requestInputs]);
    }

    /**
     * Show the form for creating a new resource.
     *
     * @throws AuthorizationException
     */
    public function create(): Response|RedirectResponse
    {
        $this->authorize('create', User::class);

        return Inertia::render('User/Add');
    }

    /**
     * Store a newly created resource in storage.
     *
     * @return RedirectResponse
     */
    public function store(StoreUserRequest $request)
    {
        $user = $this->userRepository->create(array_merge($request->except('password'), ['password' => Hash::make($request->get('password'))]));

        return redirect()
            ->route('admin.users.index')
            ->with(['status' => "$user->name Successfully Added", 'success' => true]);

    }

    /**
     * Show the form for editing the specified resource.
     *
     * @return Response
     *
     * @throws AuthorizationException
     */
    public function edit(User $user)
    {
        $this->authorize('update', $user);
        $user = $this->userRepository->show($user);

        return Inertia::render('User/Edit', ['user' => $user]);
    }

    /**
     * Update the specified resource in storage.
     *
     * @return RedirectResponse
     */
    public function update(UpdateUserRequest $request, User $user)
    {
        $this->userRepository->edit($user, $request->all());

        return redirect()
            ->route('admin.users.index')
            ->with(['status' => "$user->name Successfully Updated", 'success' => true]);
    }

    /**
     * Remove the specified resource from storage.
     *
     * @return RedirectResponse
     *
     * @throws AuthorizationException
     */
    public function destroy(User $user)
    {
        $this->authorize('delete', $user);
        $title = $user->name;
        $this->userRepository->destroy($user);

        return redirect()
            ->route('admin.users.index')
            ->with(['success' => true, 'status' => "$title Successfully Deleted"]);
    }

    /**
     * Send a password reset link to the specified user.
     *
     * @throws AuthorizationException
     */
    public function sendResetPassword(User $user): RedirectResponse
    {
        $this->authorize('update', $user);

        $status = Password::sendResetLink(['email' => $user->email]);

        if ($status === Password::RESET_LINK_SENT) {
            return redirect()
                ->route('admin.users.index')
                ->with(['success' => true, 'status' => "Password reset email sent to $user->name"]);
        }

        return redirect()
            ->route('admin.users.index')
            ->with(['success' => false, 'status' => trans($status)]);
    }
}
