<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Validation for a logistic request raised without an order. The provider first
 * says what they need: a pickup for the collectable sample types they already
 * have, or kits — each with its own quantity — sent out to them.
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
     * How many different kits one request may ask for. Every kit becomes its
     * own order material for the lab to make up, so this is a sanity bound on
     * a hand-filled form rather than a rule anyone should meet in practice.
     */
    public const MAX_KIT_TYPES = 20;

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

            // Ordering: one or more kits, each named once and only from the
            // types the lab offers, each with its own quantity.
            'kits' => [
                'exclude_unless:mode,'.self::MODE_ORDER,
                'required',
                'array',
                'min:1',
                'max:'.self::MAX_KIT_TYPES,
            ],
            'kits.*.sample_type' => [
                'required',
                'integer',
                'distinct',
                Rule::exists('sample_types', 'id')->where('orderable', true),
            ],
            'kits.*.amount' => [
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
            'kits.required' => __('Please choose at least one kit.'),
            'kits.min' => __('Please choose at least one kit.'),
            'kits.max' => __('Please choose no more than :max kits.'),
            'kits.*.sample_type.required' => __('Please choose a kit.'),
            'kits.*.sample_type.distinct' => __('Please choose each kit only once.'),
            'kits.*.amount.required' => __('Please choose how many kits you need.'),
            'sample_types.required' => __('Please select at least one sample type.'),
            'sample_types.min' => __('Please select at least one sample type.'),
        ];
    }
}
