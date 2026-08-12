<?php

use App\Models\CollectRequest;
use Illuminate\Database\Migrations\Migration;

/**
 * A logistic request used to carry at most one ordered kit, snapshotted into
 * details as a single `kit` object. It can now carry several, so the snapshot
 * becomes a `kits` list and the old rows are rewritten to match — otherwise
 * every reader would have to know both shapes forever.
 */
return new class extends Migration
{
    public function up(): void
    {
        CollectRequest::query()
            ->whereNotNull('details')
            ->chunkById(200, function ($collectRequests) {
                foreach ($collectRequests as $collectRequest) {
                    $details = $collectRequest->details;

                    if (! isset($details['kit'])) {
                        continue;
                    }

                    $details['kits'] = [$details['kit']];
                    unset($details['kit']);

                    // Quietly: rewriting how a request describes itself is not
                    // news the provider needs to hear about.
                    $collectRequest->updateQuietly(['details' => $details]);
                }
            });
    }

    public function down(): void
    {
        CollectRequest::query()
            ->whereNotNull('details')
            ->chunkById(200, function ($collectRequests) {
                foreach ($collectRequests as $collectRequest) {
                    $details = $collectRequest->details;

                    if (empty($details['kits'])) {
                        continue;
                    }

                    // Only the first kit fits the old shape; a request that was
                    // raised for several loses the rest on the way back.
                    $details['kit'] = $details['kits'][0];
                    unset($details['kits']);

                    $collectRequest->updateQuietly(['details' => $details]);
                }
            });
    }
};
