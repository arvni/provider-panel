<?php

namespace Database\Seeders;

use App\Models\OrderItem;
use Illuminate\Database\Seeder;

class OrderItemPatientTableSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        OrderItem::query()
            ->whereDoesntHave("Patients")
            ->with("Order")->chunk(100, function ($orderItems) {
                foreach ($orderItems as $orderItem) {
                    $orderItem->Patients()->sync($orderItem->Order->main_patient_id);
                    if ($orderItem->isDirty())
                        $orderItem->save();
                }
            });
    }
}
