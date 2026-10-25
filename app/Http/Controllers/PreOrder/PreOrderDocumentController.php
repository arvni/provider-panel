<?php

namespace App\Http\Controllers\PreOrder;

use App\Exceptions\ApiServiceException;
use App\Http\Controllers\Controller;
use App\Models\PreOrder;
use App\Rules\SafeUpload;
use App\Services\ApiService;
use App\Services\PreOrderOutbox;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Symfony\Component\HttpFoundation\Response;

/** Files on a pre-order: the center sends them to BION and downloads what is stored. */
class PreOrderDocumentController extends Controller
{
    /** Types the browser may show inline from the panel's origin: none of them can run script. */
    private const INLINE = ['application/pdf', 'image/png', 'image/jpeg'];

    public function store(Request $request, PreOrder $preOrder, PreOrderOutbox $outbox): RedirectResponse
    {
        $this->authorize('act', $preOrder);
        abort_if($preOrder->closed_at !== null, 422, 'This pre-order is closed.');

        $openRequests = collect($preOrder->snapshot['requests'] ?? [])->where('status', 'open')->pluck('number')->all();
        $data = $request->validate([
            'file' => ['required', ...SafeUpload::preOrderRules()],
            'tag' => ['required', Rule::in(['MEDICAL_HISTORY', 'ID_CARD', 'CONSENT_FORM', 'REQUEST_FORM', 'PRESCRIPTION', 'DOCUMENT'])],
            'request' => ['nullable', 'integer', Rule::in($openRequests)],
            'title' => ['required', 'string', 'max:150'],
            'description' => ['nullable', 'string', 'max:2000'],
        ]);

        $outbox->upload($request->user(), $preOrder, $data['file'], $data['tag'], isset($data['request']) ? (int) $data['request'] : null, $data['title'], $data['description'] ?? null);

        return back()->with(['success' => true, 'status' => 'File sent to BION. It is checked before it is added.']);
    }

    public function show(PreOrder $preOrder, string $hash): Response
    {
        $this->authorize('view', $preOrder);
        // Only files the LIS lists on this pre-order; any other hash is not this center's to fetch.
        $document = collect($preOrder->snapshot['documents'] ?? [])->firstWhere('hash', $hash);
        abort_unless($document, 404);

        try {
            $file = ApiService::get(config('api.server_url').'documents/'.rawurlencode($hash));
        } catch (ApiServiceException $e) {
            abort($e->getCode() === 404 ? 404 : 503);
        }

        $body = $file->body();
        // The type comes from the bytes, never from a header or a name.
        $type = (new \finfo(FILEINFO_MIME_TYPE))->buffer($body) ?: 'application/octet-stream';
        $inline = in_array($type, self::INLINE, true);
        $name = preg_replace('/[^\w.\- ]+/u', '', (string) $document['name']) ?: 'document';

        $headers = [
            'Content-Type' => $inline ? $type : 'application/octet-stream',
            'Content-Disposition' => ($inline ? 'inline' : 'attachment').'; filename="'.$name.'"',
            'X-Content-Type-Options' => 'nosniff',
            'Cache-Control' => 'no-cache, no-store, must-revalidate',
        ];
        // Chrome's PDF viewer won't run in a sandbox; everything else gets one.
        if ($type !== 'application/pdf') {
            $headers['Content-Security-Policy'] = "default-src 'none'; img-src 'self'; style-src 'unsafe-inline'; sandbox";
        }

        return response($body, 200, $headers);
    }
}
