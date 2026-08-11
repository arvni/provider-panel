<?php

namespace App\Http\Requests;

use App\Enums\OrderStatus;
use App\Models\CollectRequest;
use App\Models\Order;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;

/**
 * Validation for a collect request an admin raises on behalf of a provider:
 * the provider is chosen explicitly and only that provider's still-collectable
 * orders may be attached to it.
 */
class StoreCollectRequestRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return Gate::allows('create', CollectRequest::class);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'user_id' => ['required', 'integer', Rule::exists('users', 'id')],
            'selectedOrders' => ['required', 'array', 'min:1'],
            'selectedOrders.*' => ['integer', 'distinct', Rule::exists('orders', 'id')],
            'preferred_date' => ['required', 'date', 'after_or_equal:today'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ];
    }

    /**
     * Every selected order must belong to the chosen provider and still be
     * collectable — requested, and not already tied to another collect request.
     *
     * @return array<int, callable>
     */
    public function after(): array
    {
        return [
            function (Validator $validator) {
                if ($validator->errors()->isNotEmpty()) {
                    return;
                }

                $orderIds = array_map('intval', $this->input('selectedOrders', []));
                $collectable = Order::whereIn('id', $orderIds)
                    ->where('user_id', $this->integer('user_id'))
                    ->where('status', OrderStatus::REQUESTED)
                    ->whereNull('collect_request_id')
                    ->pluck('id')
                    ->all();

                if (count($collectable) !== count($orderIds)) {
                    $validator->errors()->add(
                        'selectedOrders',
                        __('Some of the selected orders do not belong to this provider or are no longer available for collection.')
                    );
                }
            },
        ];
    }

    public function messages(): array
    {
        return [
            'user_id.required' => __('Please choose the provider this collection request is for.'),
            'selectedOrders.required' => __('Please select at least one order.'),
            'selectedOrders.min' => __('Please select at least one order.'),
        ];
    }
}
