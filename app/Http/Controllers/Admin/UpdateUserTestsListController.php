<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;

class UpdateUserTestsListController extends Controller
{
    /**
     * Handle the incoming request.
     */
    public function __invoke(User $user, Request $request)
    {
        $user->Tests()->sync(Arr::pluck($request->get("tests"),"id"));
        return redirect()->route("admin.users.index");
    }
}
