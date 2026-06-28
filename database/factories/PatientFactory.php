<?php

namespace Database\Factories;

use App\Enums\ConsanguineousParents;
use App\Enums\Gender;
use App\Models\Patient;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Patient>
 */
class PatientFactory extends Factory
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
            'fullName' => fake()->name(),
            'nationality' => 'IR',
            'dateOfBirth' => fake()->date('Y-m-d', '-20 years'),
            'gender' => fake()->randomElement(Gender::cases())->value,
            'consanguineousParents' => ConsanguineousParents::NO->value,
            'isFetus' => false,
        ];
    }
}
