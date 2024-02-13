<?php

namespace App\Rules;

use App\Models\Order;
use Closure;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Translation\PotentiallyTranslatedString;

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
        $this->checkTestsSampleType($tests,$sampleTypesId,$fail);
    }
    protected function checkTestsSampleType($tests,array $sampleTypesId, Closure $fail)
    {
        foreach ($tests as $test){
            if($test->SampleTypes->whereIn("id",$sampleTypesId)->count()>0) {
                $fail("Please select a sample type that related to the $test->name and these sample types will be acceptable: " . implode(", ", array_map(fn($b) => $b["sample_type"]["name"], $test->SampleTypes->toArray())));
            }
        }
    }
}
