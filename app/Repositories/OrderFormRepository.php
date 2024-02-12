<?php


namespace App\Repositories;


use App\Interfaces\OrderFormRepositoryInterface;
use App\Models\OrderForm;
use App\Services\UploadFileService;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

class OrderFormRepository extends BaseRepository implements OrderFormRepositoryInterface
{
    protected UploadFileService $uploadFileService;

    public function __construct(OrderForm $orderForm, UploadFileService $uploadFileService)
    {
        $this->uploadFileService = $uploadFileService;

        $this->query = $orderForm->newQuery();
    }


    public function list(array $queryData): LengthAwarePaginator
    {
        if (isset($queryData["filters"]))
            $this->applyFilter($queryData["filters"]);
        if (isset($queryData["sort"]))
            $this->applyOrderBy($queryData["sort"]);
        return $this->applyPagination($queryData["pageSize"] ?? $this->pageSize);
    }

    public function getAll(array $queryData): Collection|array
    {
        if (isset($queryData["filters"]))
            $this->applyFilter($queryData["filters"]);
        if (isset($queryData["sort"]))
            $this->applyOrderBy($queryData["sort"]);
        return $this->applyGet(["order_forms.*"]);
    }

    public function create($orderFormDetails): OrderForm
    {
        return $this->query->create([
            ...$orderFormDetails,
            "file" => $orderFormDetails["file"]?$this->uploadFileService->init("orderForms")[0]:""]);
    }

    public function show(OrderForm $orderForm): OrderForm
    {
        return $orderForm;
    }

    public function update(OrderForm $orderForm, $newOrderFormDetails): void
    {
        $orderForm->update([
            ...$newOrderFormDetails,
            "file" => $newOrderFormDetails["file"]?(is_string($newOrderFormDetails["file"]) ? $newOrderFormDetails["file"] : $this->uploadFileService->init("orderForms")[0]):""]);
    }

    public function delete(OrderForm $orderForm): ?bool
    {
        if ($orderForm->Tests()->count() < 1)
        return $orderForm->delete();
        return false;
    }

    public function applyFilter($filters = []): void
    {
        if (isset($filters["search"])) {
            $this->query->search();
        }
        if (isset($filters["name"])) {
            $this->query->search($filters["name"], ["name"]);
        }
        if (isset($filters["tests"])) {
            $this->query->whereHas("Tests", function ($q) use ($filters) {
                $q->whereIn("tests.id", $filters["tests"]);
            });
        }
    }

    public function getById($id): OrderForm|null
    {
        return $this->query->where("id", $id)->first();
    }


}
