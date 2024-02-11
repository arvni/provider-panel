<?php

use App\Http\Controllers\Admin\ChangePasswordController;
use App\Http\Controllers\Admin\CollectRequestController;
use App\Http\Controllers\Admin\ConsentController;
use App\Http\Controllers\Admin\ConsentTermController;
use App\Http\Controllers\Admin\OrderFormController;
use App\Http\Controllers\Admin\PermissionController;
use App\Http\Controllers\Admin\RoleController;
use App\Http\Controllers\Admin\SampleTypeController;
use App\Http\Controllers\Admin\TestController;
use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\DownloadOrderSummaryController;
use App\Http\Controllers\GetFileController;
use App\Http\Controllers\ListTestController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\StoreCollectRequestController;
use App\Services\ApiService;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| contains the "web" middleware group. Now create something great!
|
*/

Route::get('/', function () {
    if (auth()->check())
        return redirect()->route("dashboard");
    return redirect()->route("login");
});


Route::middleware('auth')->group(function () {
    Route::get('/dashboard', function () {
        return Inertia::render('Dashboard');
    })->name('dashboard');
    Route::prefix("admin")->as("admin.")->group(function () {
        Route::resource("/users", UserController::class);
        Route::put("/change-password/{user}", ChangePasswordController::class)->name("users.updatePassword");
        Route::resource("/roles", RoleController::class);
        Route::resource("/permissions", PermissionController::class)->except(["create", "edit"]);
        Route::resource("/consentTerms", ConsentTermController::class)->except(["create", "edit"]);
        Route::resource("/consents", ConsentController::class)->except(["create", "edit"]);
        Route::resource("orderForms", OrderFormController::class)->except("show");
        Route::resource("collectRequests", CollectRequestController::class)->except(["edit", "update"]);
        Route::resource("sampleTypes", SampleTypeController::class);
        Route::resource("tests", TestController::class)->except("show");
    });
    Route::get("/files/{type}/{id}/{filename?}", GetFileController::class)->name("file");
    Route::post("orders/logistic", StoreCollectRequestController::class)->name("orders.logistic");
    Route::resource("orders", OrderController::class)->except(["edit", "update"]);
    Route::get("orders/{order}/edit/{step}", [OrderController::class, "edit"])->name("orders.edit");
    Route::put("orders/{order}/edit/{step}", [OrderController::class, "update"])->name("orders.update");
    Route::get("order-summary/{order}", DownloadOrderSummaryController::class)->name("order-summary");
    Route::get("tests", ListTestController::class)->name("tests.index");
});

Route::get("/test",function (){
    $collectRequest=\App\Models\CollectRequest::latest()->first();
    return \App\Services\RequestLogistic::send($collectRequest);
});

require __DIR__ . '/auth.php';
