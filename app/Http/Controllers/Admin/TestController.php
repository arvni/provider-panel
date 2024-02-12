<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreTestRequest;
use App\Http\Requests\UpdateTestRequest;
use App\Interfaces\TestRepositoryInterface;
use App\Models\Test;
use App\Services\PrepareTestSampleTypesList;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TestController extends Controller
{
    protected TestRepositoryInterface $testRepository;

    public function __construct(TestRepositoryInterface $testRepository)
    {
        $this->testRepository = $testRepository;
        $this->middleware("indexProvider")->only("index");
    }

    /**
     * Display a listing of the resource.
     * @param Request $request
     * @return Response
     * @throws AuthorizationException
     */
    public function index(Request $request): Response
    {
        $this->authorize("viewAny", Test::class);
        $tests = $this->testRepository->list($request->all());
        return Inertia::render("Test/Index", ["tests" => $tests, "request" => $request->all()]);
    }

    /**
     * Show the form for creating a new resource.
     * @return Response
     * @throws AuthorizationException
     */
    public function create(): Response
    {
        $this->authorize("create", Test::class);
        return Inertia::render("Test/Add");
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreTestRequest $request)
    {
        $this->testRepository->create($request->all());
        return redirect()->route("admin.tests.index")->with(["status" => __("messages.successfullyAdded", ["type" => "Test", "title" => $request->get("name")])]);
    }

    /**
     * Display the specified resource.
     */
    public function show(Test $test)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Test $test)
    {
        $test = $this->testRepository->show($test);
        return Inertia::render("Test/Edit", ["test" => $test]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateTestRequest $request, Test $test)
    {
        $this->testRepository->edit($test, $request->all());
        return redirect()->route("admin.tests.index")->with(["status" => __("messages.successfullyUpdated", ["type" => "Test", "title" => $request->get("name")])]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Test $test)
    {
        $this->authorize("delete", $test);
        $title = $test->name;
        $this->testRepository->destroy($test);
        return redirect()->route("admin.tests.index")->with(["status" => __("messages.successfullyDeleted", ["type" => "Test", "title" => $title])]);
    }
}
