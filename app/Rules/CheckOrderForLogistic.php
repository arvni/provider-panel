<?php

namespace App\Rules;

use App\Enums\OrderStatus;
use App\Interfaces\OrderRepositoryInterface;
use Closure;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Translation\PotentiallyTranslatedString;

class CheckOrderForLogistic implements ValidationRule
{
    /**
     * Run the validation rule.
     *
     * @param Closure(string): PotentiallyTranslatedString $fail
     */
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        $orderRepository = app(OrderRepositoryInterface::class);
        $order = $orderRepository->getById($value);
        if ($order->status !== OrderStatus::REQUESTED)
            $fail("the order status must be in requested");
    }
}
