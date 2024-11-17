<?php

namespace App\Http\Requests;

use App\Rules\CheckOrderForLogistic;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class LogisticRequest extends FormRequest
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
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            "selectedOrders" => "required|array|min:1",
            "selectedOrders.*" => ["exists:orders,id", new CheckOrderForLogistic],
            "preferred_date" => ["required", "date", "after_or_equal:today"],
        ];
    }
}
