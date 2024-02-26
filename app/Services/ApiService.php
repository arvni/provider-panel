<?php

namespace App\Services;

use App\Models\CollectRequest;
use App\Models\User;
use GuzzleHttp\Promise\PromiseInterface;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;

class ApiService
{

    public static function get($url,$query=[]): PromiseInterface|Response
    {
        $token=self::getApiToken();
        return Http::withToken($token)->timeout(180)->get($url,$query);
    }
    public static function post($url,$data): PromiseInterface|Response
    {
        $token=self::getApiToken();
        return Http::withToken($token)->timeout(180)->post($url,$data);
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
