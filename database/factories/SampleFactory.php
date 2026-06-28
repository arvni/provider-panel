<?php

namespace Database\Factories;

use App\Models\Sample;
use App\Models\SampleType;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Sample>
 */
class SampleFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'sample_type_id' => SampleType::factory(),
            'collectionDate' => now()->toDateString(),
            'pooling' => false,
        ];
    }
}
