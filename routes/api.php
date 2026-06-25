<?php

use App\Http\Controllers\Api\CheckMaterialController;
use App\Http\Controllers\Api\ListConsentsController;
use App\Http\Controllers\Api\LisTestController;
use App\Http\Controllers\Api\ListInstructionsController;
use App\Http\Controllers\Api\ListOrderFormsController;
use App\Http\Controllers\Api\ListRolesController;
use App\Http\Controllers\Api\ListSampleTypesController;
use App\Http\Controllers\Webhook\CollectRequestUpdateWebhookController;
use App\Http\Controllers\Webhook\ConsentUpdateWebhookController;
use App\Http\Controllers\Webhook\InstructionUpdateWebhookController;
use App\Http\Controllers\Webhook\OrderFormUpdateWebhookController;
use App\Http\Controllers\Webhook\OrderImportController;
use App\Http\Controllers\Webhook\OrderMaterialImportWebhookController;
use App\Http\Controllers\Webhook\OrderMaterialUpdateWebhookController;
use App\Http\Controllers\Webhook\OrderUpdateWebhookController;
use App\Http\Controllers\Webhook\PatientWebhookController;
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
// Reference-data lookups consumed by the authenticated SPA. They are stateful
// Sanctum requests (session cookie), so require an authenticated user — these
// used to be public and leaked roles, tests, materials, etc. to anyone.
Route::middleware('auth:sanctum')->group(function () {
    Route::get('roles', ListRolesController::class)->name('api.roles.list');
    Route::get('sample-types', ListSampleTypesController::class)->name('api.sampleTypes.list');
    Route::get('consents', ListConsentsController::class)->name('api.consents.list');
    Route::get('instructions', ListInstructionsController::class)->name('api.instructions.list');
    Route::get('order-forms', ListOrderFormsController::class)->name('api.orderForms.list');
    Route::get('/tests', LisTestController::class)->name('api.tests.list');
    Route::get('/check-materials', CheckMaterialController::class)->name('api.check_materials');
});

// Webhooks from the main server. Each is authenticated by an HMAC-SHA256
// signature (see VerifyWebhookSignature); the scheme argument selects which byte
// sequence the signature is expected to cover for that endpoint.

// Signed over a canonical re-encode of the parsed input (json_encode($request->all())).
Route::middleware('verify.webhook:input')->group(function () {
    Route::post('/order-materials/', OrderMaterialImportWebhookController::class)->name('api.orderMaterials.import');
    Route::post('/order-materials/{orderMaterial}', OrderMaterialUpdateWebhookController::class)->name('api.orderMaterials.updateStatus');
    Route::post('/collect-requests/', CollectRequestUpdateWebhookController::class)->name('api.collect-request.update-by-webhook');
});

// Payload arrives as an uploaded JSON file named `data`; signed over a re-encode
// of its decoded contents.
Route::middleware('verify.webhook:file')->group(function () {
    Route::post('/request-forms/{orderFormID}', OrderFormUpdateWebhookController::class)->name('api.orderForms.update-by-webhook');
    Route::post('/consent-forms/{consentFormId}', ConsentUpdateWebhookController::class)->name('api.consents.update-by-webhook');
    Route::post('/instructions/{instructionId}', InstructionUpdateWebhookController::class)->name('api.instructions.update-by-webhook');
    Route::post('/sample-types/{sampleTypeId}', SampleTypeUpdateWebhookController::class)->name('api.sample-types.update-by-webhook');
});

// Signed over the raw request body.
Route::middleware('verify.webhook:raw')->group(function () {
    // Order import webhook
    Route::post('/webhooks/orders/import', [OrderImportController::class, 'import'])->name('api.webhooks.orders.import');
    // Order update webhook (upserts the order, its items/samples and the collect request)
    Route::post('/orders/webhook/update', [OrderUpdateWebhookController::class, 'update'])->name('api.orders.update-by-webhook');
    // Patient webhook (upserts a referrer-order patient and links it to the local order)
    Route::post('/patients/webhook', [PatientWebhookController::class, 'store'])->name('api.patients.update-by-webhook');
});
