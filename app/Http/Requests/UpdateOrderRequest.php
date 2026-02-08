<?php

namespace App\Http\Requests;

use App\Enums\Nationality;
use App\Enums\OrderStep;
use App\Rules\CheckSampleMaterial;
use App\Rules\CheckSamples;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;

class UpdateOrderRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return Gate::allows("update", $this->route()->parameter("order"));
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array|string>
     */
    public function rules(): array
    {
        $step = $this->route()->parameter("step");
        switch ($step) {
            case OrderStep::PATIENT_DETAILS:
                // Support both single patient (backward compatibility) and multiple patients array
                if ($this->has('patients')) {
                    return [
                        "patients" => "required|array|min:1",
                        "patients.*.id" => "sometimes|exists:patients,id",
                        "patients.*.consanguineousParents" => ["required", Rule::in(["-1", "0", "1", -1, 0, 1])],
                        "patients.*.fullName" => "required",
                        "patients.*.gender" => ["required", Rule::in(["-1", "0", "1", -1, 0, 1])],
                        "patients.*.dateOfBirth" => "required|date_format:Y-m-d|before:today",
                        "patients.*.nationality.code" => ["required", function ($attribute, $value, $fail) {
                            if ((new Nationality)($value) == -1)
                                $fail("Please Select A nationality");
                        }]
                    ];
                } else {
                    // Backward compatibility: single patient format
                    return [
                        "id" => "exists:patients,id",
                        "consanguineousParents" => ["required", Rule::in(["-1", "0", "1", -1, 0, 1])],
                        "fullName" => "required",
                        "gender" => ["required", Rule::in(["-1", "0", "1", -1, 0, 1])],
                        "dateOfBirth" => "required|date_format:Y-m-d|before:today",
                        "nationality.code" => ["required", function ($attribute, $value, $fail) {
                            if ((new Nationality)($value) == -1)
                                $fail("Please Select A nationality");
                        }]
                    ];
                }
            case OrderStep::SAMPLE_DETAILS:
                return [
                    "samples" => ["required", new CheckSamples($this->route()->parameter("order"))],
                    "samples.*" => ["required", new CheckSampleMaterial()],
                    "samples.*.collectionDate" => "required|date|before_or_equal:today",
                    "samples.*.pooling" => "boolean",
                ];
            default:
                return [];
        }
    }
}
