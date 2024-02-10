<?php

namespace App\Http\Requests;

use App\Enums\Nationality;
use App\Enums\OrderStep;
use App\Rules\CheckSamples;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateOrderRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
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
                return [
                    "id" => "exists:patients,id",
                    "consanguineousParents" => "required|boolean",
                    "fullName" => "required",
                    "gender" => ["required", Rule::in(["-1", "0", "1", -1, 0, 1])],
                    "dateOfBirth" => "required|date_format:Y-m-d|before:today",
                    "nationality.code" => ["required", function ($attribute, $value, $fail) {
                        if ((new Nationality)($value) == -1)
                            $fail("Please Select A nationality");
                    }]
                ];
            case OrderStep::SAMPLE_DETAILS:
                return [
                    "samples" => ["required", new CheckSamples($this->route()->parameter("order"))],
                    "samples.*.collectionDate" => "required|date|before_or_equal:today",
                ];
            default:
                return [];
        }
    }
}
