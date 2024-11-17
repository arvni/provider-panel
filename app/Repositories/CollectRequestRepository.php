<?php


namespace App\Repositories;


use App\Enums\OrderStatus;
use App\Interfaces\CollectRequestRepositoryInterface;
use App\Models\CollectRequest;
use App\Models\Order;
use App\Services\UploadFileService;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

class CollectRequestRepository extends BaseRepository implements CollectRequestRepositoryInterface
{
    protected UploadFileService $uploadFileService;

    public function __construct(CollectRequest $collectRequest, UploadFileService $uploadFileService)
    {
        $this->uploadFileService = $uploadFileService;

        $this->query = $collectRequest->newQuery();
    }


    public function list(array $queryData): LengthAwarePaginator
    {
        $this->query
            ->withAggregate("User", "name")
            ->withCount("Orders");

        if (isset($queryData["filters"]))
            $this->applyFilter($queryData["filters"]);
        if (isset($queryData["sort"]))
            $this->applyOrderBy($queryData["sort"]);
        return $this->applyPagination($queryData["pageSize"] ?? $this->pageSize);
    }

    public function getUserList(array $queryData): LengthAwarePaginator
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

    public function create($collectRequestDetails): CollectRequest
    {
        $collectRequest = $this->query->make(["preferred_date" => $collectRequestDetails["preferred_date"]]);
        $collectRequest->User()->associate(auth()->user()->id);
        $collectRequest->save();
        $collectRequest->refresh();
        Order::whereIn("id", $collectRequestDetails["selectedOrders"])->update(["collect_request_id" => $collectRequest->id, "status" => OrderStatus::LOGISTIC_REQUESTED]);
        return $collectRequest;
    }

    public function show(CollectRequest $collectRequest): CollectRequest
    {
        $collectRequest->load(["Orders.Patient", "Orders.Samples", "Orders.Tests", "User",]);
        return $collectRequest;
    }

    public function update(CollectRequest $collectRequest, $newCollectRequestDetails): void
    {
        $collectRequest->fill([...$newCollectRequestDetails]);
        if ($collectRequest->isDirty())
            $collectRequest->save();
    }

    public function delete(CollectRequest $collectRequest): ?bool
    {
        $collectRequest->Orders()->update(["status" => OrderStatus::REQUESTED, "collect_request_id" => null]);
        return $collectRequest->delete();
    }

    public function applyFilter($filters = []): void
    {
        if (isset($filters["search"])) {
            $this->query->search();
        }
        if (isset($filters["user_name"])) {
            $this->query->search($filters["user_name"], ["User.name"]);
        }
    }

    public function getById($id): CollectRequest|null
    {
        return $this->query->where("id", $id)->first();
    }


}
