<?php

namespace Tests\Feature\Webhook;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Tests\TestCase;

/**
 * Exercises the VerifyWebhookSignature middleware through the real webhook
 * routes, covering each of the three signing schemes (raw body, re-encoded
 * input, and uploaded-file JSON). A wrong or missing signature must be rejected
 * with 401; a correct one must pass the gate and reach the controller.
 */
class WebhookSignatureTest extends TestCase
{
    use RefreshDatabase;

    private const SECRET = 'test-webhook-secret';

    protected function setUp(): void
    {
        parent::setUp();
        config(['webhook.secret' => self::SECRET]);
    }

    private function sign(string $payload): string
    {
        return hash_hmac('sha256', $payload, self::SECRET);
    }

    public function test_raw_scheme_rejects_a_wrong_signature(): void
    {
        $this->postJson(
            route('api.patients.update-by-webhook'),
            ['referrer_id' => 1],
            ['X-Webhook-Signature' => 'deadbeef'],
        )->assertUnauthorized();
    }

    public function test_raw_scheme_rejects_a_missing_signature(): void
    {
        $this->postJson(route('api.patients.update-by-webhook'), ['referrer_id' => 1])
            ->assertUnauthorized();
    }

    public function test_raw_scheme_accepts_a_valid_signature(): void
    {
        $payload = ['referrer_id' => 1];
        // postJson sends json_encode($payload) as the raw body, which is what the
        // raw scheme signs.
        $signature = $this->sign(json_encode($payload));

        // A valid signature passes the gate; the payload is intentionally
        // incomplete, so the controller answers with a validation error (422),
        // proving the request got past the 401 signature check.
        $this->postJson(route('api.patients.update-by-webhook'), $payload, [
            'X-Webhook-Signature' => $signature,
        ])->assertStatus(422);
    }

    public function test_input_scheme_rejects_a_wrong_signature(): void
    {
        $this->postJson(
            route('api.collect-request.update-by-webhook'),
            ['data' => ['id' => 1, 'status' => 'pending']],
            ['X-Webhook-Signature' => 'nope'],
        )->assertUnauthorized();
    }

    public function test_input_scheme_accepts_a_valid_signature(): void
    {
        $payload = ['data' => ['id' => 999999, 'status' => 'pending']];
        // The input scheme signs json_encode($request->all()).
        $signature = $this->sign(json_encode($payload));

        // No collect request matches, so the controller simply returns success.
        $this->postJson(route('api.collect-request.update-by-webhook'), $payload, [
            'X-Webhook-Signature' => $signature,
        ])->assertOk()->assertJsonPath('success', true);
    }

    public function test_file_scheme_rejects_a_wrong_signature(): void
    {
        $contents = json_encode(['consent_form' => ['name' => 'Consent A']]);

        $this->post(
            route('api.consents.update-by-webhook', ['consentFormId' => 1]),
            ['data' => UploadedFile::fake()->createWithContent('data.json', $contents)],
            ['X-Webhook-Signature' => 'wrong'],
        )->assertUnauthorized();
    }

    public function test_file_scheme_accepts_a_valid_signature(): void
    {
        $data = ['consent_form' => ['name' => 'Consent A']];
        $contents = json_encode($data);
        // The file scheme signs a re-encode of the decoded uploaded file.
        $signature = $this->sign(json_encode(json_decode($contents, true)));

        $this->post(
            route('api.consents.update-by-webhook', ['consentFormId' => 1]),
            ['data' => UploadedFile::fake()->createWithContent('data.json', $contents)],
            ['X-Webhook-Signature' => $signature],
        )->assertOk()->assertJsonPath('success', true);

        $this->assertDatabaseHas('consents', ['name' => 'Consent A']);
    }

    public function test_an_empty_secret_fails_closed(): void
    {
        config(['webhook.secret' => '']);
        $payload = ['referrer_id' => 1];

        // With no configured secret, even a "correctly" computed signature is
        // rejected rather than trusted.
        $this->postJson(route('api.patients.update-by-webhook'), $payload, [
            'X-Webhook-Signature' => hash_hmac('sha256', json_encode($payload), ''),
        ])->assertUnauthorized();
    }
}
