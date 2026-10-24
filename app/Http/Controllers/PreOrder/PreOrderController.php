<?php

namespace App\Http\Controllers\PreOrder;

use App\Http\Controllers\Controller;
use App\Http\Requests\StorePreOrderRequest;
use App\Models\Patient;
use App\Models\PreOrder;
use App\Models\PreOrderAction;
use App\Services\PreOrderOutbox;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class PreOrderController extends Controller
{
    public function index(Request $request): Response
    {
        $filters = $request->validate([
            'waiting' => 'nullable|in:center,bion',
            'closed' => 'nullable|boolean',
            'search' => 'nullable|string|max:64',
        ]);
        $user = $request->user();

        $preOrders = PreOrder::query()
            ->where('user_id', $user->id)
            ->when($filters['waiting'] ?? null, fn ($q, $owner) => $q->where('action_owner', $owner))
            ->when(isset($filters['closed']), fn ($q) => $filters['closed'] ? $q->whereNotNull('closed_at') : $q->whereNull('closed_at'))
            ->when($filters['search'] ?? null, fn ($q, $s) => $q->where('code', 'like', "%$s%"))
            ->latest('updated_at')
            ->paginate(20)
            ->withQueryString()
            ->through(fn (PreOrder $p) => [
                'id' => $p->id,
                'code' => $p->code,
                'stage' => $p->snapshot['stage'] ?? null,
                'exception' => $p->snapshot['exception'] ?? null,
                'patient' => $this->mainPatientName($p->snapshot),
                'main_test' => $p->snapshot['main_test']['name'] ?? null,
                'open_requests' => collect($p->snapshot['requests'] ?? [])->where('status', 'open')->count(),
                'orders_to_place' => $p->Orders()->where('status', 'pending')->count(),
                'closed_at' => $p->closed_at,
                'updated_at' => $p->updated_at,
            ]);

        // New pre-orders the LIS hasn't created yet, or refused.
        $sending = PreOrderAction::query()
            ->where('user_id', $user->id)
            ->where('type', 'create')
            ->whereNull('pre_order_id')
            ->where('created_at', '>=', now()->subDays(7))
            ->latest()
            ->get(['id', 'status', 'error', 'payload', 'created_at'])
            ->map(fn (PreOrderAction $a) => [
                'id' => $a->id,
                'status' => $a->status,
                'error' => $a->error,
                'patient' => $a->payload['patients'][0]['fullName'] ?? null,
                'created_at' => $a->created_at,
            ]);

        return Inertia::render('PreOrder/Index', [
            'preOrders' => $preOrders,
            'sending' => $sending,
            'filters' => $filters,
        ]);
    }

    public function create(Request $request): Response
    {
        $tests = $request->user()->Tests()
            ->active()
            ->preOrderable()
            ->orderBy('tests.name')
            ->get(['tests.id', 'tests.name', 'tests.code', 'tests.shortName', 'tests.preorder'])
            // A test that can't be the main test (an add-on) is picked by BION, not here.
            ->filter(fn ($t) => $t->preorder['can_be_main'] ?? true)
            // The test's scope questions (genes, HLA…), answered on the pre-order.
            ->map(fn ($t) => [...$t->only(['id', 'name', 'code', 'shortName']), 'scope' => $t->preorder['scope'] ?? []])
            ->values();

        return Inertia::render('PreOrder/Create', ['tests' => $tests]);
    }

    public function store(StorePreOrderRequest $request, PreOrderOutbox $outbox): RedirectResponse
    {
        $user = $request->user();
        $data = $request->validated();

        // Patients are the panel's own rows; their ids are the refs the LIS sends back on a
        // release, so the order placed from it is filled in with the same patients.
        $patients = DB::transaction(fn () => array_map(function (array $p) use ($user) {
            if (! empty($p['id'])) {
                return ['patient' => Patient::query()->where('user_id', $user->id)->findOrFail($p['id']), 'relationship' => $p['relationship'] ?? null];
            }
            $patient = new Patient([
                'fullName' => $p['fullName'],
                'nationality' => $p['nationality']['code'],
                'dateOfBirth' => $p['dateOfBirth'],
                'gender' => (string) $p['gender'],
                'consanguineousParents' => '-1',
                'isFetus' => false,
                'id_no' => $p['id_no'] ?? null,
                'reference_id' => $p['reference_id'] ?? null,
            ]);
            $user->Patients()->save($patient);

            return ['patient' => $patient, 'relationship' => $p['relationship'] ?? null];
        }, $data['patients']));

        $refs = array_map(fn ($p) => (string) $p['patient']->id, $patients);
        $testServerIds = $user->Tests()->whereIn('tests.id', array_column($data['tests'] ?? [], 'id'))->pluck('tests.server_id', 'tests.id');

        $outbox->create($user, [
            'start_mode' => $data['start_mode'],
            'start_hint' => $data['start_hint'] ?? null,
            'referral_reason' => $data['referral_reason'] ?? null,
            'patients' => array_map(fn ($p) => [
                'ref' => (string) $p['patient']->id,
                'fullName' => $p['patient']->fullName,
                'idNo' => $p['patient']->id_no,
                'dateOfBirth' => $p['patient']->dateOfBirth,
                'gender' => strtolower($p['patient']->gender->name),
                'nationality' => $p['patient']->getRawOriginal('nationality'),
                'relationship' => $p['relationship'],
            ], $patients),
            'main_patient_ref' => $refs[0],
            'tests' => array_map(fn ($t) => [
                'test_id' => $testServerIds[$t['id']],
                'patient_ref' => $refs[$t['patient_index'] ?? 0] ?? $refs[0],
            ], $data['tests'] ?? []),
            // Keyed by the LIS test id, which is what its finance rules read.
            'scope' => $this->scopeAnswers($data['tests'] ?? [], $testServerIds->all()) ?: null,
            'clinical' => $data['clinical'] ?? null,
            'submit' => true,
        ]);

        return redirect()->route('preOrders.index')->with(['success' => true, 'status' => 'Sent to BION. It will appear here in a moment.']);
    }

    /**
     * @param  array<int, array<string, mixed>>  $tests
     * @param  array<int, int>  $serverIds  panel test id => LIS test id
     * @return array<int, array<string, mixed>> LIS test id => answers; ids are never 0, so this encodes as a JSON object
     */
    private function scopeAnswers(array $tests, array $serverIds): array
    {
        $answers = [];
        foreach ($tests as $test) {
            if (! empty($test['scope'])) {
                $answers[$serverIds[$test['id']]] = $test['scope'];
            }
        }

        return $answers;
    }

    public function show(Request $request, PreOrder $preOrder): Response
    {
        $this->authorize('view', $preOrder);

        return Inertia::render('PreOrder/Show', [
            // The snapshot's id is the LIS one; the page links with the panel's own.
            'preOrder' => [...$preOrder->snapshot, 'id' => $preOrder->id],
            'orders' => $preOrder->Orders()->get(['id', 'status', 'step', 'pre_order_release_key', 'created_at'])
                ->map(fn ($o) => [
                    'id' => $o->id,
                    'orderId' => $o->orderId,
                    'release_key' => $o->pre_order_release_key,
                    'status' => $o->status->value,
                    'step' => $o->step->value,
                ]),
            'actions' => $preOrder->Actions()->where('status', '!=', PreOrderAction::DONE)->latest()->limit(10)->get(['id', 'type', 'status', 'error', 'created_at']),
            'canAct' => $request->user()->can('act', $preOrder) && $preOrder->closed_at === null,
            'canApproveFinance' => $request->user()->can('approveFinance', $preOrder) && $preOrder->closed_at === null,
        ]);
    }

    private function mainPatientName(array $snapshot): ?string
    {
        $ref = $snapshot['main_patient_ref'] ?? null;

        return collect($snapshot['patients'] ?? [])->firstWhere('ref', $ref)['fullName']
            ?? ($snapshot['patients'][0]['fullName'] ?? null);
    }
}
