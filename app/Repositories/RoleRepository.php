<?php

namespace App\Repositories;

use App\Interfaces\RoleRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;
use Spatie\Permission\Models\Role;

class RoleRepository extends BaseRepository implements RoleRepositoryInterface
{


    public function __construct(Role $role)
    {
        $this->query = $role->newQuery();
    }

    public function list(array $queryData)
    {
        $this->query->withCount(['users', 'permissions']);
        $this->applyFilter($queryData["filters"]);
        $this->applyOrderBy($queryData["sort"]);
        return $this->applyPagination($queryData["pageSize"]??$this->pageSize);
    }

    public function getAll(array $queryData): Collection|array
    {
        $this->applyFilter($queryData["filters"]);
        $this->applyOrderBy($queryData["sort"]);
        return $this->applyGet();
    }

    public function create(array $roleData): Role
    {
        $role= $this->query->create($roleData);
        $role->syncPermissions(array_map(fn($perm) => $perm["id"], $roleData["permissions"]));
        return $role;
    }

    public function show(Role $role)
    {
        return $role->load("permissions");
    }

    public function edit(Role $role, $roleNewData)
    {
        $role->update(["name" => $roleNewData["name"]]);
        $role->syncPermissions(array_map(fn($perm) => $perm["id"], $roleNewData["permissions"]));
    }

    public function delete(Role $role)
    {
        if ($role->users()->count() < 1)
            $role->delete();
    }

    protected function applyFilter($filters): void
    {
        if (isset($filters["name"])) {
            $this->query->where("name", "ilike", "%" . $filters["name"] . "%");
        }
        if (isset($filters["search"])) {
            $this->query->where("name", "ilike", "%" . $filters["search"] . "%");
        }
        if (isset($filters["permission"]["name"]))
            $this->query->WhereHas("permissions", function ($q) use ($filters) {
                $q->where("name", $filters["permission"]["name"]);
            });
    }


}
