<?php

namespace App\Http\Controllers;

use App\Http\Requests\LogisticRequest;
use App\Interfaces\CollectRequestRepositoryInterface;
use App\Jobs\SendCollectionRequest;
use Illuminate\Http\Request;

class StoreCollectRequestController extends Controller
{
    protected CollectRequestRepositoryInterface $collectRequestRepository;

    public function __construct(CollectRequestRepositoryInterface $collectRequestRepository)
    {
        $this->collectRequestRepository = $collectRequestRepository;
    }

    /**
     * Handle the incoming request.
     */
    public function __invoke(LogisticRequest $request)
    {
        $req = $this->collectRequestRepository->create($request->all());
        SendCollectionRequest::dispatch($req);

        return redirect()->back()->with(['status' => __('messages.ordersSuccessfullyRequestLogistic')]);
    }
}
