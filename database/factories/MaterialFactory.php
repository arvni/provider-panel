<?php

namespace Database\Factories;

use App\Models\Material;
use App\Models\OrderMaterial;
use App\Models\SampleType;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Material>
 */
class MaterialFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'order_material_id' => OrderMaterial::factory(),
            'sample_type_id' => SampleType::factory(),
            'user_id' => User::factory(),
            'barcode' => fake()->unique()->ean13(),
            'expire_date' => now()->addYear(),
        ];
    }
}
