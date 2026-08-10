<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Validation for a collect request raised without an order: the provider only
 * declares which sample types they have ready, when they want them picked up
 * and, optionally, a comment.
 */
class StoreStandaloneCollectRequestRequest extends FormRequest
{
    /**
     * Access is gated by the route's providerAccess middleware.
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
            'sample_types' => ['required', 'array', 'min:1'],
            // Only orderable types are offered on the form, so only they are accepted.
            'sample_types.*' => [
                'integer',
                'distinct',
                Rule::exists('sample_types', 'id')->where('orderable', true),
            ],
            'preferred_date' => ['required', 'date', 'after_or_equal:today'],
            'comment' => ['nullable', 'string', 'max:1000'],
        ];
    }

    public function messages(): array
    {
        return [
            'sample_types.required' => __('Please select at least one sample type.'),
            'sample_types.min' => __('Please select at least one sample type.'),
        ];
    }
}
