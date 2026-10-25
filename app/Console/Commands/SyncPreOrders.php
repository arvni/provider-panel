<?php

namespace App\Console\Commands;

use App\Exceptions\ApiServiceException;
use App\Models\PreOrder;
use App\Models\PreOrderAction;
use App\Models\User;
use App\Services\ApiService;
use App\Services\PreOrderOutbox;
use Illuminate\Console\Command;
use Illuminate\Validation\ValidationException;

/**
 * Nightly safety net for the pre-order mirror. Snapshots arrive by webhook; one that was missed
 * leaves a mirror behind the LIS. This asks api which pre-orders changed lately and at which
 * version, and for any the mirror is behind on (or doesn't have) asks the LIS to send the
 * snapshot again. It never builds a snapshot itself: the LIS stays the only source.
 *
 * The look-back overlaps nightly runs, so a night when BION was unreachable is caught up the
 * next night. Use --days on the first run after an outage longer than that.
 */
class SyncPreOrders extends Command
{
    protected $signature = 'sync:pre-orders
                            {--days=3 : How far back to look for changed pre-orders}
                            {--dry-run : List what is behind without asking for anything}';

    protected $description = 'Ask the LIS to resend pre-order snapshots the mirror missed';

    public function handle(PreOrderOutbox $outbox): int
    {
        $since = now()->subDays(max(1, (int) $this->option('days')));
        $dryRun = (bool) $this->option('dry-run');

        // Centers that use pre-orders: they hold a mirror, or asked to create one.
        $userIds = PreOrder::query()->distinct()->pluck('user_id')
            ->merge(PreOrderAction::query()->where('type', 'create')->distinct()->pluck('user_id'))
            ->unique();
        $centers = User::query()->whereIn('id', $userIds)->whereNotNull('referrer_id')->get()->unique('referrer_id');

        $behind = 0;
        $failures = 0;
        foreach ($centers as $user) {
            try {
                $remote = $this->changedSince($user, $since);
            } catch (ApiServiceException $e) {
                $failures++;
                $this->warn("  referrer {$user->referrer_id}: ".$e->getMessage());

                continue;
            }

            $mirrors = PreOrder::query()->whereIn('server_id', array_keys($remote))->get()->keyBy('server_id');
            foreach ($remote as $serverId => $version) {
                $mirror = $mirrors->get($serverId);
                if ($mirror && $mirror->version >= $version) {
                    continue;
                }
                $behind++;
                $this->line(sprintf('  %s: mirror at v%s, LIS at v%d', $mirror->code ?? "pre-order $serverId", $mirror->version ?? '–', $version));
                if ($dryRun || ($mirror && $this->resyncPending($mirror))) {
                    continue;
                }
                try {
                    $outbox->resync($user, $serverId, $mirror);
                } catch (ValidationException) {
                    // The outbox has reported it; tomorrow's run asks again.
                    $failures++;
                }
            }
        }

        $this->info(sprintf('%s%d pre-order(s) behind the LIS%s.', $dryRun ? '[dry run] ' : '', $behind, $failures ? ", $failures request(s) failed" : ''));

        return $failures ? self::FAILURE : self::SUCCESS;
    }

    /**
     * The center's pre-orders changed since then, as server id => version.
     *
     * @return array<int, int>
     */
    private function changedSince(User $user, \DateTimeInterface $since): array
    {
        $versions = [];
        $page = 1;
        do {
            $response = ApiService::get(config('api.server_url')."pre-orders/{$user->referrer_id}", [
                'updated_since' => $since->format(DATE_ATOM),
                'page' => $page,
            ])->json();
            foreach ($response['data'] ?? [] as $row) {
                $versions[(int) $row['id']] = (int) $row['version'];
            }
            $page++;
        } while ($page <= ($response['last_page'] ?? 1));

        return $versions;
    }

    /** One request at a time: a resend still on its way shouldn't be asked for again. */
    private function resyncPending(PreOrder $mirror): bool
    {
        return $mirror->Actions()
            ->where('type', 'resync')
            ->where('status', PreOrderAction::PENDING)
            ->where('created_at', '>=', now()->subDay())
            ->exists();
    }
}
