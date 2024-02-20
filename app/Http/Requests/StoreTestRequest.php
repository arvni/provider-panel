<?php

namespace App\Http\Requests;

use App\Models\Test;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;

class StoreTestRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return Gate::allows("create", Test::class);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array|string>
     */
    public function rules(): array
    {
        return [
            "name" => "required|unique:tests,name",
            "shortName" => "required|unique:tests,shortName",
            "code" => "required|unique:tests,code",
            "turnaroundTime" => "required|min:0.1",
            "description" => "required|min:0.1",
            "consent.id" => "exists:consents,id",
            "instruction.id" => "exists:instructions,id",
            "order_form.id" => "exists:order_forms,id",
            "sample_types" => "required|array|min:1",
            "sample_types.*.sample_type.id" => "required|exists:sample_types,id",
            "sample_types.*.description" => "required|min:0.1",
        ];
    }
}
