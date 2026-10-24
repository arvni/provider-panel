<?php

namespace App\Services;

use App\Exceptions\ApiServiceException;
use App\Models\PreOrder;
use App\Models\PreOrderAction;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

/**
 * Sends a center action to the api app, which queues it for the LIS (202). The local row shows
 * "Sending…" until the LIS reports the result by webhook. The uuid makes a retry harmless.
 */
class PreOrderOutbox
{
    public function create(User $user, array $payload): PreOrderAction
    {
        return $this->send($user, null, 'create', $payload, "pre-orders/{$user->referrer_id}");
    }

    public function action(User $user, PreOrder $preOrder, string $type, array $payload = []): PreOrderAction
    {
        return $this->send($user, $preOrder, $type, $payload, "pre-orders/{$user->referrer_id}/{$preOrder->server_id}/actions");
    }

    /** A file for BION. The LIS inspects it before it becomes a document of the pre-order. */
    public function upload(User $user, PreOrder $preOrder, UploadedFile $file, string $tag, ?int $request): PreOrderAction
    {
        $action = PreOrderAction::create([
            'uuid' => (string) Str::uuid(),
            'user_id' => $user->id,
            'pre_order_id' => $preOrder->id,
            'type' => 'upload_document',
            'payload' => ['name' => $file->getClientOriginalName(), 'tag' => $tag, 'request' => $request],
            'status' => PreOrderAction::PENDING,
        ]);

        try {
            ApiService::postFile(
                config('api.server_url')."pre-orders/{$user->referrer_id}/{$preOrder->server_id}/documents",
                array_filter([
                    'id' => $action->uuid,
                    'actor[user_id]' => $user->id,
                    'actor[name]' => $user->name,
                    'tag' => $tag,
                    'request' => $request,
                ], fn ($v) => $v !== null),
                'file',
                (string) file_get_contents($file->getRealPath()),
                $file->getClientOriginalName(),
            );
        } catch (ApiServiceException $e) {
            $message = $e->getCode() === 422
                ? 'The file was not accepted. Only PDF, PNG and JPEG files up to 20 MB can be sent.'
                : 'Could not reach BION. Please try again.';
            $action->update(['status' => PreOrderAction::FAILED, 'error' => $message]);
            report($e);

            throw ValidationException::withMessages(['file' => $message]);
        }

        return $action;
    }

    private function send(User $user, ?PreOrder $preOrder, string $type, array $payload, string $path): PreOrderAction
    {
        $action = PreOrderAction::create([
            'uuid' => (string) Str::uuid(),
            'user_id' => $user->id,
            'pre_order_id' => $preOrder?->id,
            'type' => $type,
            'payload' => $payload,
            'status' => PreOrderAction::PENDING,
        ]);

        $body = [
            'id' => $action->uuid,
            'actor' => ['user_id' => $user->id, 'name' => $user->name],
            'payload' => (object) $payload,
        ];
        if ($preOrder) {
            $body['type'] = $type;
        }

        try {
            ApiService::post(config('api.server_url').$path, $body);
        } catch (ApiServiceException $e) {
            $action->update(['status' => PreOrderAction::FAILED, 'error' => 'Could not reach BION. Please try again.']);
            report($e);

            throw ValidationException::withMessages(['action' => 'Could not reach BION. Please try again.']);
        }

        return $action;
    }
}
