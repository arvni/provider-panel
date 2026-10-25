<?php

namespace App\Rules;

use App\Models\Test;
use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

/**
 * A test switched on for pre-orders is ordered through a pre-order: BION reviews the case first.
 * The order wizard hides these tests; this keeps a hand-made request from adding one anyway.
 */
class DirectOrderTest implements ValidationRule
{
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (Test::query()->whereKey($value)->whereNotNull('flow_id')->exists()) {
            $fail('This test is ordered through a pre-order. Start a pre-order instead.');
        }
    }
}
