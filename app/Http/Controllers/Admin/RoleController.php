<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreRoleRequest;
use App\Http\Requests\UpdateRoleRequest;
use App\Interfaces\PermissionRepositoryInterface;
use App\Interfaces\RoleRepositoryInterface;
use App\Models\Role;
use Exception;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class RoleController extends Controller
{
    private RoleRepositoryInterface $roleRepository;
    private PermissionRepositoryInterface $permissionRepository;

    public function __construct(RoleRepositoryInterface $roleRepository, PermissionRepositoryInterface $permissionRepository)
    {
        $this->roleRepository = $roleRepository;
        $this->permissionRepository = $permissionRepository;
        $this->middleware("indexProvider")->only("index");
    }

    /**
     * Display a listing of the resource.
     *
     * @param Request $request
     * @return Response
     * @throws AuthorizationException
     */
    public function index(Request $request): Response
    {
        $this->authorize("viewAny", Role::class);
        $requestInputs = $request->all();
        $roles = $this->roleRepository->list($requestInputs);
        return Inertia::render('Role/Index', ["roles" => $roles, "request" => $requestInputs]);
    }

    /**
     * Show the form for creating a new resource.
     *
     * @return Response
     * @throws AuthorizationException
     */
    public function create(): Response
    {
        $this->authorize("create", Role::class);

        return Inertia::render('Role/Add', [
            "permissions" => $this->permissionRepository->preparedPermissions()
        ]);
    }

    /**
     * Store a newly created resource in storage.
     *
     * @param StoreRoleRequest $request
     * @return RedirectResponse
     */
    public function store(StoreRoleRequest $request): RedirectResponse
    {
        $this->roleRepository->create($request->all());
        return redirect()->route('admin.roles.index')->with(["status" => $request["name"] . " Successfully Updated.", "success" => true]);
    }

    /**
     * Show the form for editing the specified resource.
     *
     * @param Role $role
     * @return Response
     * @throws AuthorizationException
     */
    public function edit(Role $role): Response
    {
        $this->authorize("update", $role);
        $role = $this->roleRepository->show($role);

        return Inertia::render('Role/Edit', [
            "role" => $role,
            "permissions" => $this->permissionRepository->preparedPermissions()]);
    }

    /**
     * Update the specified resource in storage.
     *
     * @param UpdateRoleRequest $request
     * @param Role $role
     * @return RedirectResponse
     */
    public function update(UpdateRoleRequest $request, Role $role): RedirectResponse
    {
        $this->roleRepository->edit($role, $request->all());
        return redirect()
            ->route('admin.roles.index')
            ->with(["status" => $request["name"] . "Successfully Updated", "success" => true]);
    }

    /**
     * Remove the specified resource from storage.
     *
     * @param Role $role
     * @return RedirectResponse
     * @throws AuthorizationException
     */
    public function destroy(Role $role): RedirectResponse
    {
        $this->authorize("delete", $role);
        $title = $role["name"];
        try {
            $role->delete();
        } catch (Exception $e) {
            return redirect()->back()->withErrors($e->getMessage());
        }
        return redirect()->back()->with(["status" => "$title Successfully Deleted", "success" => true]);
    }


}
