<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\File;

class UpdateOrderFormRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return Gate::allows("update",$this->route()->parameter("orderForm"));
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array|string>
     */
    public function rules(): array
    {
        return [

            "formData"=>"required|array",
            "formData.*.label" => "required",
            "formData.*.type" => ["required",Rule::in(["text", "number", "checkbox", "select","date","description"])],
            "name"=>"required|unique:order_forms,name, ".$this->route()->parameter("orderForm")->id,
            "file" => ["required"],
        ];
    }
}
