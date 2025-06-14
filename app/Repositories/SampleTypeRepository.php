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
     * @param array $queryData
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
        return $this->applyPagination($queryData["pageSize"]??$this->pageSize);
    }

    /**
     * Retrieve all sampleTypes based on the provided query data.
     *
     * @param array $queryData
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
     *
     * @param array $filters
     * @return void
     */
    protected function applyFilter(array $filters): void
    {
        if (isset($filters['id'])) {
            $this->query->search($filters["id"], "id");
        }
        if (isset($filters['search'])) {
            $this->query->search();
        }
        if (isset($filters['name'])) {
            $this->query->search($filters["name"]);
        }
    }


    /**
     * Get an sampleType by its ID.
     *
     * @param int $id
     * @return SampleType
     */
    public function getById(int $id): SampleType
    {
        return $this->query->where("id", $id)->first();
    }

    /**
     *
     *
     * @param SampleType $sampleType
     * @return SampleType
     */
    public function show(SampleType $sampleType): SampleType
    {
        return $sampleType->withoutRelations();
    }

    /**
     * Delete an sampleType.
     *
     * @param SampleType $sampleType
     * @return bool|null
     */
    public function delete(SampleType $sampleType): ?bool
    {
        return $sampleType->delete();
    }

    /**
     * Create a new sampleType.
     *
     * @param array $sampleTypeDetails
     * @return SampleType
     */
    public function create(array $sampleTypeDetails): SampleType
    {

        return $this->query->create($sampleTypeDetails);
    }

    /**
     * Update a sampleType with new details.
     *
     * @param SampleType $sampleType
     * @param array $newDetails
     * @return SampleType
     */
    public function update(SampleType $sampleType, array $newDetails)
    {
        $sampleType->fill($newDetails);
        if ($sampleType->isDirty())
            $sampleType->save();
        return $sampleType;
    }

    public function getByServerId(int $id): ?SampleType
    {
        return $this->query->where("server_id", $id)->first();
    }
}
