<?php

namespace App\Http\Controllers;

use App\Interfaces\CollectRequestRepositoryInterface;
use App\Models\CollectRequest;
use App\Models\SampleType;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Controller for user-facing collect request operations
 */
class CollectRequestController extends Controller
{
    protected CollectRequestRepositoryInterface $collectRequestRepository;

    public function __construct(CollectRequestRepositoryInterface $collectRequestRepository)
    {
        $this->collectRequestRepository = $collectRequestRepository;
    }

    /**
     * Display a listing of user's collect requests
     */
    public function index(Request $request): Response
    {
        $requestInputs = $request->all();

        // Get collect requests for the authenticated user only
        $collectRequests = fn () => $this->collectRequestRepository->list(
            array_merge($requestInputs, ['user_id' => auth()->id()])
        );

        return Inertia::render('CollectRequest/UserIndex', [
            'collectRequests' => $collectRequests,
            // Choices for the standalone (order-less) collect request form: only
            // the types a provider is allowed to order.
            'sampleTypes' => fn () => SampleType::where('orderable', true)
                ->orderBy('name')
                ->get(['id', 'name']),
            'request' => $requestInputs,
        ]);
    }

    /**
     * Display the specified collect request
     */
    public function show(CollectRequest $collectRequest): Response
    {
        $this->authorize('view', $collectRequest);
        $collectRequest = $this->collectRequestRepository->show($collectRequest);

        return Inertia::render('CollectRequest/UserShow', [
            'collectRequest' => $collectRequest,
        ]);
    }
}
