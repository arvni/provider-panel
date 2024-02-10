<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreCollectRequestRequest;
use App\Http\Requests\UpdateCollectRequestRequest;
use App\Interfaces\CollectRequestRepositoryInterface;
use App\Models\CollectRequest;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CollectRequestController extends Controller
{
    protected CollectRequestRepositoryInterface $collectRequestRepository;

    public function __construct(CollectRequestRepositoryInterface $collectRequestRepository)
    {
        $this->collectRequestRepository = $collectRequestRepository;
        $this->middleware("indexProvider")->only("index");
    }

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): Response
    {
        $this->authorize("viewAny", CollectRequest::class);
        $requestInputs = $request->all();
        $collectRequests = fn() => $this->collectRequestRepository->list($requestInputs);
        return Inertia::render('CollectRequest/Index', ["collectRequests" => $collectRequests, 'request' => $requestInputs]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreCollectRequestRequest $request)
    {
        //
    }

    /**
     * Display the specified resource.
     */
    public function show(CollectRequest $collectRequest)
    {
        $this->authorize("view",$collectRequest);
        $collectRequest = $this->collectRequestRepository->show($collectRequest);
        return Inertia::render('CollectRequest/Show', ["collectRequest" => $collectRequest]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateCollectRequestRequest $request, CollectRequest $collectRequest)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(CollectRequest $collectRequest)
    {
        //
    }
}
