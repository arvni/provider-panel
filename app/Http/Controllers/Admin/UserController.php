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
use Inertia\Inertia;
use Inertia\Response;

class UserController extends Controller
{
    protected UserRepositoryInterface $userRepository;

    public function __construct(UserRepositoryInterface $userRepository)
    {
        $this->middleware("indexProvider")->only("index");
        $this->userRepository = $userRepository;
    }

    /**
     * Display a listing of the resource.
     *
     * @param Request $request
     * @return RedirectResponse|Response
     * @throws AuthorizationException
     */
    public function index(Request $request): Response|RedirectResponse
    {
        $this->authorize("viewAny", User::class);
        $requestInputs = $request->all();
        $users = fn() => $this->userRepository->list($requestInputs);
        return Inertia::render('User/Index', ["users" => $users, 'request' => $requestInputs]);
    }

    /**
     * Show the form for creating a new resource.
     *
     * @return RedirectResponse|Response
     * @throws AuthorizationException
     */
    public function create(): Response|RedirectResponse
    {
        $this->authorize("create", User::class);
        return Inertia::render('User/Add');
    }

    /**
     * Store a newly created resource in storage.
     *
     * @param StoreUserRequest $request
     * @return RedirectResponse
     */
    public function store(StoreUserRequest $request)
    {
        $user = $this->userRepository->create($request->all());
        return redirect()
            ->route('admin.users.index')
            ->with(["status" => "$user->name Successfully Added", "success" => true]);

    }


    /**
     * Show the form for editing the specified resource.
     *
     * @param User $user
     * @return Response
     * @throws AuthorizationException
     */
    public function edit(User $user)
    {
        $this->authorize("update", $user);
        $user=$this->userRepository->show($user);
        return Inertia::render('User/Edit', ["user" => $user]);
    }

    /**
     * Update the specified resource in storage.
     *
     * @param UpdateUserRequest $request
     * @param User $user
     * @return RedirectResponse
     */
    public function update(UpdateUserRequest $request, User $user)
    {
        $this->userRepository->edit($user, $request->all());
        return redirect()
            ->route('admin.users.index')
            ->with(["status" => "$user->name Successfully Updated", "success" => true]);
    }

    /**
     * Remove the specified resource from storage.
     *
     * @param User $user
     * @return RedirectResponse
     * @throws AuthorizationException
     */
    public function destroy(User $user)
    {
        $this->authorize("delete", $user);
        $title = $user->name;
        $this->userRepository->destroy($user);
        return redirect()
            ->route('admin.users.index')
            ->with(["success" => true, "status" => "$title Successfully Deleted"]);
    }


}
