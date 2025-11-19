<?php

namespace Database\Seeders;

use App\Models\Sample;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class SamplesTableSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        Sample::query()
            ->whereNull("patient_id")
            ->whereNotNull("order_id")
            ->with("Order.OrderItems")
            ->chunk(100, function ($samples) {
                foreach ($samples as $sample) {
                    $sample->OrderItems()->sync($sample->Order->OrderItems->pluck("id"));
                    $sample->Patient()->associate($sample->Order->main_patient_id);
                    if ($sample->isDirty())
                        $sample->save();
                }
            });
    }
}
