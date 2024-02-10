<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\OrderFormResource;
use App\Interfaces\OrderFormRepositoryInterface;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ListOrderFormsController extends Controller
{
    protected OrderFormRepositoryInterface $orderFormRepository;

    public function __construct(OrderFormRepositoryInterface $orderFormRepository)
    {
        $this->orderFormRepository = $orderFormRepository;
    }

    /**
     * Handle the incoming request.
     * @param Request $request
     * @return AnonymousResourceCollection
     */
    public function __invoke(Request $request): AnonymousResourceCollection
    {
        return OrderFormResource::collection($this->orderFormRepository->list($request->all()));
    }
}
