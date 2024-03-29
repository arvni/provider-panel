<?php

namespace Database\Seeders;

// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            RoleAndPermissionSeeder::class,
            TestSeeder::class
        ]);

        if (User::query()->where("email", "admin@bion.com")->count() < 1)
            User::factory()->create([
                "email" => "admin@bion.com",
                "password" => Hash::make("586545B!0n"),
            ])->assignRole('Admin');


    }
}
