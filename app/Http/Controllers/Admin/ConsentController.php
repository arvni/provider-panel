<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreConsentRequest;
use App\Http\Requests\UpdateConsentRequest;
use App\Http\Resources\ConsentResource;
use App\Interfaces\ConsentRepositoryInterface;
use App\Models\Consent;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ConsentController extends Controller
{
    protected ConsentRepositoryInterface $consentRepository;

    public function __construct(ConsentRepositoryInterface $consentRepository)
    {
        $this->consentRepository = $consentRepository;
        $this->middleware("indexProvider")->only("index");
    }


    /**
     * Display a listing of the consents.
     *
     * @param Request $request
     * @return Response
     * @throws AuthorizationException
     */
    public function index(Request $request): Response
    {
        $this->authorize("viewAny", Consent::class);
        $consents = $this->consentRepository->list($request->all());
        return Inertia::render("Consent/Index", ["consents" => $consents, "request" => $request->all()]);
    }

    /**
     * Store a newly created consent.
     *
     * @param StoreConsentRequest $request
     * @return RedirectResponse
     */
    public function store(StoreConsentRequest $request): RedirectResponse
    {
        $this->consentRepository->create($request->all());
        return redirect()->back()->with(["status" => __("messages.successfullyAdded", ["type" => "Consent", "title" => $request->get("name")])]);
    }

    /**
     * Display the specified consent.
     *
     * @param Consent $consent
     * @return ConsentResource
     * @throws AuthorizationException
     */
    public function show(Consent $consent): ConsentResource
    {
        $this->authorize("view", $consent);
        return new ConsentResource($this->consentRepository->show($consent));
    }

    /**
     * Update the specified consent.
     * @param UpdateConsentRequest $request
     * @param Consent $consent
     * @return RedirectResponse
     */
    public function update(UpdateConsentRequest $request, Consent $consent): RedirectResponse
    {
        $this->consentRepository->update($consent, $request->all());
        return redirect()->back()->with(["status" => __("messages.successfullyUpdated", ["type" => "Consent", "title" => $request->get("name")])]);
    }

    /**
     * Remove the specified consent.
     *
     * @param Consent $consent
     * @return RedirectResponse
     * @throws AuthorizationException
     */
    public function destroy(Consent $consent): RedirectResponse
    {
        $this->authorize("delete", $consent);
        $title = $consent->name;
        if ($this->consentRepository->delete($consent))
            return redirect()->back()->with(["status" => __("messages.successfullyDeleted", ["type" => "Consent", "title" => $title])]);
        return redirect()->back()->withErrors(["error" => "$title consent has man roles"]);
    }
}
