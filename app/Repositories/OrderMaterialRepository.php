<?php


namespace App\Repositories;


use App\Interfaces\OrderMaterialRepositoryInterface;
use App\Models\OrderMaterial;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

class OrderMaterialRepository extends BaseRepository implements OrderMaterialRepositoryInterface
{
    public function __construct(OrderMaterial $orderMaterial)
    {
        $this->query = $orderMaterial->newQuery()->with(["SampleType","User"]);
    }

    public function list(array $queryData): LengthAwarePaginator
    {
        $this->query->withCount(["Materials"]);
        if (isset($queryData["filters"]))
            $this->applyFilter($queryData["filters"]);
        if (isset($queryData["sort"]))
            $this->applyOrderBy($queryData["sort"]);
        return $this->applyPagination($queryData["pageSize"] ?? $this->pageSize);
    }

    public function getUserOrders(array $queryData = [])
    {
        $this->query = auth()->user()->OrderMaterials()->getQuery()->with("SampleType");
        return $this->list($queryData);
    }

    public function getAll(array $queryData): Collection|array
    {
        if (isset($queryData["filters"]))
            $this->applyFilter($queryData["filters"]);
        if (isset($queryData["sort"]))
            $this->applyOrderBy($queryData["sort"]);
        return $this->applyGet();
    }

    public function create($orderMaterialDetails): void
    {
        $orderMaterial = $this->query->make($orderMaterialDetails);
        $orderMaterial->User()->associate(auth()->user()->id);
        $orderMaterial->SampleType()->associate($orderMaterialDetails["sample_type"]);
        $orderMaterial->save();
    }

    public function show(OrderMaterial $orderMaterial): OrderMaterial
    {
        return $orderMaterial->load(["SampleType","Materials","User"]);
    }

    public function update(OrderMaterial $orderMaterial, $newOrderMaterialDetails): void
    {
        $orderMaterial->update($newOrderMaterialDetails);
    }

    public function delete(OrderMaterial $orderMaterial)
    {
        $orderMaterial->delete();
    }

    public function applyFilter($filters = []): void
    {
        if (isset($filters["search"])) {
            $this->query->where("name", "ilike", "%" . $filters["search"] . "%");
        }
        if (isset($filters["name"])) {
            $this->query->where("name", "ilike", "%" . $filters["name"] . "%");
        }
    }

}
