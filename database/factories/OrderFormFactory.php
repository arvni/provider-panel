<?php

namespace Database\Factories;

use App\Models\OrderForm;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<OrderForm>
 */
class OrderFormFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->unique()->words(2, true),
            'file' => '',
            'formData' => [
                ['label' => fake()->word(), 'type' => 'text'],
            ],
        ];
    }
}
