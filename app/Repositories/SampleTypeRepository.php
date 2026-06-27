<?php

namespace App\Repositories;

use App\Interfaces\SampleTypeRepositoryInterface;
use App\Models\SampleType;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

class SampleTypeRepository extends BaseRepository implements SampleTypeRepositoryInterface
{
    public function __construct(SampleType $sampleType)
    {
        $this->query = $sampleType->newQuery();
    }

    /**
     * Retrieve all sampleTypes based on the provided query data.
     *
     * @return LengthAwarePaginator
     */
    public function list(array $queryData = [])
    {
        if (isset($queryData['filters'])) {
            $this->applyFilter($queryData['filters']);
        }

        if (isset($queryData['sort'])) {
            $this->applyOrderBy($queryData['sort']);
        }

        return $this->applyPagination($queryData['pageSize'] ?? $this->pageSize);
    }

    /**
     * Retrieve all sampleTypes based on the provided query data.
     *
     * @return array|Collection
     */
    public function getAll(array $queryData = [])
    {
        if (isset($queryData['filters'])) {
            $this->applyFilter($queryData['filters']);
        }
        if (isset($queryData['orderBy'])) {
            $this->applyOrderBy($queryData['orderBy']);
        }

        return $this->applyGet();
    }

    /**
     * Apply filters to the query.
     */
    protected function applyFilter(array $filters): void
    {
        if (isset($filters['id'])) {
            $this->query->search($filters['id'], 'id');
        }
        if (isset($filters['search'])) {
            $this->query->search($filters['search']);
        }
        if (isset($filters['name'])) {
            $this->query->search($filters['name']);
        }
    }

    /**
     * Get an sampleType by its ID.
     */
    public function getById(int $id): SampleType
    {
        return $this->query->where('id', $id)->first();
    }

    public function show(SampleType $sampleType): SampleType
    {
        return $sampleType->withoutRelations();
    }

    /**
     * Delete an sampleType.
     */
    public function delete(SampleType $sampleType): ?bool
    {
        return $sampleType->delete();
    }

    /**
     * Create a new sampleType.
     */
    public function create(array $sampleTypeDetails): SampleType
    {

        return $this->query->create($sampleTypeDetails);
    }

    /**
     * Update a sampleType with new details.
     *
     * @return SampleType
     */
    public function update(SampleType $sampleType, array $newDetails)
    {
        $sampleType->fill($newDetails);
        if ($sampleType->isDirty()) {
            $sampleType->save();
        }

        return $sampleType;
    }

    public function getByServerId(int $id): ?SampleType
    {
        return $this->query->where('server_id', $id)->first();
    }
}
