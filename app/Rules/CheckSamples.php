<?php

namespace App\Rules;

use App\Models\Order;
use App\Models\SampleType;
use App\Models\Test;
use Closure;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Translation\PotentiallyTranslatedString;
use Illuminate\Validation\Validator;
use Sabberworm\CSS\Rule\Rule;

class CheckSamples implements ValidationRule
{
    private Order $order;

    public function __construct(Order $order)
    {
        $this->order = $order;
    }
    /**
     * Run the validation rule.
     *
     * @param Closure(string): PotentiallyTranslatedString $fail
     */
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        $tests = $this->order->Tests()->with("SampleTypes")->get();
        $sampleTypesId=array_map(fn($item)=>$item["sample_type"]["id"],$value);
        foreach ($tests as $test){
            if($test->SampleTypes->whereIn("id",$sampleTypesId)->count()>0) {
                $fail("Please select a sample type that related to the $test->name and these sample types will be acceptable: " . implode(", ", array_map(fn($b) => $b["sample_type"]["name"], $test->SampleTypes->toArray())));
            }
        }
    }
}
