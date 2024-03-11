<?php

namespace App\Services;

use Exception;
use GuzzleHttp\Promise\PromiseInterface;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class ApiService
{

    public static function get($url, $query = []): PromiseInterface|Response
    {
        try {
            $token = self::getApiToken();
            return Http::withToken($token)->timeout(180)->get($url, $query);
        } catch (Exception $exception) {
            Log::error($exception->getMessage(), $exception->getTrace());
            abort(400);
        }
    }

    public static function post($url, $data): PromiseInterface|Response
    {
        try {
            $token = self::getApiToken();
            return Http::withToken($token)->timeout(180)->post($url, $data);
        } catch (Exception $exception) {
            Log::error($exception->getMessage(), $exception->getTrace());
            return Http::response([], 400);
        }
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
            } else {
                abort(401);
            }
        }
        return $token;
    }


}
