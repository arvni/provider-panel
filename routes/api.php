<?php

use App\Http\Controllers\Api\CheckMaterialController;
use App\Http\Controllers\Api\ListConsentsController;
use App\Http\Controllers\Api\LisTestController;
use App\Http\Controllers\Api\ListInstructionsController;
use App\Http\Controllers\Api\ListOrderFormsController;
use App\Http\Controllers\Api\ListRolesController;
use App\Http\Controllers\Api\ListSampleTypesController;
use App\Http\Controllers\Webhook\ConsentUpdateWebhookController;
use App\Http\Controllers\Webhook\InstructionUpdateWebhookController;
use App\Http\Controllers\Webhook\OrderFormUpdateWebhookController;
use App\Http\Controllers\Webhook\OrderMaterialUpdateWebhookController;
use App\Http\Controllers\Webhook\SampleTypeUpdateWebhookController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/
Route::get("roles", ListRolesController::class)->name("api.roles.list");
Route::get("sample-types", ListSampleTypesController::class)->name("api.sampleTypes.list");
Route::get("consents", ListConsentsController::class)->name("api.consents.list");
Route::get("instructions", ListInstructionsController::class)->name("api.instructions.list");
Route::get("order-forms", ListOrderFormsController::class)->name("api.orderForms.list");
Route::get("/tests", LisTestController::class)->name("api.tests.list");
Route::get("/check-materials", CheckMaterialController::class)->name("api.check_materials");

Route::post("/order-materials/{orderMaterial}", OrderMaterialUpdateWebhookController::class)->name("api.orderMaterials.updateStatus");
Route::post("/request-forms/{orderFormID}", OrderFormUpdateWebhookController::class)->name("api.orderForms.update-by-webhook");
Route::post("/consent-forms/{consentFormId}", ConsentUpdateWebhookController::class)->name("api.consents.update-by-webhook");
Route::post("/instructions/{instructionId}", InstructionUpdateWebhookController::class)->name("api.instructions.update-by-webhook");
Route::post("/sample-types/{sampleTypeId}", SampleTypeUpdateWebhookController::class)->name("api.sa,ple-types.update-by-webhook");
