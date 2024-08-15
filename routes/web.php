<?php

use App\Http\Controllers\AddOrderByBarcodeController;
use App\Http\Controllers\Admin\ChangePasswordController;
use App\Http\Controllers\Admin\CollectRequestController;
use App\Http\Controllers\Admin\ConsentController;
use App\Http\Controllers\Admin\ConsentTermController;
use App\Http\Controllers\Admin\EditUserTestsListController;
use App\Http\Controllers\Admin\ExportExcelMaterialsController;
use App\Http\Controllers\Admin\GenerateMaterialController;
use App\Http\Controllers\Admin\InstructionController;
use App\Http\Controllers\Admin\OrderFormController;
use App\Http\Controllers\Admin\PermissionController;
use App\Http\Controllers\Admin\RoleController;
use App\Http\Controllers\Admin\SampleTypeController;
use App\Http\Controllers\Admin\SyncReferrersController;
use App\Http\Controllers\Admin\TestController;
use App\Http\Controllers\Admin\UpdateUserTestsListController;
use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\Api\ListUserTestsController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\DownloadOrderSummaryController;
use App\Http\Controllers\DownloadReportController;
use App\Http\Controllers\GetFileController;
use App\Http\Controllers\ListTestController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\OrderMaterialController;
use App\Http\Controllers\Admin\OrderMaterialController as OrderMaterialAdminController;
use App\Http\Controllers\StoreCollectRequestController;
use App\Models\CollectRequest;
use App\Services\RequestLogistic;
use Illuminate\Support\Facades\Route;

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
    Route::get('/dashboard', DashboardController::class)->name('dashboard');
    Route::prefix("admin")->as("admin.")->group(function () {
        Route::post("/users/sync", SyncReferrersController::class)->name("users.sync");
        Route::get("/users/{user}/tests", EditUserTestsListController::class)->name("users.tests.edit");
        Route::put("/users/{user}/tests", UpdateUserTestsListController::class)->name("users.tests.update");
        Route::resource("/users", UserController::class);
        Route::put("/change-password/{user}", ChangePasswordController::class)->name("users.updatePassword");
        Route::resource("/roles", RoleController::class);
        Route::resource("/permissions", PermissionController::class)->except(["create", "edit"]);
        Route::resource("/consentTerms", ConsentTermController::class)->except(["create", "edit"]);
        Route::resource("/consents", ConsentController::class)->except(["create", "edit"]);
        Route::resource("/instructions", InstructionController::class)->except(["create", "edit"]);
        Route::resource("orderForms", OrderFormController::class)->except("show");
        Route::resource("collectRequests", CollectRequestController::class)->except(["edit"]);
        Route::resource("sampleTypes", SampleTypeController::class);
        Route::resource("tests", TestController::class)->except("show");
        Route::resource("orderMaterials", OrderMaterialAdminController::class)->only(["show", "index", "destroy"]);
        Route::get("/materials", ExportExcelMaterialsController::class)->name("materials");
        Route::post("orderMaterials/{orderMaterial}/generate-material", GenerateMaterialController::class)->name("orderMaterials.generate");
    });
    Route::get("/files/{type}/{id}/{filename?}", GetFileController::class)->name("file");
    Route::post("orders/logistic", StoreCollectRequestController::class)->name("orders.logistic");
    Route::post("orders/create-by-barcode", AddOrderByBarcodeController::class)->name("orders.create-by-barcode");
    Route::resource("orders", OrderController::class)->except(["edit", "update"]);
    Route::resource("orderMaterials", OrderMaterialController::class)->except(["edit", "update", "destroy", "create"]);
    Route::get("orders/{order}/report", DownloadReportController::class)->name("orders.report");
    Route::get("orders/{order}/edit/{step}", [OrderController::class, "edit"])->name("orders.edit");
    Route::put("orders/{order}/edit/{step}", [OrderController::class, "update"])->name("orders.update");
    Route::get("order-summary/{order}", DownloadOrderSummaryController::class)->name("order-summary");
    Route::get("/tests/list", ListUserTestsController::class)->name("api.user.tests.list");
    Route::get("tests", ListTestController::class)->name("tests.index");
});

require __DIR__ . '/auth.php';
