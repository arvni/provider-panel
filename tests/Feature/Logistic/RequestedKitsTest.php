<?php

namespace Tests\Feature\Logistic;

use App\Enums\CollectRequestStatus;
use App\Models\CollectRequest;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * A logistic request used to carry at most one ordered kit, held in details as
 * a single `kit`. It can now carry several, as a `kits` list. The backfill
 * migration rewrites the old rows; this covers both the rewrite and the reader
 * that stands under it.
 */
class RequestedKitsTest extends TestCase
{
    use RefreshDatabase;

    private function kitOrder(array $details): CollectRequest
    {
        return CollectRequest::create([
            'user_id' => User::factory()->create()->id,
            'status' => CollectRequestStatus::REQUESTED,
            'details' => array_merge(['type' => 'standalone', 'mode' => 'order'], $details),
        ]);
    }

    public function test_it_reads_a_request_that_carries_several_kits(): void
    {
        $kits = [
            ['id' => 1, 'name' => 'Blood', 'amount' => 2],
            ['id' => 2, 'name' => 'Saliva', 'amount' => 5],
        ];

        $this->assertSame($kits, $this->kitOrder(['kits' => $kits])->requestedKits());
    }

    public function test_it_reads_a_request_raised_before_kits_became_a_list(): void
    {
        $kit = ['id' => 1, 'name' => 'Blood', 'amount' => 2, 'order_material_id' => 9];

        $this->assertSame([$kit], $this->kitOrder(['kit' => $kit])->requestedKits());
    }

    public function test_a_pickup_asked_for_no_kits_at_all(): void
    {
        $pickup = $this->kitOrder(['mode' => 'collect', 'sample_types' => [['id' => 1]]]);

        $this->assertSame([], $pickup->requestedKits());
    }

    public function test_the_backfill_rewrites_the_old_shape_and_leaves_the_rest_alone(): void
    {
        $kit = ['id' => 1, 'name' => 'Blood', 'amount' => 2, 'order_material_id' => 9];
        $legacy = $this->kitOrder(['kit' => $kit]);
        $pickup = $this->kitOrder(['mode' => 'collect', 'sample_types' => [['id' => 1]]]);

        $migration = require database_path(
            'migrations/2026_08_12_090000_move_collect_request_kit_details_into_a_list.php'
        );
        $migration->up();

        $rewritten = $legacy->fresh();

        $this->assertSame([$kit], $rewritten->details['kits']);
        $this->assertArrayNotHasKey('kit', $rewritten->details);
        // The rest of the snapshot survives the rewrite.
        $this->assertSame('standalone', $rewritten->details['type']);
        $this->assertSame([['id' => 1]], $pickup->fresh()->details['sample_types']);
    }
}
