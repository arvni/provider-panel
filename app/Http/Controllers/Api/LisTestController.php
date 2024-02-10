<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\TestResource;
use App\Interfaces\TestRepositoryInterface;
use Illuminate\Http\Request;

class LisTestController extends Controller
{
    private TestRepositoryInterface $testRepository;
    public function __construct(TestRepositoryInterface $testRepository)
    {
        $this->testRepository=$testRepository;
    }
    /**
     * Handle the incoming request.
     */
    public function __invoke(Request $request)
    {
        $tests=$this->testRepository->getPaginate(["filters"=>$request->all()]);
        return TestResource::collection($tests);
    }
}
