<?php

namespace App\Http\Controllers\Admin;


use App\Http\Controllers\Controller;
use App\Http\Requests\StorePermissionRequest;
use App\Http\Requests\UpdatePermissionRequest;
use App\Http\Resources\Api\PermissionResource;
use App\Interfaces\PermissionRepositoryInterface;
use App\Models\Permission;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class PermissionController extends Controller
{
    protected PermissionRepositoryInterface $permissionRepository;

    public function __construct(PermissionRepositoryInterface $permissionRepository)
    {
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
        $this->authorize("viewAny", Permission::class);
        $requestInputs = $request->all();
        $permissions = fn() => $this->permissionRepository->list($requestInputs);
        $data = ["permissions" => $permissions, "request" => $requestInputs];
        return Inertia::render('Permission/Index', $data);
    }

    /**
     * Store a newly created resource in storage.
     *
     * @param StorePermissionRequest $request
     * @return RedirectResponse
     */
    public function store(StorePermissionRequest $request): RedirectResponse
    {
        $this->permissionRepository->create($request->all());
        return redirect()->back()->with(["status" => $request["name"] . " permission successfully Added", "success" => true]);
    }

    /**
     * show a newly created resource in storage.
     *
     * @param Permission $permission
     * @return PermissionResource
     */
    public function show(Permission $permission): PermissionResource
    {
        $permission=$this->permissionRepository->show($permission);
        return new PermissionResource($permission);
    }

    /**
     * Update the specified resource in storage.
     *
     * @param UpdatePermissionRequest $request
     * @param Permission $permission
     * @return RedirectResponse
     * @throws Throwable
     */
    public function update(UpdatePermissionRequest $request, Permission $permission): RedirectResponse
    {
        $permission->update(["name" => $request->get('name')]);
        return redirect()->back()->with(["status" => $request["name"] . " permission successfully Updated", "success" => true]);
    }

    /**
     * Remove the specified resource from storage.
     *
     * @param Permission $permission
     * @return RedirectResponse
     * @throws AuthorizationException
     */
    public function destroy(Permission $permission): RedirectResponse
    {
        $this->authorize("delete", $permission);
        $title = $permission->name;
        if (!$permission->roles()->count()) {
            $permission->delete();
            return redirect()->back()->with(["status" => __("messages.successfullyUpdated", ["type" => "Consent", "title" => $title])]);
        } else
            return redirect()->back()->withErrors(["error" => "$title permission has man roles"]);
    }
}
