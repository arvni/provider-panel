<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;

class SyncReferrersController extends Controller
{
    /**
     * Handle the incoming request.
     */
    public function __invoke()
    {
        $this->authorize("sync", User::class);
        Artisan::call("sync:referrers");
        return back()->with(["message" => "sync successfully done", "success" => true]);
    }
}
