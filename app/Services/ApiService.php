<?php

namespace App\Services;

use App\Models\CollectRequest;
use App\Models\User;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;

class ApiService
{

    protected static function get($url)
    {
        return Http::withToken(self::getApiToken())->timeout(180)->get($url);
    }

    public static function getApiToken()
    {
        if (Cache::has("sanctumToken"))
            $token = decrypt(Cache::get("sanctumToken"));
        else {
            $response = Http::post(config("api.server_url") . config("api.login_path"), [
                "email" => config("api.email"),
                "password" => config("api.password")
            ]);
            if ($response->ok()) {
                $token = $response->json("access_token");
                Cache::put("sanctumToken", encrypt($token), now()->addMinutes(120));
            }else {
                abort(401);
            }
        }
        return $token;
    }


}
