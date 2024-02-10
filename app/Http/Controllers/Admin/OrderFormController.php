<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreOrderFormRequest;
use App\Http\Requests\UpdateOrderFormRequest;
use App\Interfaces\OrderFormRepositoryInterface;
use App\Models\OrderForm;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class OrderFormController extends Controller
{
    protected OrderFormRepositoryInterface $orderFormRepository;

    public function __construct(OrderFormRepositoryInterface $orderFormRepository)
    {
        $this->orderFormRepository = $orderFormRepository;
        $this->middleware("indexProvider")->only("index");
    }


    /**
     * Display a listing of the orderForms.
     *
     * @param Request $request
     * @return Response
     * @throws AuthorizationException
     */
    public function index(Request $request): Response
    {
        $this->authorize("viewAny", OrderForm::class);
        $orderForms = $this->orderFormRepository->list($request->all());
        return Inertia::render("OrderForm/Index", ["orderForms" => $orderForms, "request" => $request->all()]);
    }

    /**
     * @return Response
     * @throws AuthorizationException
     */
    public function create(): Response
    {
        $this->authorize("create", OrderForm::class);
        return Inertia::render("OrderForm/Add");
    }


    /**
     * store the resource.
     * @param StoreOrderFormRequest $request
     * @return RedirectResponse
     */
    public function store(StoreOrderFormRequest $request): RedirectResponse
    {
        $this->orderFormRepository->create($request->all());
        return redirect()->route("admin.orderForms.index")->with(["status" => __("messages.successfullyAdded", ["type" => "Order Form", "title" => $request->get("name")])]);
    }


    /**
     * Edit the specified resource in storage.
     *
     * @param OrderForm $orderForm
     * @return Response
     * @throws AuthorizationException
     */
    public function edit(OrderForm $orderForm): Response
    {
        $this->authorize("update", $orderForm);
        return Inertia::render("OrderForm/Edit", compact("orderForm"));
    }

    /**
     * Update the specified resource in storage.
     * @param UpdateOrderFormRequest $request
     * @param OrderForm $orderForm
     * @return RedirectResponse
     */
    public function update(UpdateOrderFormRequest $request, OrderForm $orderForm): RedirectResponse
    {
        $this->orderFormRepository->update($orderForm, $request->all());
        return redirect()->route("admin.orderForms.index")->with(["status" => __("messages.successfullyUpdated", ["type" => "Order Form", "title" => $request->get("name")])]);
    }

    /**
     * Remove the specified resource from storage.
     * @param OrderForm $orderForm
     * @return RedirectResponse
     * @throws AuthorizationException
     */
    public function destroy(OrderForm $orderForm): RedirectResponse
    {
        $this->authorize("delete", $orderForm);
        $title = $orderForm->name;
        $this->orderFormRepository->delete($orderForm);
        return redirect()->route("admin.orderForms.index")->with(["status" => __("messages.successfullyDeleted", ["type" => "Order Form", "title" => $title])]);
    }
}
