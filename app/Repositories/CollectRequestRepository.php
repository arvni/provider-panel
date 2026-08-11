<?php

namespace App\Repositories;

use App\Enums\CollectRequestStatus;
use App\Enums\OrderStatus;
use App\Interfaces\CollectRequestRepositoryInterface;
use App\Models\CollectRequest;
use App\Models\Order;
use App\Models\Sample;
use App\Services\OrderStatusRecorder;
use App\Services\UploadFileService;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;

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
            ->withAggregate('User', 'name')
            ->withCount('Orders');

        // Filter by user_id if provided (for regular users)
        if (isset($queryData['user_id'])) {
            $this->query->where('user_id', $queryData['user_id']);
        }

        if (isset($queryData['filters'])) {
            $this->applyFilter($queryData['filters']);
        }

        // Apply sorting - default to newest first (created_at desc)
        if (isset($queryData['sort'])) {
            $this->applyOrderBy($queryData['sort']);
        } else {
            $this->query->orderBy('created_at', 'desc');
        }

        return $this->applyPagination($queryData['pageSize'] ?? $this->pageSize);
    }

    public function getUserList(array $queryData): LengthAwarePaginator
    {
        if (isset($queryData['filters'])) {
            $this->applyFilter($queryData['filters']);
        }
        if (isset($queryData['sort'])) {
            $this->applyOrderBy($queryData['sort']);
        }

        return $this->applyPagination($queryData['pageSize'] ?? $this->pageSize);
    }

    public function getAll(array $queryData): Collection|array
    {
        if (isset($queryData['filters'])) {
            $this->applyFilter($queryData['filters']);
        }
        if (isset($queryData['sort'])) {
            $this->applyOrderBy($queryData['sort']);
        }

        return $this->applyGet(['order_forms.*']);
    }

    /**
     * Create an order-backed collect request.
     *
     * The owner defaults to the authenticated user (a provider raising their own
     * request) but may be given explicitly as `user_id` when an admin raises the
     * request on a provider's behalf. Only that owner's still-collectable orders
     * are attached, so a stale selection can never pull in someone else's order.
     */
    public function create($collectRequestDetails): CollectRequest
    {
        $userId = $collectRequestDetails['user_id'] ?? auth()->id();

        return DB::transaction(function () use ($collectRequestDetails, $userId) {
            $collectRequest = $this->query->make([
                'preferred_date' => $collectRequestDetails['preferred_date'],
                'status' => CollectRequestStatus::REQUESTED,
                'notes' => $collectRequestDetails['notes'] ?? null,
            ]);
            $collectRequest->User()->associate($userId);
            $collectRequest->save();
            $collectRequest->refresh();

            $attachable = Order::whereIn('id', $collectRequestDetails['selectedOrders'])
                ->where('user_id', $userId)
                ->where('status', OrderStatus::REQUESTED)
                ->whereNull('collect_request_id');

            // Captured before the update -- it bypasses the model layer, so the
            // timeline would otherwise miss this step entirely.
            $before = (clone $attachable)->get(['id', 'status']);

            $attachable->update([
                'collect_request_id' => $collectRequest->id,
                'status' => OrderStatus::LOGISTIC_REQUESTED,
            ]);

            app(OrderStatusRecorder::class)
                ->recordMany($before, OrderStatus::LOGISTIC_REQUESTED->value, $userId);

            // Tag the samples of the orders that were actually attached above.
            $attachedOrderIds = Order::where('collect_request_id', $collectRequest->id)->pluck('id');
            Sample::whereHas('OrderItems', function ($query) use ($attachedOrderIds) {
                $query->whereIn('order_id', $attachedOrderIds);
            })->update(['collect_request_id' => $collectRequest->id]);

            return $collectRequest;
        });
    }

    public function show(CollectRequest $collectRequest): CollectRequest
    {
        $collectRequest->load([
            'Orders.Patient',
            // Only the samples that belong to this collect request, so the detail
            // view reflects exactly what was collected (per-sample selection).
            'Orders.OrderItems.Samples' => function ($query) use ($collectRequest) {
                $query->where('samples.collect_request_id', $collectRequest->id)
                    ->with(['SampleType', 'Material', 'Patient']);
            },
            'Orders.Tests',
            // Flat list of every sample tagged to this request, carrying the
            // order item (and therefore the order + test) it was collected for,
            // so the detail view can list samples on their own.
            'Samples' => function ($query) {
                $query->with(['Material', 'OrderItems.Test'])->orderBy('id');
            },
            'User',
        ]);

        // Flatten samples for each order for frontend compatibility
        foreach ($collectRequest->Orders as $order) {
            $order->samples = $order->OrderItems->pluck('Samples')->flatten()->values();
        }

        return $collectRequest;
    }

    public function update(CollectRequest $collectRequest, $newCollectRequestDetails): void
    {
        $collectRequest->fill([...$newCollectRequestDetails]);
        if ($collectRequest->isDirty()) {
            $collectRequest->save();
        }
    }

    public function delete(CollectRequest $collectRequest): ?bool
    {
        $collectRequest->Orders()->update(['status' => OrderStatus::REQUESTED, 'collect_request_id' => null]);

        return $collectRequest->delete();
    }

    public function applyFilter($filters = []): void
    {
        if (isset($filters['search'])) {
            $this->query->search();
        }
        if (isset($filters['user_name'])) {
            $this->query->search($filters['user_name'], ['User.name']);
        }
        if (isset($filters['status']) && $filters['status'] !== '') {
            $this->query->where('status', $filters['status']);
        }
        if (isset($filters['synced']) && $filters['synced'] !== '') {
            if ($filters['synced'] === '1') {
                $this->query->whereNotNull('server_id');
            } elseif ($filters['synced'] === '0') {
                $this->query->whereNull('server_id');
            }
        }
    }

    public function getById($id): ?CollectRequest
    {
        return $this->query->where('id', $id)->first();
    }

    public function getByServerId($id): ?CollectRequest
    {
        return $this->query->where('server_id', $id)->first();
    }
}
