<?php

namespace App\Repositories;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;
use JetBrains\PhpStorm\ArrayShape;

abstract class BaseRepository
{
    protected $query;
    protected int $pageSize=10;

    /**
     * @param array $queryData
     * @return void
     */
    protected function applyQueries(array $queryData): void
    {
        if (isset($queryData["filters"]))
            $this->applyFilter($queryData["filters"]);
        if (isset($queryData["sort"]))
            $this->applyOrderBy($queryData["sort"]);
    }

    /**
     * @param array $filters
     * @return void
     */
    abstract protected function applyFilter(array $filters): void;

    /**
     * @param array $orderBy {
     *     field: string
     *     type:enum['asc','desc']
     * }
     * @return void
     */
    #[ArrayShape(["sort" => ["filed" => "string", "type" => "string"],])]
    protected function applyOrderBy(array $orderBy): void
    {
        $this->query->orderBy($orderBy["field"], $orderBy["type"]);
    }

    /**
     * @param int $pageSize
     * @return LengthAwarePaginator
     */
    protected function applyPagination(int $pageSize = 10): LengthAwarePaginator
    {
        return $this->query->paginate($pageSize);
    }

    /**
     * @param array $cols
     * @return Collection|array
     */
    protected function applyGet(array $cols=[]): Collection|array
    {
        return $this->query->get($cols);
    }

}
