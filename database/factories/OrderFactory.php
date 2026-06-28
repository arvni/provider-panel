<?php

namespace Database\Factories;

use App\Enums\OrderStatus;
use App\Enums\OrderStep;
use App\Models\Order;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Order>
 */
class OrderFactory extends Factory
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
            'status' => OrderStatus::PENDING,
            'step' => OrderStep::PATIENT_DETAILS,
            'files' => [],
            'orderForms' => [],
            'consents' => [],
            'patient_ids' => [],
        ];
    }

    public function status(OrderStatus $status): static
    {
        return $this->state(fn () => ['status' => $status]);
    }
}
