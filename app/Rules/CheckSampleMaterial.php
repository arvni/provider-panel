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
        // Check if sample type requires material validation
        $sampleTypeId = $value["sample_type"]["id"] ?? null;
        if (!$sampleTypeId) {
            return; // No sample type provided, skip validation
        }

        $sampleTypeCheckNeeded = SampleType::query()
            ->where("id", $sampleTypeId)
            ->where("sample_id_required", true);

        if ($sampleTypeCheckNeeded->clone()->count()) {
            $barcode = $value["sampleId"] ?? "";

            // First check if material exists at all
            $materialExists = Material::query()->where("barcode", $barcode)->exists();
            if (!$materialExists) {
                $fail("Material with barcode '{$barcode}' not found in the system.");
                return;
            }

            // Then check if it belongs to current user
            $query = Material::query()
                ->where("barcode", $barcode)
                ->where("user_id", auth()->user()->id);

            if ($query->clone()->count() < 1) {
                $fail("Material with barcode '{$barcode}' does not belong to your account.");
                return;
            }

            // Finally check if it's already used by a different sample
            $currentSampleId = $value["id"] ?? null;

            $material = $query->whereHas("Sample", function ($q) use ($currentSampleId) {
                if ($currentSampleId) {
                    // Exclude current sample from check (allow editing existing sample)
                    $q->where("id", "!=", $currentSampleId);
                }
            });

            if ($material->count()) {
                if ($currentSampleId) {
                    $fail("Material with barcode '{$barcode}' has already been used by a different sample.");
                } else {
                    $fail("Material with barcode '{$barcode}' has already been used.");
                }
                return;
            }
        }
    }


}
