<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

/**
 * Verify the HMAC-SHA256 signature on an incoming webhook before it reaches the
 * controller. Replaces the signature block that was duplicated across every
 * webhook controller, so the verification (and the timing-safe comparison) lives
 * in exactly one place.
 *
 * The upstream server signs different payloads on different endpoints, so the
 * scheme is declared per route, e.g. `verify.webhook:raw`:
 *
 *  - raw   the signature covers the raw request body (getContent)
 *  - input the signature covers a canonical re-encode of the parsed input
 *          (json_encode($request->all()))
 *  - file  the payload arrives as an uploaded JSON file named `data`; the
 *          signature covers a re-encode of its decoded contents
 *
 * The byte sequence that is signed must match the controller's previous
 * behaviour exactly, otherwise live integrations would silently start failing.
 */
class VerifyWebhookSignature
{
    public function handle(Request $request, Closure $next, string $scheme = 'raw'): Response
    {
        $secret = (string) config('webhook.secret');
        $payload = $this->payloadFor($request, $scheme);

        // Fail closed: a missing secret or an unreadable file payload can never
        // produce a trustworthy signature.
        if ($secret === '' || $payload === null || ! $this->matches($request, $payload, $secret)) {
            Log::warning('Webhook signature mismatch', [
                'route' => $request->route()?->getName(),
                'scheme' => $scheme,
            ]);

            return response()->json(['error' => 'Invalid signature'], 401);
        }

        return $next($request);
    }

    /**
     * Build the byte string the signature is expected to cover for this scheme.
     */
    private function payloadFor(Request $request, string $scheme): ?string
    {
        return match ($scheme) {
            'input' => json_encode($request->all()),
            'file' => $this->filePayload($request),
            default => $request->getContent(),
        };
    }

    /**
     * Read the uploaded `data` JSON file and re-encode its decoded contents,
     * mirroring how the file-based webhooks compute their signature.
     */
    private function filePayload(Request $request): ?string
    {
        if (! $request->hasFile('data')) {
            return null;
        }

        $contents = @file_get_contents($request->file('data')->path());
        if ($contents === false) {
            return null;
        }

        return json_encode(json_decode($contents, true));
    }

    private function matches(Request $request, string $payload, string $secret): bool
    {
        $expected = hash_hmac('sha256', $payload, $secret);

        return hash_equals($expected, (string) $request->header('X-Webhook-Signature'));
    }
}
