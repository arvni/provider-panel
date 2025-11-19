<?php

namespace App\Http\Controllers\Admin;

use App\Enums\CollectRequestStatus;
use App\Enums\OrderStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreCollectRequestRequest;
use App\Http\Requests\UpdateCollectRequestRequest;
use App\Interfaces\CollectRequestRepositoryInterface;
use App\Jobs\SendCollectionRequest;
use App\Models\CollectRequest;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\RedirectResponse;
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
        $this->authorize("view", $collectRequest);
        $collectRequest = $this->collectRequestRepository->show($collectRequest);
        return Inertia::render('CollectRequest/Show', ["collectRequest" => $collectRequest]);
    }

    /**
     * Update the specified resource in storage.
     * @param UpdateCollectRequestRequest $request
     * @param CollectRequest $collectRequest
     * @return RedirectResponse
     */
    public function update(UpdateCollectRequestRequest $request, CollectRequest $collectRequest): RedirectResponse
    {
        $status=$request->get("status");
        $data = [
            "status" => $status,
            "details" => array_merge($collectRequest->details??[],$request->except("status","_method"))
        ];
        $this->collectRequestRepository->update($collectRequest, $data);
        if ($request->get("status")==CollectRequestStatus::PICKED_UP->value)
            $collectRequest->Orders()->update(["status"=>OrderStatus::SENT]);
        return back()->with(["status" => __("messages.successfullyUpdated")]);
    }

    /**
     * Send collection request to main server
     * @param CollectRequest $collectRequest
     * @return RedirectResponse
     */
    public function send(CollectRequest $collectRequest): RedirectResponse
    {
        $this->authorize("update", $collectRequest);

        // Check if already sent
        if ($collectRequest->server_id) {
            return back()->with([
                "status" => "Collection request has already been sent to the server.",
                "error" => true
            ]);
        }

        // Dispatch the job
        SendCollectionRequest::dispatch($collectRequest);

        return back()->with([
            "status" => "Collection request has been queued for sending to the server.",
            "success" => true
        ]);
    }

    /**
     * Remove the specified resource from storage.
     * @param CollectRequest $collectRequest
     * @return RedirectResponse
     * @throws AuthorizationException
     */
    public function destroy(CollectRequest $collectRequest): RedirectResponse
    {
        $this->authorize("delete",$collectRequest);
        $this->collectRequestRepository->delete($collectRequest);
        return back()->with(["stats"=>__("successfullyDeleted",["title"=>"collect request"])]);
    }
}
