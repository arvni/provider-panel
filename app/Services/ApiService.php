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
    private const HEALTH_CHECK_TIMEOUT = 10;

    /**
     * Make a GET request to the API
     *
     * @param string $endpoint
     * @param array $query
     * @return Response
     * @throws ApiServiceException
     */
    public static function get(string $endpoint, array $query = []): Response
    {
        return self::makeRequest('GET', self::buildUrl($endpoint), ['query' => $query]);
    }

    /**
     * Make a POST request to the API
     *
     * @param string $endpoint
     * @param array $data
     * @return Response
     * @throws ApiServiceException
     */
    public static function post(string $endpoint, array $data = []): Response
    {
        return self::makeRequest('POST', self::buildUrl($endpoint), ['json' => $data]);
    }

    /**
     * Make a PUT request to the API
     *
     * @param string $endpoint
     * @param array $data
     * @return Response
     * @throws ApiServiceException
     */
    public static function put(string $endpoint, array $data = []): Response
    {
        return self::makeRequest('PUT', self::buildUrl($endpoint), ['json' => $data]);
    }

    /**
     * Make a PATCH request to the API
     *
     * @param string $endpoint
     * @param array $data
     * @return Response
     * @throws ApiServiceException
     */
    public static function patch(string $endpoint, array $data = []): Response
    {
        return self::makeRequest('PATCH', self::buildUrl($endpoint), ['json' => $data]);
    }

    /**
     * Make a DELETE request to the API
     *
     * @param string $endpoint
     * @return Response
     * @throws ApiServiceException
     */
    public static function delete(string $endpoint): Response
    {
        return self::makeRequest('DELETE', self::buildUrl($endpoint));
    }

    /**
     * Upload a file to the API
     *
     * @param string $endpoint
     * @param array $files
     * @param array $data
     * @return Response
     * @throws ApiServiceException
     */
    public static function upload(string $endpoint, array $files, string $jsonData): Response
    {
        $multipart = [];

        // Add regular form data
        $multipart[] = [
            'name' => "data",
            'contents' => $jsonData,
            'filename' => 'data.json'
        ];

        // Add files
        foreach ($files as $key => $file) {
            $multipart[] = [
                'name' => $key,
                'contents' => fopen($file, 'r'),
                'filename' => basename($file)
            ];
        }

        return self::makeRequest('POST', self::buildUrl($endpoint), ['multipart' => $multipart]);
    }

    /**
     * Build full URL from endpoint
     *
     * @param string $endpoint
     * @return string
     */
    private static function buildUrl(string $endpoint): string
    {
        $baseUrl = rtrim(config('api.server_url'), '/');
        $endpoint = ltrim($endpoint, '/');

        return $baseUrl . '/' . $endpoint;
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

                $httpClient = Http::withToken($token)
                    ->timeout(self::REQUEST_TIMEOUT);

                // Handle multipart requests differently
                if (isset($options['multipart'])) {
                    $httpClient = $httpClient->asMultipart();
                    foreach ($options['multipart'] as $file) {
                        $httpClient = $httpClient->attach($file["name"], $file["contents"], $file["filename"]);
                    }
                } else {
                    $httpClient->withHeaders([
                        'Accept' => 'application/json',
                        'Content-Type' => 'application/json',
                        'User-Agent' => 'Laravel-ApiService/1.0'
                    ]);
                }

                $response = $httpClient->retry(2, self::RETRY_DELAY_MS)
                    ->send($method, $url, $options);

                // If token is invalid, clear cache and retry once
                if ($response->status() === 401 && $attempt === 0) {
                    Log::info("Token expired, refreshing...", ['url' => $url]);
                    self::clearTokenCache();
                    $attempt++;
                    continue;
                }

                if ($response->successful()) {
                    Log::debug("API request successful", [
                        'method' => $method,
                        'url' => $url,
                        'status' => $response->status()
                    ]);
                    return $response;
                }

                // Log unsuccessful responses
                Log::warning("API request failed", [
                    'method' => $method,
                    'url' => $url,
                    'status' => $response->status(),
                    'response' => $response->body()
                ]);

                throw new ApiServiceException(
                    "API request failed with status {$response->status()}: {$response->body()}",
                    $response->status()
                );

            } catch (ConnectionException $e) {
                $attempt++;

                Log::warning("API connection failed", [
                    'attempt' => $attempt,
                    'max_attempts' => self::MAX_RETRY_ATTEMPTS,
                    'url' => $url,
                    'method' => $method,
                    'error' => $e->getMessage()
                ]);

                if ($attempt >= self::MAX_RETRY_ATTEMPTS) {
                    throw new ApiServiceException(
                        "API connection failed after " . self::MAX_RETRY_ATTEMPTS . " attempts: " . $e->getMessage(),
                        503,
                        $e
                    );
                }

                // Exponential backoff
                sleep(pow(2, $attempt - 1));

            } catch (RequestException $e) {
                Log::error("API request exception", [
                    'url' => $url,
                    'method' => $method,
                    'error' => $e->getMessage(),
                    'trace' => $e->getTraceAsString()
                ]);

                throw new ApiServiceException(
                    "API request failed: " . $e->getMessage(),
                    $e->getCode() ?: 500,
                    $e
                );

            } catch (ApiServiceException $e) {
                throw $e; // Re-throw our custom exceptions

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
    private static function getApiToken(): string
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
            $loginUrl = self::buildUrl(config('api.login_path'));
            $credentials = [
                'email' => config('api.email'),
                'password' => config('api.password')
            ];

            if (empty($credentials['email']) || empty($credentials['password'])) {
                throw new ApiServiceException("API credentials not configured", 500);
            }

            Log::info("Attempting to fetch new API token");

            $response = Http::timeout(self::REQUEST_TIMEOUT)
                ->withHeaders([
                    'Accept' => 'application/json',
                    'Content-Type' => 'application/json'
                ])
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

            $responseData = $response->json();
            $token = $responseData['access_token'] ?? $responseData['token'] ?? null;

            if (empty($token)) {
                Log::error("No access token in response", ['response' => $responseData]);
                throw new ApiServiceException("No access token received from API", 500);
            }

            // Cache the encrypted token
            Cache::put(
                self::TOKEN_CACHE_KEY,
                encrypt($token),
                now()->addMinutes(self::TOKEN_EXPIRY_MINUTES)
            );

            Log::info("Successfully fetched and cached new API token");
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
    public static function clearTokenCache(): void
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
            $healthUrl = self::buildUrl('/health');
            $response = Http::timeout(self::HEALTH_CHECK_TIMEOUT)->get($healthUrl);

            $isHealthy = $response->successful();

            Log::debug("API health check", [
                'healthy' => $isHealthy,
                'status' => $response->status()
            ]);

            return $isHealthy;
        } catch (Exception $e) {
            Log::warning("API health check failed", ['error' => $e->getMessage()]);
            return false;
        }
    }

    /**
     * Get cached token info for debugging
     *
     * @return array
     */
    public static function getTokenInfo(): array
    {
        $cachedToken = Cache::get(self::TOKEN_CACHE_KEY);

        return [
            'has_cached_token' => !empty($cachedToken),
            'cache_key' => self::TOKEN_CACHE_KEY,
            'expires_at' => Cache::get(self::TOKEN_CACHE_KEY . '_expires'),
        ];
    }

    /**
     * Force refresh the API token
     *
     * @return string
     * @throws ApiServiceException
     */
    public static function refreshToken(): string
    {
        self::clearTokenCache();
        return self::fetchNewToken();
    }
}
