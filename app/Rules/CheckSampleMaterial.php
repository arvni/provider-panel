<?php

namespace App\Rules;

use App\Models\Material;
use App\Models\SampleType;
use Closure;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Translation\PotentiallyTranslatedString;

class CheckSampleMaterial implements ValidationRule
{
    /**
     * Run the validation rule.
     *
     * @param Closure(string): PotentiallyTranslatedString $fail
     */
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        $sampleTypeCheckNeeded = SampleType::query()->where("id", $value["sample_type"]["id"])->where("sample_id_required", true);
        $query = Material::query()->where("barcode", $value["sampleId"])->where("user_id", auth()->user()->id);
        if ($query->clone()->count() < 1)
            $fail("There isn't any Material With this sample ID");
        if ($sampleTypeCheckNeeded->clone()->count()) {
            $material = $query->whereHas("Sample", function ($q) use ($value) {
                $q->whereNot("id", $value["id"] ?? null);
            });
            if ($material->count())
                $fail("this material used before");
        }
    }


}
