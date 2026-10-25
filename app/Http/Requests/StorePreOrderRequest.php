<?php

namespace App\Http\Requests;

use App\Enums\Nationality;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/** A new pre-order: who the patients are, and either the tests or a description of the case. */
class StorePreOrderRequest extends FormRequest
{
    public function authorize(): bool
    {
        return (bool) $this->user()?->referrer_id;
    }

    public function rules(): array
    {
        $userId = $this->user()->id;

        return [
            'start_mode' => ['required', Rule::in(['tests', 'describe'])],
            'start_hint' => ['nullable', Rule::in(['ivf_pgt', 'pregnancy', 'diagnosis', 'carrier', 'other'])],
            'referral_reason' => ['nullable', 'required_if:start_mode,describe', 'string', 'max:5000'],
            'patients' => ['required', 'array', 'min:1', 'max:10'],
            // Either one of this center's patients…
            'patients.*.id' => ['nullable', 'integer', Rule::exists('patients', 'id')->where('user_id', $userId)],
            // …or a new one.
            'patients.*.fullName' => ['required_without:patients.*.id', 'nullable', 'string', 'max:255'],
            'patients.*.gender' => ['required_without:patients.*.id', 'nullable', Rule::in(['-1', '0', '1', -1, 0, 1])],
            'patients.*.dateOfBirth' => ['required_without:patients.*.id', 'nullable', 'date_format:Y-m-d', 'before_or_equal:today'],
            'patients.*.nationality.code' => ['required_without:patients.*.id', 'nullable', function ($attribute, $value, $fail) {
                if ($value !== null && (new Nationality)($value) == -1) {
                    $fail('Please select a nationality.');
                }
            }],
            'patients.*.id_no' => ['nullable', 'string', 'max:64'],
            'patients.*.reference_id' => ['nullable', 'string', 'max:255'],
            'patients.*.relationship' => ['nullable', Rule::in(['self', 'spouse', 'partner', 'child', 'parent', 'sibling', 'fetus', 'other'])],
            'tests' => ['nullable', 'required_if:start_mode,tests', 'array', 'max:30'],
            // Only this center's tests that are switched on for pre-orders.
            'tests.*.id' => ['required', 'integer', Rule::exists('test_user', 'test_id')->where('user_id', $userId), Rule::exists('tests', 'id')->whereNotNull('flow_id')],
            'tests.*.patient_index' => ['nullable', 'integer', 'min:0', 'max:9'],
            'clinical' => ['nullable', 'array'],
            'clinical.indication' => ['nullable', 'string', 'max:2000'],
            'clinical.history' => ['nullable', 'string', 'max:5000'],
        ];
    }

    public function messages(): array
    {
        return [
            'referral_reason.required_if' => 'Describe the case so BION can choose the right test.',
            'tests.required_if' => 'Choose at least one test, or switch to "Describe the case".',
            'tests.*.id.exists' => 'This test is not available for pre-orders.',
        ];
    }
}
