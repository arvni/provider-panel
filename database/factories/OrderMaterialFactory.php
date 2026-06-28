<?php

namespace Database\Factories;

use App\Enums\OrderMaterialStatus;
use App\Models\OrderMaterial;
use App\Models\SampleType;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<OrderMaterial>
 */
class OrderMaterialFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'sample_type_id' => SampleType::factory(),
            'amount' => fake()->numberBetween(1, 10),
            'status' => OrderMaterialStatus::GENERATED->value,
        ];
    }
}
