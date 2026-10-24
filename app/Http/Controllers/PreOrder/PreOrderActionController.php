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

    public function decideFinance(Request $request, PreOrder $preOrder): RedirectResponse
    {
        $this->authorize('approveFinance', $preOrder);
        $data = $request->validate([
            'quotation' => ['required', 'string', 'max:32', Rule::in(array_column($preOrder->snapshot['quotations'] ?? [], 'number'))],
            'decision' => ['required', Rule::in(['approve', 'partial', 'reject'])],
            'items' => ['nullable', 'required_if:decision,partial', 'array', 'max:50'],
            'items.*' => ['integer', 'distinct'],
            'note' => ['nullable', 'required_if:decision,reject', 'string', 'max:2000'],
            'center_reference' => ['nullable', 'string', 'max:64'],
        ]);

        return $this->send($request, $preOrder, 'decide_finance', $data, 'approveFinance');
    }

    private function reason(Request $request, array $reasons): array
    {
        return $request->validate([
            'reason' => ['required', Rule::in($reasons)],
            'comment' => 'nullable|string|max:2000',
        ]);
    }

    private function send(Request $request, PreOrder $preOrder, string $type, array $payload, string $ability = 'act'): RedirectResponse
    {
        $this->authorize($ability, $preOrder);
        abort_if($preOrder->closed_at !== null && $type !== 'message', 422, 'This pre-order is closed.');

        $this->outbox->action($request->user(), $preOrder, $type, $payload);

        return back()->with(['success' => true, 'status' => 'Sent to BION.']);
    }
}
