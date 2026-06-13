<?php

namespace App\Http\Controllers\Webhook;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Patient;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Contracts\Validation\Validator as ValidatorContract;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Throwable;

/**
 * Handle patient sync webhooks from the main server.
 *
 * Fired when a patient (or relative) is added to a referrer order on the main
 * server. The patient is upserted for the referrer's provider user (keyed by
 * server_id, falling back to id_no) and, when the referrer order has already
 * been synced to a local order, linked to that order — promoted to the order's
 * main patient when the payload flags it as such.
 */
class PatientWebhookController extends Controller
{
    /**
     * Handle the incoming patient webhook.
     *
     * @throws Throwable
     */
    public function store(Request $request): JsonResponse
    {
        // Verify webhook signature against the raw body, matching the order webhooks.
        $signature = $request->header('X-Webhook-Signature');
        $expectedSignature = hash_hmac('sha256', $request->getContent(), config('webhook.secret'));
        if (!hash_equals((string) $signature, $expectedSignature)) {
            Log::warning('Patient webhook signature mismatch');
            return response()->json(['error' => 'Invalid signature'], 401);
        }

        $validator = $this->validatePayload($request);
        if ($validator->fails()) {
            Log::warning('Patient webhook validation failed', [
                'errors' => $validator->errors()->toArray(),
                'order_id' => $request->input('order_id'),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $data = $validator->validated();

        $user = User::where('referrer_id', $data['referrer_id'])->first();
        if (!$user) {
            Log::warning('Patient webhook referrer not found', ['referrer_id' => $data['referrer_id']]);
            return response()->json(['success' => false, 'message' => 'Referrer not found'], 422);
        }

        try {
            $result = DB::transaction(function () use ($data, $user) {
                $patient = $this->createOrUpdatePatient($data['patient'], $user->id);

                $order = $this->linkToOrder(
                    $data['order_id'] ?? null,
                    $user->id,
                    $patient,
                    (bool) ($data['patient']['is_main'] ?? false),
                );

                return ['patient' => $patient, 'order' => $order];
            });
        } catch (Throwable $e) {
            Log::error('Patient webhook processing failed', [
                'order_id' => $data['order_id'] ?? null,
                'referrer_id' => $data['referrer_id'],
                'error' => $e->getMessage(),
            ]);
            throw $e;
        }

        return response()->json([
            'success' => true,
            'patient_id' => $result['patient']->id,
            'order_id' => $result['order']?->id,
        ]);
    }

    /**
     * Validate the incoming payload, mirroring the patient block of the order webhooks.
     */
    private function validatePayload(Request $request): ValidatorContract
    {
        return Validator::make($request->all(), [
            'order_id' => 'nullable|integer',
            'referrer_id' => 'required|integer|exists:users,referrer_id',

            'patient' => 'required|array',
            'patient.id' => 'nullable',
            'patient.fullName' => 'required|string',
            'patient.nationality' => 'required',
            'patient.dateOfBirth' => 'nullable|date',
            'patient.gender' => 'required|in:-1,0,1',
            'patient.idNo' => 'nullable|string',
            'patient.id_no' => 'nullable|string',
            'patient.is_main' => 'nullable|boolean',
        ]);
    }

    /**
     * Create or update a patient, keyed by server_id then id_no.
     *
     * Mirrors OrderUpdateWebhookController::createOrUpdatePatient so a patient
     * synced through either path resolves to the same local record.
     */
    private function createOrUpdatePatient(array $patientData, int $userId): Patient
    {
        $query = Patient::where('user_id', $userId);

        if (!empty($patientData['id'])) {
            $query->where('server_id', $patientData['id']);
        } elseif (!empty($patientData['id_no']) || !empty($patientData['idNo'])) {
            $query->where('id_no', $patientData['id_no'] ?? $patientData['idNo']);
        } else {
            $query = null;
        }

        $patient = $query ? $query->first() : null;

        $attributes = [
            'user_id' => $userId,
            'server_id' => $patientData['id'] ?? null,
            'fullName' => $patientData['fullName'],
            'nationality' => $patientData['nationality'],
            'dateOfBirth' => !empty($patientData['dateOfBirth'])
                ? Carbon::parse($patientData['dateOfBirth'])->format('Y-m-d')
                : null,
            'gender' => $patientData['gender'],
            'reference_id' => $patientData['reference_id'] ?? null,
            'id_no' => $patientData['id_no'] ?? $patientData['idNo'] ?? null,
        ];

        if ($patient) {
            $patient->fill($attributes);
            if ($patient->isDirty()) {
                $patient->save();
            }

            return $patient;
        }

        return Patient::create($attributes);
    }

    /**
     * Link the patient to the referrer's local order when it has already synced.
     *
     * The order may not exist yet (the patient can be created before the order
     * reaches the provider); in that case the upsert above still stands and the
     * later order webhook will carry the patient in its own payload.
     */
    private function linkToOrder(?int $orderId, int $userId, Patient $patient, bool $isMain): ?Order
    {
        if (!$orderId) {
            return null;
        }

        $order = Order::where('id', $orderId)->where('user_id', $userId)->first();
        if (!$order) {
            return null;
        }

        $patientIds = $order->patient_ids ?? [];
        if (!in_array($patient->id, $patientIds, true)) {
            $patientIds[] = $patient->id;
        }

        $order->patient_ids = array_values($patientIds);
        if ($isMain) {
            $order->main_patient_id = $patient->id;
        }

        if ($order->isDirty()) {
            $order->save();
        }

        return $order;
    }
}
