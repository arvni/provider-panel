<?php

namespace App\Enums;

enum RelationType: string
{
    case MOTHER = 'Mother';
    case FATHER = 'Father';
    case SIBLING = 'Sibling';
    case SPOUSE = 'Spouse';
    case CHILD = 'Child';
    case TWIN = 'Twin';
    case PARTNER = 'Partner';
    case OTHER = 'Other';

    /**
     * Get all relation types as array
     */
    public static function toArray(): array
    {
        return array_map(fn($case) => $case->value, self::cases());
    }

    /**
     * Get relation types suitable for select options
     */
    public static function options(): array
    {
        return array_map(fn($case) => [
            'value' => $case->value,
            'label' => $case->value
        ], self::cases());
    }
}
