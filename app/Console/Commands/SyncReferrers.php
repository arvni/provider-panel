<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Services\ApiService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;

class SyncReferrers extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'sync:referrers';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Sync Referrers List with the lis server';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info("fetch referrers from server :" . config("api.referrers_path"));
        $data = ApiService::get(config("api.referrers_path"));

        if ($data->ok()) {
            $referrers = $data->json();
            foreach ($referrers["data"] as $referrer) {
                $user = User::where("referrer_id", $referrer["id"])->first();
                if ($user) {
                    if (isset($referrer["billingInfo"]))
                        $user->meta = [...$user->meta, "billing" => $referrer["billingInfo"]];
                    if (isset($referrer["contactInfo"]))
                        $user->meta = [...$user->meta, "contact" => $referrer["contactInfo"]];
                    $user->active = $referrer["isActive"];
                    if ($user->isDirty())
                        $user->save();
                } else {
                    $user = User::create([
                        'name' => $referrer["name"],
                        'email' => $referrer["email"],
                        'email_verified_at' => now(),
                        'password' => Hash::make("P@ssw0rd"),
                        'remember_token' => Str::random(10),
                        'userName' => fake()->userName(),
                        'meta' => [
                            "billing" => $referrer["billingInfo"] ?? [],
                            "contact" => $referrer["contactInfo"] ?? []
                        ],
                        "referrer_id" => $referrer["id"],
                        'mobile' => $referrer["phoneNo"],
                        'active' => $referrer["isActive"],
                    ]);
                    //Password::sendResetLink(["email"=>$referrer["email"]]);
                }
            }
        }
    }
}
