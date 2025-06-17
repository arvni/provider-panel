<?php
namespace App\Services;

use App\Exceptions\ApiServiceException;
use Exception;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\RequestException;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class ApiService
{
    private const TOKEN_CACHE_KEY = 'api_sanctum_token';
    private const TOKEN_EXPIRY_MINUTES = 110; // 10 minutes before actual expiry for safety
    private const REQUEST_TIMEOUT = 180;
    private const MAX_RETRY_ATTEMPTS = 3;
    private const RETRY_DELAY_MS = 1000;

    /**
     * Make a GET request to the API
     *
     * @param string $url
     * @param array $query
     * @return Response
     * @throws ApiServiceException
     */
    public static function get(string $url, array $query = []): Response
    {
        return self::makeRequest('GET', $url, ['query' => $query]);
    }

    /**
     * Make a POST request to the API
     *
     * @param string $url
     * @param array $data
     * @return Response
     * @throws ApiServiceException
     */
    public static function post(string $url, array $data = []): Response
    {
        return self::makeRequest('POST', $url, ['json' => $data]);
    }

    /**
     * Make a PUT request to the API
     *
     * @param string $url
     * @param array $data
     * @return Response
     * @throws ApiServiceException
     */
    public static function put(string $url, array $data = []): Response
    {
        return self::makeRequest('PUT', $url, ['json' => $data]);
    }

    /**
     * Make a DELETE request to the API
     *
     * @param string $url
     * @return Response
     * @throws ApiServiceException
     */
    public static function delete(string $url): Response
    {
        return self::makeRequest('DELETE', $url);
    }

    /**
     * Make an authenticated HTTP request with retry logic
     *
     * @param string $method
     * @param string $url
     * @param array $options
     * @return Response
     * @throws ApiServiceException
     */
    private static function makeRequest(string $method, string $url, array $options = []): Response
    {
        $attempt = 0;

        while ($attempt < self::MAX_RETRY_ATTEMPTS) {
            try {
                $token = self::getApiToken();

                $response = Http::withToken($token)
                    ->timeout(self::REQUEST_TIMEOUT)
                    ->retry(2, self::RETRY_DELAY_MS)
                    ->send($method, $url, $options);

                // If token is invalid, clear cache and retry once
                if ($response->status() === 401 && $attempt === 0) {
                    self::clearTokenCache();
                    $attempt++;
                    continue;
                }

                if ($response->successful()) {
                    return $response;
                }

                throw new ApiServiceException(
                    "API request failed with status {$response->status()}: {$response->body()}",
                    $response->status()
                );

            } catch (ConnectionException $e) {
                Log::warning("API connection failed on attempt " . ($attempt + 1), [
                    'url' => $url,
                    'method' => $method,
                    'error' => $e->getMessage()
                ]);

                if ($attempt === self::MAX_RETRY_ATTEMPTS - 1) {
                    throw new ApiServiceException(
                        "API connection failed after " . self::MAX_RETRY_ATTEMPTS . " attempts: " . $e->getMessage(),
                        503,
                        $e
                    );
                }

                $attempt++;
                sleep(1); // Wait before retry

            } catch (RequestException $e) {
                Log::error("API request exception", [
                    'url' => $url,
                    'method' => $method,
                    'error' => $e->getMessage(),
                    'trace' => $e->getTraceAsString()
                ]);

                throw new ApiServiceException(
                    "API request failed: " . $e->getMessage(),
                    500,
                    $e
                );

            } catch (Exception $e) {
                Log::error("Unexpected API service error", [
                    'url' => $url,
                    'method' => $method,
                    'error' => $e->getMessage(),
                    'trace' => $e->getTraceAsString()
                ]);

                throw new ApiServiceException(
                    "Unexpected error during API request: " . $e->getMessage(),
                    500,
                    $e
                );
            }
        }

        throw new ApiServiceException("Max retry attempts exceeded", 503);
    }

    /**
     * Get a valid API token (from cache or by authenticating)
     *
     * @return string
     * @throws ApiServiceException
     */
    public static function getApiToken(): string
    {
        // Try to get token from cache
        $cachedToken = Cache::get(self::TOKEN_CACHE_KEY);
        if ($cachedToken) {
            try {
                return decrypt($cachedToken);
            } catch (Exception $e) {
                Log::warning("Failed to decrypt cached token, fetching new one", [
                    'error' => $e->getMessage()
                ]);
                self::clearTokenCache();
            }
        }

        // Fetch new token
        return self::fetchNewToken();
    }

    /**
     * Authenticate and fetch a new API token
     *
     * @return string
     * @throws ApiServiceException
     */
    private static function fetchNewToken(): string
    {
        try {
            $loginUrl = config('api.server_url') . config('api.login_path');
            $credentials = [
                'email' => config('api.email'),
                'password' => config('api.password')
            ];

            if (empty($credentials['email']) || empty($credentials['password'])) {
                throw new ApiServiceException("API credentials not configured", 500);
            }

            $response = Http::timeout(self::REQUEST_TIMEOUT)
                ->retry(2, self::RETRY_DELAY_MS)
                ->post($loginUrl, $credentials);

            if (!$response->successful()) {
                Log::error("API authentication failed", [
                    'status' => $response->status(),
                    'body' => $response->body(),
                    'url' => $loginUrl
                ]);

                throw new ApiServiceException(
                    "Authentication failed with status {$response->status()}",
                    $response->status()
                );
            }

            $token = $response->json('access_token');
            if (empty($token)) {
                throw new ApiServiceException("No access token received from API", 500);
            }

            // Cache the encrypted token
            Cache::put(
                self::TOKEN_CACHE_KEY,
                encrypt($token),
                now()->addMinutes(self::TOKEN_EXPIRY_MINUTES)
            );

            Log::info("Successfully fetched new API token");
            return $token;

        } catch (ApiServiceException $e) {
            throw $e;
        } catch (Exception $e) {
            Log::error("Token fetch failed", [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            throw new ApiServiceException(
                "Failed to fetch API token: " . $e->getMessage(),
                500,
                $e
            );
        }
    }

    /**
     * Clear the cached token
     */
    private static function clearTokenCache(): void
    {
        Cache::forget(self::TOKEN_CACHE_KEY);
        Log::info("Cleared cached API token");
    }

    /**
     * Check if the API service is healthy
     *
     * @return bool
     */
    public static function healthCheck(): bool
    {
        try {
            $healthUrl = config('api.server_url') . '/health';
            $response = Http::timeout(10)->get($healthUrl);
            return $response->successful();
        } catch (Exception $e) {
            Log::warning("API health check failed", ['error' => $e->getMessage()]);
            return false;
        }
    }
}
