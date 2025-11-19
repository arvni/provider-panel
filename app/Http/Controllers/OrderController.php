<?php

namespace App\Http\Controllers;

use App\Enums\OrderStep;
use App\Interfaces\ConsentTermRepositoryInterface;
use App\Interfaces\OrderRepositoryInterface;
use App\Interfaces\TestRepositoryInterface;
use App\Models\Order;
use App\Http\Requests\StoreOrderRequest;
use App\Http\Requests\UpdateOrderRequest;
use App\Models\Patient;
use App\Models\SampleType;
use App\Repositories\ConsentTermRepository;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
use function Symfony\Component\String\b;

class OrderController extends Controller
{
    private OrderRepositoryInterface $orderRepository;
    protected ConsentTermRepositoryInterface $consentTermRepository;
    protected TestRepositoryInterface $testRepository;

    public function __construct(OrderRepositoryInterface       $orderRepository,
                                ConsentTermRepositoryInterface $consentTermRepository,
                                TestRepositoryInterface        $testRepository)
    {
        $this->orderRepository = $orderRepository;
        $this->testRepository = $testRepository;
        $this->consentTermRepository = $consentTermRepository;
        $this->middleware("indexProvider")->only("index");
    }

    /**
     * Display a listing of the resource.
     * @param Request $request
     * @return Response
     */
    public function index(Request $request): Response
    {
        $orders = $this->orderRepository->getUserOrders($request->all());
        return Inertia::render("Order/Index", ["orders" => $orders, "request" => $request->all()]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create(Request $request)
    {
        $tests = [];
        if ($request->has("test"))
            $tests[] = $this->testRepository->getById($request->get("test"));
        return Inertia::render("Order/Add", compact("tests"));
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreOrderRequest $request)
    {
        $order = $this->orderRepository->create($request->all());
        return redirect()->route("orders.edit", ["order" => $order, "step" => OrderStep::PATIENT_DETAILS]);
    }

    /**
     * Display the specified resource.
     */
    public function show(Order $order)
    {
        $this->authorize("view", $order);
        $order->load([
            "Patient",
            "Tests",
            "OrderItems.Patients",
            "OrderItems.Test",
            "OrderItems.Samples.Patient",
            "OrderItems.Samples.Material",
            "OrderItems.Samples.SampleType",
        ]);

        // Get all patients from patient_ids
        $patients = [];
        if (!empty($order->patient_ids)) {
            $patients = Patient::whereIn('id', $order->patient_ids)->get();
        }
        return Inertia::render("Order/Show", compact("order", "patients"));
    }

    /**
     * Show the form for editing the specified resource.
     * @param Order $order
     * @param OrderStep $step
     * @return Response
     * @throws AuthorizationException
     */
    public function edit(Order $order, OrderStep $step)
    {
        $this->authorize("update", $order);
        $data = ["order", "step"];
        if ($step == OrderStep::SAMPLE_DETAILS) {
            $tests = $order->Tests()->get()->pluck("id")->flatten()->toArray();
            $sampleTypes = SampleType::whereHas("Tests", function ($q) use ($tests) {
                $q->whereIn("tests.id", $tests);
            })->get()
                ->map(fn(SampleType $sampleType) => [
                    "id" => $sampleType->id,
                    "name" => $sampleType->name,
                    "sampleIdRequired" => $sampleType->sample_id_required
                ]);
            $data[] = "sampleTypes";
            $order->load("OrderItems.Samples.SampleType", "OrderItems.Samples.Material", "OrderItems.Samples.Patient", "OrderItems.Test", "OrderItems.Patients");

            // Get all patients from patient_ids
            $patients = Patient::whereIn('id', $order->patient_ids ?? [])->get();
            $data[] = "patients";

            // Get order items (tests with assigned patients)
            $orderItems = $order->OrderItems;
            $data[] = "orderItems";

            // Flatten samples for frontend compatibility
            $order->samples = $order->OrderItems->pluck('Samples')->flatten()->values();
        } elseif ($step === OrderStep::PATIENT_DETAILS) {
            $order->load("patient.RelatedPatients", "Tests");

            // Format main patient relations
            if ($order->patient) {
                if ($order->patient->RelatedPatients && $order->patient->RelatedPatients->count() > 0) {
                    $order->patient->relations = $order->patient->RelatedPatients->map(function ($relatedPatient) {
                        return [
                            'related_patient_id' => $relatedPatient->id,
                            'relation_type' => $relatedPatient->pivot->relation_type,
                            'notes' => $relatedPatient->pivot->notes
                        ];
                    })->toArray();
                } else {
                    $order->patient->relations = [];
                }
            }

            // Load all patients with their relations if patient_ids exists
            if (!empty($order->patient_ids)) {
                $order->patients = Patient::whereIn('id', $order->patient_ids)
                    ->with('RelatedPatients')
                    ->get()
                    ->map(function ($patient) use ($order) {
                        // Format relations for frontend
                        if ($patient->RelatedPatients && $patient->RelatedPatients->count() > 0) {
                            $patient->relations = $patient->RelatedPatients->map(function ($relatedPatient) {
                                return [
                                    'related_patient_id' => $relatedPatient->id,
                                    'relation_type' => $relatedPatient->pivot->relation_type,
                                    'notes' => $relatedPatient->pivot->notes
                                ];
                            })->toArray();
                        } else {
                            $patient->relations = [];
                        }
                        return $patient;
                    });
            }
            $genders = $order->tests->map(fn($test) => $test->gender)->flatten()->unique();
            $data[] = "genders";
        } elseif ($step === OrderStep::PATIENT_TEST_ASSIGNMENT) {
            $order->load(["Tests", "OrderItems.Patients", "OrderItems.Test"]);
            // Get all patients from patient_ids
            $patients = Patient::whereIn('id', $order->patient_ids ?? [])->get();
            $data[] = "patients";
        } elseif ($step === OrderStep::FINALIZE) {
            $order->load([
                "Patient",
                "OrderItems.Samples.Material",
                "OrderItems.Samples.Patient",
                "OrderItems.Samples.SampleType",
                "Tests",
                "OrderItems.Patients",
                "OrderItems.Test"
            ]);

            // Flatten samples for frontend compatibility (same as SAMPLE_DETAILS step)
            $order->samples = $order->OrderItems->pluck('Samples')->flatten()->values();

            // Get all patients from patient_ids
            if (!empty($order->patient_ids)) {
                $patients = Patient::whereIn('id', $order->patient_ids)->get();
                $data[] = "patients";
            }
        } elseif ($step === OrderStep::TEST_METHOD) {
            $order->load("Tests");
        } elseif ($step === OrderStep::CONSENT_FORM) {
            $consents = $this->consentTermRepository->getAll([])->pluck("name")->flatten()->map(fn($item) => ["title" => $item]);
            $data[] = "consents";
        }
        return Inertia::render("Order/Edit/" . Str::studly($step->value), compact(...$data));
    }

    /**
     * Update the specified resource in storage.
     * @param UpdateOrderRequest $request
     * @param Order $order
     * @param OrderStep $step
     * @return RedirectResponse
     */
    public function update(UpdateOrderRequest $request, Order $order, OrderStep $step)
    {
        $this->orderRepository->update($order, $request->except("_method"), $step);
        $nextStep = $step->next();
        return redirect()->route($step !== OrderStep::FINALIZE ? "orders.edit" : "orders.show", ["order" => $order, "step" => $nextStep]);
    }

    /**
     * Remove the specified resource from storage.
     * @param Order $order
     * @return RedirectResponse
     * @throws AuthorizationException
     */
    public function destroy(Order $order)
    {
        $this->authorize("delete", $order);
        $this->orderRepository->delete($order);
        return back()->with(["status" => __("successfullyDelete", ["title" => "order"]), "success" => true]);
    }
}
