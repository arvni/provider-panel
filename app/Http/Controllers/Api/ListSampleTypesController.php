<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\SampleTypeResource;
use App\Interfaces\SampleTypeRepositoryInterface;
use Illuminate\Http\Request;

class ListSampleTypesController extends Controller
{
    protected SampleTypeRepositoryInterface $sampleTypeRepository;

    public function __construct(SampleTypeRepositoryInterface $sampleTypeRepository)
    {
        $this->sampleTypeRepository = $sampleTypeRepository;
    }

    /**
     * Handle the incoming request.
     */
    public function __invoke(Request $request)
    {
        return SampleTypeResource::collection($this->sampleTypeRepository->list($request->all()));
    }
}
