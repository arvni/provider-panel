<?php

namespace App\Http\Controllers;

use App\Enums\OrderStep;
use App\Interfaces\ConsentTermRepositoryInterface;
use App\Interfaces\OrderRepositoryInterface;
use App\Models\Order;
use App\Http\Requests\StoreOrderRequest;
use App\Http\Requests\UpdateOrderRequest;
use App\Models\SampleType;
use App\Repositories\ConsentTermRepository;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class OrderController extends Controller
{
    private OrderRepositoryInterface $orderRepository;
    protected ConsentTermRepositoryInterface $consentTermRepository;

    public function __construct(OrderRepositoryInterface $orderRepository,ConsentTermRepositoryInterface $consentTermRepository)
    {
        $this->orderRepository = $orderRepository;
        $this->consentTermRepository=$consentTermRepository;
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
    public function create()
    {
        return Inertia::render("Order/Add");
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
        $order->load(["Patient", "Samples.Material", "Tests"]);
        return Inertia::render("Order/Show", compact("order"));
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Order $order, OrderStep $step)
    {

        $data = ["order", "step"];
        if ($step == OrderStep::SAMPLE_DETAILS) {
            $tests=$order->Tests()->get()->pluck("id")->flatten()->toArray();
            $sampleTypes = SampleType::whereHas("Tests",function ($q)use($tests){
                $q->whereIn("tests.id",$tests);
            })->get()
                ->map(fn(SampleType $sampleType) => [
                    "id" => $sampleType->id,
                    "name" => $sampleType->name,
                    "sampleIdRequired" => $sampleType->sample_id_required
                ]);
            $data[] = "sampleTypes";
            $order->load("Samples");
        }
        elseif ($step === OrderStep::PATIENT_DETAILS) {
            $order->load("patient");
        }
        elseif ($step === OrderStep::FINALIZE) {
            $order->load(["Patient", "Samples.Material", "Tests"]);
        }
        elseif ($step === OrderStep::TEST_METHOD) {
            $order->load("Tests");
        }elseif ($step===OrderStep::CONSENT_FORM){
            $consents=$this->consentTermRepository->getAll([])->pluck("name")->flatten()->map(fn($item)=>["title"=>$item]);
            $data[]="consents";
        }
        return Inertia::render("Order/Edit/" . Str::studly($step->value), compact(...$data));
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateOrderRequest $request, Order $order, OrderStep $step)
    {
        $this->orderRepository->update($order, $request->except("_method"), $step);
        $nextStep = $step->next();
        return redirect()->route($step !== OrderStep::FINALIZE ? "orders.edit" : "orders.show", ["order" => $order, "step" => $nextStep]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Order $order)
    {
        //
    }
}
