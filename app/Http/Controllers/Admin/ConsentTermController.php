<?php

namespace App\Http\Controllers\Admin;


use App\Http\Controllers\Controller;
use App\Http\Requests\StoreConsentTermRequest;
use App\Http\Requests\UpdateConsentTermRequest;
use App\Http\Resources\Api\ConsentTermResource;
use App\Interfaces\ConsentTermRepositoryInterface;
use App\Models\ConsentTerm;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class ConsentTermController extends Controller
{
    protected ConsentTermRepositoryInterface $consentTermRepository;

    public function __construct(ConsentTermRepositoryInterface $consentTermRepository)
    {
        $this->consentTermRepository = $consentTermRepository;
        $this->middleware("indexProvider")->only("index");
    }

    /**
     * Display a listing of the resource.
     *
     * @param Request $request
     * @return Response
     * @throws AuthorizationException
     */
    public function index(Request $request): Response
    {
        $this->authorize("viewAny", ConsentTerm::class);
        $requestInputs = $request->all();
        $consentTerms = fn() => $this->consentTermRepository->list($requestInputs);
        $data = ["consentTerms" => $consentTerms, "request" => $requestInputs];
        return Inertia::render('ConsentTerm/Index', $data);
    }

    /**
     * Store a newly created resource in storage.
     *
     * @param StoreConsentTermRequest $request
     * @return RedirectResponse
     */
    public function store(StoreConsentTermRequest $request): RedirectResponse
    {
        $this->consentTermRepository->create($request->all());
        return redirect()->back()->with(["status" => $request["name"] . " consentTerm successfully Added", "success" => true]);
    }

    /**
     * show a newly created resource in storage.
     *
     * @param ConsentTerm $consentTerm
     * @return ConsentTermResource
     */
    public function show(ConsentTerm $consentTerm): ConsentTermResource
    {
        $consentTerm=$this->consentTermRepository->show($consentTerm);
        return new ConsentTermResource($consentTerm);
    }

    /**
     * Update the specified resource in storage.
     *
     * @param UpdateConsentTermRequest $request
     * @param ConsentTerm $consentTerm
     * @return RedirectResponse
     * @throws Throwable
     */
    public function update(UpdateConsentTermRequest $request, ConsentTerm $consentTerm): RedirectResponse
    {
        $consentTerm->update(["name" => $request->get('name')]);
        return redirect()->back()->with(["status" => $request["name"] . " consentTerm successfully Updated", "success" => true]);
    }

    /**
     * Remove the specified resource from storage.
     *
     * @param ConsentTerm $consentTerm
     * @return RedirectResponse
     * @throws AuthorizationException
     */
    public function destroy(ConsentTerm $consentTerm): RedirectResponse
    {
        $this->authorize("delete", $consentTerm);
        $title = $consentTerm->name;
            $consentTerm->delete();
            return redirect()->back()->with(["status" => __("messages.successfullyUpdated", ["type" => "Consent", "title" => $title])]);
    }
}
