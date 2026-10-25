<?php

namespace App\Services;

use App\Enums\OrderStatus;
use App\Enums\OrderStep;
use App\Interfaces\OrderFormRepositoryInterface;
use App\Models\Order;
use App\Models\Patient;
use App\Models\PreOrder;
use App\Models\Test;
use App\Models\User;
use App\Notifications\PreOrderStageChanged;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Applies LIS snapshots to the local mirror. A snapshot always carries the whole center-visible
 * pre-order, so applying the newest one is enough to heal any webhook that was missed.
 */
class PreOrderMirror
{
    /**
     * @return bool false when the snapshot is older than (or the same as) the one already held
     */
    public function apply(array $snapshot): bool
    {
        $user = User::query()->where('referrer_id', $snapshot['referrer_id'])->first();
        if (! $user) {
            Log::warning('Pre-order snapshot for an unknown referrer', ['referrer_id' => $snapshot['referrer_id'], 'pre_order' => $snapshot['id']]);

            return false;
        }

        return DB::transaction(function () use ($snapshot, $user) {
            $preOrder = PreOrder::query()->where('server_id', $snapshot['id'])->lockForUpdate()->first();
            if ($preOrder && $preOrder->version >= $snapshot['version']) {
                return false;
            }

            $before = $preOrder ? [$preOrder->stage, $preOrder->snapshot['stage']['reminded_at'] ?? null] : [null, null];
            $preOrder ??= new PreOrder(['server_id' => $snapshot['id']]);
            $preOrder->fill([
                'user_id' => $user->id,
                'code' => $snapshot['code'],
                'version' => $snapshot['version'],
                'stage' => $snapshot['stage']['code'],
                'action_owner' => $snapshot['stage']['owner'],
                'snapshot' => $snapshot,
                'closed_at' => $snapshot['closed_at'] ?? null,
            ])->save();

            foreach ($snapshot['orders_to_place'] ?? [] as $release) {
                $this->placeRelease($preOrder, $user, $release, $snapshot['main_patient_ref'] ?? null);
            }
            DB::afterCommit(fn () => $this->announce($preOrder, $user, ...$before));

            return true;
        });
    }

    /**
     * Tell the center when its pre-order reaches a stage it cares about, or when BION reminds it
     * to act. Each user's switches decide whether it arrives, and on which channels.
     */
    private function announce(PreOrder $preOrder, User $user, ?string $stageBefore, ?string $remindedBefore): void
    {
        $reminded = $preOrder->snapshot['stage']['reminded_at'] ?? null;
        if ($preOrder->stage !== $stageBefore && array_key_exists($preOrder->stage, PreOrderStageChanged::STAGES)) {
            $user->notify(new PreOrderStageChanged($preOrder));
        } elseif ($reminded !== null && $reminded !== $remindedBefore && $preOrder->action_owner === 'center') {
            $user->notify(new PreOrderStageChanged($preOrder, reminder: true));
        }
    }

    /**
     * A released group of lines becomes one pending order with its tests and patients filled in.
     * The center checks it, adds samples and submits it through the usual order steps. Placed
     * once per release key: a later snapshot never creates it again.
     */
    private function placeRelease(PreOrder $preOrder, User $user, array $release, ?string $mainRef): void
    {
        if (Order::query()->where('pre_order_id', $preOrder->id)->where('pre_order_release_key', $release['release_key'])->exists()) {
            return;
        }

        $tests = Test::query()->whereIn('server_id', array_column($release['items'], 'test_id'))->get()->keyBy('server_id');
        // Patient refs are the panel's own patient ids, sent when the pre-order was created; only
        // this center's patients are ever used.
        $refs = array_values(array_unique(array_filter(array_column($release['items'], 'patient_ref'))));
        $patients = Patient::query()->where('user_id', $user->id)->whereIn('id', $refs)->get()->keyBy('id');

        $missing = array_diff(array_column($release['items'], 'test_id'), $tests->keys()->all());
        if ($missing || $patients->isEmpty()) {
            // A test not synced yet, or a patient that isn't this center's: leave it for the next
            // snapshot rather than place a partial order.
            Log::warning('Pre-order release not placed', ['pre_order' => $preOrder->code, 'release' => $release['release_key'], 'missing_tests' => array_values($missing)]);

            return;
        }

        $main = $patients->get((int) $mainRef) ?? $patients->first();
        $patientIds = [$main->id, ...$patients->keys()->reject(fn ($id) => $id === $main->id)->values()->all()];

        $order = new Order([
            'step' => OrderStep::PATIENT_DETAILS,
            'status' => OrderStatus::PENDING,
            'files' => [],
            // A fresh repository: it keeps one query builder, so a reused one would stack filters.
            'orderForms' => app(OrderFormRepositoryInterface::class)->getAll(['filters' => ['tests' => $tests->pluck('id')->all()]]),
            'main_patient_id' => $main->id,
            'patient_ids' => $patientIds,
            'pre_order_id' => $preOrder->id,
            'pre_order_release_key' => $release['release_key'],
        ]);
        $order->User()->associate($user->id);
        $order->save();
        $order->Tests()->sync($tests->pluck('id')->all());

        $orderItems = $order->OrderItems()->get();
        foreach ($release['items'] as $item) {
            $orderItem = $orderItems->firstWhere('test_id', $tests[$item['test_id']]->id);
            $patient = $patients->get((int) ($item['patient_ref'] ?? 0)) ?? $main;
            $orderItem?->Patients()->syncWithoutDetaching([$patient->id => ['is_main' => $patient->id === $main->id]]);
        }
    }
}
