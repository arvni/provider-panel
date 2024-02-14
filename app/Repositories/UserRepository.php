<?php

namespace App\Repositories;

use App\Interfaces\UserRepositoryInterface;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

class UserRepository extends BaseRepository implements UserRepositoryInterface
{

    public function __construct(User $user)
    {
        $this->query = $user->newQuery();
    }

    public function list(array $queryData): LengthAwarePaginator
    {
        $this->query->with("roles:name,id");
        if (isset($queryData["filters"]))
            $this->applyFilter($queryData["filters"]);
        if (isset($queryData["sort"]))
            $this->applyOrderBy($queryData["sort"]);
        return $this->applyPagination($queryData["pageSize"]??$this->pageSize);
    }

    public function getAll(array $queryData): Collection|array
    {
        $this->applyFilter($queryData["filters"]);
        $this->applyOrderBy($queryData["orderBy"]);
        return $this->applyGet();
    }

    public function create(array $userData)
    {
        $user = $this->query->create($userData);
        $user->syncRoles(array_map(fn($role) => $role["id"], $userData["roles"]));
        return $user;
    }

    /**
     * find user by id
     *
     * @param $id
     * @return User|null
     */
    public function getById($id): User|null
    {
        return $this->query->where("id", $id)->with("roles:name,id")->first();
    }

    public function show(User $user): User
    {
        return $user->load(["roles:name,id"]);
    }

    public function edit(User $user, array $newUserData): void
    {
        $user->fill($newUserData);
        if ($user->isDirty())
            $user->save();
        if (isset($newUserData["roles"]))
            $user->syncRoles(array_map(fn($role) => $role["id"], $newUserData["roles"]));
    }

    public function destroy(User $user): void
    {
        // @todo add if and count relations
        $user->delete();
    }

    protected function applyFilter(array $filters): void
    {

        if (isset($filters["search"])) {
            $this->query->search($filters["search"]);
        }

        if (isset($filters["email"])) {
            $this->query->search($filters["email"], ["email"]);
        }

        if (isset($filters["name"])) {
            $this->query->search($filters["name"], ["name"]);
        }
        if (isset($filters["role"]) && $filters["role"]) {
            $this->query->whereHas("Roles", function ($q) use ($filters) {
                $q->where("id", $filters["role"]['id']);
            });
        }
    }
}
