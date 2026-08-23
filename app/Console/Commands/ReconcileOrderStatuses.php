<?php

namespace App\Console\Commands;

use App\Exceptions\ApiServiceException;
use App\Models\Order;
use App\Observers\OrderObserver;
use App\Services\OrderStatusSync;
use Illuminate\Console\Command;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;

/**
 * One-off catch-up for orders the status lookup could never reach.
 *
 * Until the acceptance id became a lookup key, orders raised inside the lab
 * were invisible to sync:orders -- it asked by our own "OR.<Ymd>.<id>" key,
 * which those orders do not have -- so they sat at their arrival status
 * indefinitely. The first sweep after the fix would walk that whole backlog at
 * once and mail a provider for every order it advanced.
 *
 * This does the same catch-up deliberately and silently, so the sweep that
 * follows finds nothing left to announce. Safe to re-run: the sync only ever
 * advances a status and writes nothing when it learns nothing.
 */
class ReconcileOrderStatuses extends Command
{
    protected $signature = 'orders:reconcile-status
                            {--chunk=200 : How many orders to ask the lab about per request}
                            {--dry-run : Report what would change, then roll it back}';

    protected $description = 'Catch order statuses up with the lab without emailing providers';

    public function handle(OrderStatusSync $sync): int
    {
        $chunk = max(1, (int) $this->option('chunk'));
        $dryRun = (bool) $this->option('dry-run');

        $query = Order::query()
            ->with('CollectRequest')
            ->whereIn('status', OrderStatusSync::SWEEPABLE_STATUSES);

        $total = (clone $query)->count();

        if ($total === 0) {
            $this->info('No in-flight orders to reconcile.');

            return self::SUCCESS;
        }

        $this->info(sprintf(
            '%sReconciling %d in-flight order(s) in chunks of %d, without notifying providers.',
            $dryRun ? '[dry run] ' : '',
            $total,
            $chunk,
        ));

        $advanced = 0;
        $failures = 0;

        if ($dryRun) {
            DB::beginTransaction();
        }

        try {
            // chunkById, not chunk: this rewrites the very column the filter
            // reads, and paging by id keeps an advanced order from shifting the
            // rows still to come.
            $query->chunkById($chunk, function (Collection $orders) use ($sync, &$advanced, &$failures) {
                $before = $orders->mapWithKeys(fn (Order $order) => [$order->id => $order->status->value]);

                try {
                    OrderObserver::withoutNotifications(fn () => $sync->sync($orders));
                } catch (ApiServiceException $e) {
                    // One unreachable chunk should not lose the rest of the run;
                    // the command is re-runnable, so report and carry on.
                    $failures++;
                    $this->warn('  chunk failed: '.$e->getMessage());

                    return;
                }

                foreach ($orders as $order) {
                    if ($order->status->value === $before[$order->id]) {
                        continue;
                    }

                    $advanced++;
                    $this->line(sprintf(
                        '  #%d (%s)  %s -> %s',
                        $order->id,
                        $order->orderId,
                        $before[$order->id],
                        $order->status->value,
                    ));
                }
            });
        } finally {
            if ($dryRun) {
                DB::rollBack();
            }
        }

        $this->newLine();
        $this->info(sprintf(
            '%s%d of %d order(s) advanced, silently.',
            $dryRun ? '[dry run, rolled back] ' : '',
            $advanced,
            $total,
        ));

        if ($failures > 0) {
            $this->warn(sprintf('%d chunk(s) could not reach the lab -- re-run to finish them.', $failures));

            return self::FAILURE;
        }

        return self::SUCCESS;
    }
}
