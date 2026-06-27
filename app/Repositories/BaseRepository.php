<?php

namespace App\Repositories;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use JetBrains\PhpStorm\ArrayShape;

abstract class BaseRepository
{
    protected $query;

    protected int $pageSize = 10;

    protected function applyQueries(array $queryData): void
    {
        if (isset($queryData['filters'])) {
            $this->applyFilter($queryData['filters']);
        }
        if (isset($queryData['sort'])) {
            $this->applyOrderBy($queryData['sort']);
        }
    }

    abstract protected function applyFilter(array $filters): void;

    /**
     * @param  array  $orderBy  {
     *                          field: string
     *                          type:enum['asc','desc']
     *                          }
     */
    #[ArrayShape(['sort' => ['filed' => 'string', 'type' => 'string']])]
    protected function applyOrderBy(array $orderBy): void
    {
        $this->query->orderBy($orderBy['field'], $orderBy['type']);
    }

    protected function applyPagination(int $pageSize = 10): LengthAwarePaginator
    {
        return $this->query->paginate($pageSize);
    }

    protected function applyGet(array $cols = []): Collection|array
    {
        return $this->query->get($cols);
    }
}
