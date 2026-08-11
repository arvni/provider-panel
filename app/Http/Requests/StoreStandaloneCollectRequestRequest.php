<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Validation for a logistic request raised without an order. The provider first
 * says what they need: a pickup for the collectable sample types they already
 * have, or one kit — with a quantity — sent out to them.
 */
class StoreStandaloneCollectRequestRequest extends FormRequest
{
    public const MODE_COLLECT = 'collect';

    public const MODE_ORDER = 'order';

    /**
     * The largest kit quantity the form offers, mirrored from the Order
     * Materials form so both routes to a material agree.
     */
    public const MAX_KIT_AMOUNT = 100;

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
            'mode' => ['required', Rule::in([self::MODE_COLLECT, self::MODE_ORDER])],
            'preferred_date' => ['required', 'date', 'after_or_equal:today'],
            'comment' => ['nullable', 'string', 'max:1000'],

            // Ordering: exactly one kit, and only a type the lab offers.
            'kit_sample_type' => [
                'exclude_unless:mode,'.self::MODE_ORDER,
                'required',
                'integer',
                Rule::exists('sample_types', 'id')->where('orderable', true),
            ],
            'kit_amount' => [
                'exclude_unless:mode,'.self::MODE_ORDER,
                'required',
                'integer',
                'min:1',
                'max:'.self::MAX_KIT_AMOUNT,
            ],

            // Collecting: every type waiting for pickup, and only ones an admin
            // has marked collectable.
            'sample_types' => ['exclude_unless:mode,'.self::MODE_COLLECT, 'required', 'array', 'min:1'],
            'sample_types.*' => [
                'integer',
                'distinct',
                Rule::exists('sample_types', 'id')->where('collectable', true),
            ],
        ];
    }

    /**
     * Ordering a kit is a separate permission from raising a logistic request,
     * so a provider who only holds the latter cannot slip one in.
     */
    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            if ($this->input('mode') === self::MODE_ORDER && ! $this->user()->hasAccess('OrderMaterial.Create')) {
                $validator->errors()->add('mode', __('You are not allowed to order kits.'));
            }
        });
    }

    public function messages(): array
    {
        return [
            'mode.required' => __('Please choose what you need.'),
            'kit_sample_type.required' => __('Please choose a kit.'),
            'kit_amount.required' => __('Please choose how many kits you need.'),
            'sample_types.required' => __('Please select at least one sample type.'),
            'sample_types.min' => __('Please select at least one sample type.'),
        ];
    }
}
