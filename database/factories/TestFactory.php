<?php

namespace Database\Factories;

use App\Models\Test;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Test>
 */
class TestFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            "name" => fake()->domainName(),
            "code" => fake()->unique()->postcode(),
            "shortName" => fake()->currencyCode() . fake()->buildingNumber(),
            "description" => fake()->paragraph(),
            "turnaroundTime" => fake()->numberBetween(),
        ];
    }
}
