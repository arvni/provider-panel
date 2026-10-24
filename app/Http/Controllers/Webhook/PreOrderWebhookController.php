<?php

namespace App\Http\Controllers\Webhook;

use App\Http\Controllers\Controller;
use App\Models\PreOrder;
use App\Models\PreOrderAction;
use App\Services\PreOrderMirror;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/** Pre-order webhooks from the LIS, signed over the raw body (verify.webhook:raw). */
class PreOrderWebhookController extends Controller
{
    public function upsert(Request $request, PreOrderMirror $mirror): JsonResponse
    {
        $request->validate([
            'id' => 'required|integer',
            'code' => 'required|string|max:20',
            'version' => 'required|integer|min:1',
            'referrer_id' => 'required|integer',
            'stage' => 'required|array',
            'stage.code' => 'required|string|max:32',
            'stage.owner' => 'required|string|max:8',
            'orders_to_place' => 'present|array',
            'orders_to_place.*.release_key' => 'required|string|max:64',
            'orders_to_place.*.items' => 'required|array|min:1',
            'orders_to_place.*.items.*.test_id' => 'required|integer',
        ]);

        // Validation only checks the fields the panel relies on; the mirror keeps the whole
        // document (validated() would drop every key not listed above).
        $applied = $mirror->apply($request->all());

        return response()->json(['applied' => $applied]);
    }

    public function actionResult(Request $request): JsonResponse
    {
        $result = $request->validate([
            'action_id' => 'required|uuid',
            'ok' => 'required|boolean',
            'error' => 'nullable|string|max:2000',
            'pre_order_id' => 'nullable|integer',
        ]);

        $action = PreOrderAction::query()->where('uuid', $result['action_id'])->first();
        if (! $action) {
            return response()->json(['applied' => false]);
        }

        $action->fill([
            'status' => $result['ok'] ? PreOrderAction::DONE : PreOrderAction::FAILED,
            'error' => $result['ok'] ? null : ($result['error'] ?? 'Refused by BION.'),
        ]);
        // A create learns its pre-order here, once the snapshot for it has arrived.
        if (! $action->pre_order_id && isset($result['pre_order_id'])) {
            $action->pre_order_id = PreOrder::query()->where('server_id', $result['pre_order_id'])->where('user_id', $action->user_id)->value('id');
        }
        $action->save();

        return response()->json(['applied' => true]);
    }
}
