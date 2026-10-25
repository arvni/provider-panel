<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\TestResource;
use App\Interfaces\TestRepositoryInterface;
use Illuminate\Http\Request;

class ListUserTestsController extends Controller
{
    private TestRepositoryInterface $testRepository;

    public function __construct(TestRepositoryInterface $testRepository)
    {
        $this->testRepository = $testRepository;
    }

    /**
     * Handle the incoming request.
     */
    public function __invoke(Request $request)
    {
        // The order wizard's test picker: pre-order tests are started from Pre-orders instead.
        $tests = $this->testRepository->listUserTests(['filters' => $request->all(), 'direct' => true]);

        return TestResource::collection($tests);
    }
}
