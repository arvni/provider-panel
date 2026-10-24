<?php

namespace App\Http\Controllers\PreOrder;

use App\Http\Controllers\Controller;
use App\Models\PreOrder;
use App\Services\PreOrderOutbox;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

/**
 * Center actions on a pre-order. Each is sent to BION and applied by the LIS; the page shows
 * "Sending…" until the result comes back.
 */
class PreOrderActionController extends Controller
{
    public function __construct(private readonly PreOrderOutbox $outbox) {}

    public function answer(Request $request, PreOrder $preOrder): RedirectResponse
    {
        $data = $request->validate([
            'request' => 'required|integer|min:1',
            'answer' => 'required|string|max:5000',
        ]);

        return $this->send($request, $preOrder, 'answer_request', $data);
    }

    public function message(Request $request, PreOrder $preOrder): RedirectResponse
    {
        return $this->send($request, $preOrder, 'message', $request->validate(['body' => 'required|string|max:5000']));
    }

    public function hold(Request $request, PreOrder $preOrder): RedirectResponse
    {
        return $this->send($request, $preOrder, 'request_hold', $this->reason($request, ['patient_request', 'cycle_postponed', 'awaiting_decision', 'other']));
    }

    public function resume(Request $request, PreOrder $preOrder): RedirectResponse
    {
        return $this->send($request, $preOrder, 'resume', []);
    }

    public function cancel(Request $request, PreOrder $preOrder): RedirectResponse
    {
        return $this->send($request, $preOrder, 'cancel', $this->reason($request, ['patient_withdrew', 'cycle_cancelled', 'sent_elsewhere', 'duplicate', 'other']));
    }

    private function reason(Request $request, array $reasons): array
    {
        return $request->validate([
            'reason' => ['required', Rule::in($reasons)],
            'comment' => 'nullable|string|max:2000',
        ]);
    }

    private function send(Request $request, PreOrder $preOrder, string $type, array $payload): RedirectResponse
    {
        $this->authorize('act', $preOrder);
        abort_if($preOrder->closed_at !== null && $type !== 'message', 422, 'This pre-order is closed.');

        $this->outbox->action($request->user(), $preOrder, $type, $payload);

        return back()->with(['success' => true, 'status' => 'Sent to BION.']);
    }
}
