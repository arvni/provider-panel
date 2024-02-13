<?php

namespace App\Http\Controllers;

use App\Interfaces\OrderMaterialRepositoryInterface;
use App\Models\OrderMaterial;
use App\Http\Requests\StoreOrderMaterialRequest;
use App\Http\Requests\UpdateOrderMaterialRequest;
use App\Models\SampleType;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class OrderMaterialController extends Controller
{
    protected OrderMaterialRepositoryInterface $orderMaterialRepository;

    public function __construct(OrderMaterialRepositoryInterface $orderMaterialRepository)
    {
        $this->orderMaterialRepository = $orderMaterialRepository;
        $this->middleware("indexProvider")->only("index");
    }

    /**
     * Display a listing of the resource.
     *
     * @param Request $request
     * @return Response
     * @throws AuthorizationException
     */
    public function index(Request $request): Response
    {
        $requestInputs = $request->all();
        $orderMaterials = fn() => $this->orderMaterialRepository->getUserOrders($requestInputs);
        $sampleTypes=SampleType::where("orderable",true)->get();
        $data = ["orderMaterials" => $orderMaterials, "request" => $requestInputs,"sampleTypes"=>$sampleTypes];
        return Inertia::render('OrderMaterial/Index', $data);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreOrderMaterialRequest $request)
    {
        $this->orderMaterialRepository->create($request->all());
        return redirect()->back()->with(["status" => " order material successfully Added", "success" => true]);
    }

    /**
     * Display the specified resource.
     */
    public function show(OrderMaterial $orderMaterial)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateOrderMaterialRequest $request, OrderMaterial $orderMaterial)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(OrderMaterial $orderMaterial)
    {
        //
    }
}
