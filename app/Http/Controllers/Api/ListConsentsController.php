<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ConsentResource;
use App\Interfaces\ConsentRepositoryInterface;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ListConsentsController extends Controller
{
    protected ConsentRepositoryInterface $consentRepository;

    public function __construct(ConsentRepositoryInterface $consentRepository)
    {
        $this->consentRepository = $consentRepository;
    }

    /**
     * Handle the incoming request.
     * @param Request $request
     * @return AnonymousResourceCollection
     */
    public function __invoke(Request $request): AnonymousResourceCollection
    {
        return ConsentResource::collection($this->consentRepository->list($request->all()));
    }
}
