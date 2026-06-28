<?php

namespace Database\Factories;

use App\Models\SampleType;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<SampleType>
 */
class SampleTypeFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->unique()->word(),
            'sample_id_required' => false,
            'orderable' => true,
        ];
    }

    public function requiresSampleId(): static
    {
        return $this->state(fn () => ['sample_id_required' => true]);
    }
}
