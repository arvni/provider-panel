<?php


namespace App\Repositories;


use App\Interfaces\ConsentTermRepositoryInterface;
use App\Models\ConsentTerm;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

class ConsentTermRepository extends BaseRepository implements ConsentTermRepositoryInterface
{
    public function __construct(ConsentTerm $consentTerm)
    {
        $this->query = $consentTerm->newQuery();
    }

    public function list(array $queryData): LengthAwarePaginator
    {
        if (isset($queryData["filters"]))
            $this->applyFilter($queryData["filters"]);
        if (isset($queryData["sort"]))
            $this->applyOrderBy($queryData["sort"]);
        return $this->applyPagination($queryData["pageSize"]??$this->pageSize);
    }

    public function getAll(array $queryData): Collection|array
    {
        $this->query->active();
        if (isset($queryData["filters"]))
            $this->applyFilter($queryData["filters"]);
        if (isset($queryData["sort"]))
            $this->applyOrderBy($queryData["sort"]);
        return $this->applyGet(["name","id"]);
    }

    public function create($consentTermDetails): void
    {
        $this->query->create($consentTermDetails);
    }

    public function show(ConsentTerm $consentTerm): ConsentTerm
    {
        return $consentTerm;
    }

    public function update(ConsentTerm $consentTerm, $newConsentTermDetails): void
    {
        $consentTerm->update($newConsentTermDetails);
    }

    public function delete(ConsentTerm $consentTerm)
    {
        $consentTerm->delete();
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
