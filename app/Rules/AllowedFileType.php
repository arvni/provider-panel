<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Http\UploadedFile;
use Illuminate\Translation\PotentiallyTranslatedString;

/**
 * Accepts an upload only when its name and its content agree on a type from
 * the given allow-list. @see SafeUpload for the list itself.
 */
class AllowedFileType implements ValidationRule
{
    /**
     * @param  array<int, string>  $extensions
     */
    public function __construct(private array $extensions) {}

    /**
     * Run the validation rule.
     *
     * @param  Closure(string): PotentiallyTranslatedString  $fail
     */
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (! $value instanceof UploadedFile || ! $value->isValid()) {
            $fail('validation.uploaded')->translate();

            return;
        }

        if (SafeUpload::resolveExtension($value, $this->extensions) === null) {
            $fail('validation.mimes')->translate([
                'values' => implode(', ', $this->extensions),
            ]);
        }
    }
}
