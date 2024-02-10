<?php

namespace App\Http\Controllers;

use App\Interfaces\TestRepositoryInterface;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ListTestController extends Controller
{
    protected TestRepositoryInterface $testRepository;

    public function __construct(TestRepositoryInterface $testRepository)
    {
        $this->testRepository = $testRepository;
        $this->middleware("indexProvider");
    }

    /**
     * Handle the incoming request.
     */
    public function __invoke(Request $request)
    {
        $tests = $this->testRepository->list($request->all());
        return Inertia::render("Wiki", ["tests" => $tests, "request" => $request->all()]);
    }
}
