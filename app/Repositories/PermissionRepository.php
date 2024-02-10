<?php


namespace App\Repositories;


use App\Interfaces\PermissionRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use JetBrains\PhpStorm\ArrayShape;
use Spatie\Permission\Models\Permission;

class PermissionRepository extends BaseRepository implements PermissionRepositoryInterface
{
    public function __construct(Permission $permission)
    {
        $this->query = $permission->newQuery();
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
        if (isset($queryData["filters"]))
            $this->applyFilter($queryData["filters"]);
        if (isset($queryData["sort"]))
            $this->applyOrderBy($queryData["sort"]);
        return $this->applyGet();
    }

    public function create($permissionDetails): void
    {
        $this->query->create($permissionDetails);
    }

    public function show(Permission $permission): Permission
    {
        return $permission;
    }

    public function update(Permission $permission, $newPermissionDetails): void
    {
        $permission->update($newPermissionDetails);
    }

    public function delete(Permission $permission)
    {
        $permission->delete();
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

    public function getPermissionByName($name): Permission|null
    {
        return $this->query->where("name", $name)->first();
    }


    public function preparedPermissions()
    {
        return $this->query->orderBy("name")->get(['name', 'id'])
            ->map(function ($item) {
                $sections = explode(".", $item->name);
                list($section, $parentClass, $parentId, $class, $id) = optional($sections);
                return [
                    "name" => $id ? "$class->$id" : ($class ? "$parentId->$class" : ($parentId ? "$parentClass->$parentId" : ($parentClass ? $parentClass : $section))),
                    "id" => $item->id,
                    "key" => $item->name,
                    "level" => !!$section + !!$parentClass + !!$parentId + !!$class + !!$id,
                    "section" => __("$section"),
                    "subSection" => __("$parentClass"),
                    "lastGroup" => $parentId
                ];
            })->groupBy("section")->map(function ($item) {
                return $item->groupBy("subSection");
            });
    }

}
