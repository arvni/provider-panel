<?php

namespace App\Http\Requests;

use App\Models\Consent;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rules\File;

class StoreConsentRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return Gate::allows("create", Consent::class);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            "file" => ["required", File::types(["pdf", "jpg", "jpeg", "png", "doc", "docx"])->min("100kb")->max("10mb")],
            "name" => "required|unique:consents,name"
        ];
    }
}
