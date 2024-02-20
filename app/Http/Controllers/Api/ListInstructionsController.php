<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\InstructionResource;
use App\Interfaces\InstructionRepositoryInterface;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ListInstructionsController extends Controller
{
    protected InstructionRepositoryInterface $instructionRepository;

    public function __construct(InstructionRepositoryInterface $instructionRepository)
    {
        $this->instructionRepository = $instructionRepository;
    }

    /**
     * Handle the incoming request.
     * @param Request $request
     * @return AnonymousResourceCollection
     */
    public function __invoke(Request $request): AnonymousResourceCollection
    {
        return InstructionResource::collection($this->instructionRepository->list($request->all()));
    }
}
