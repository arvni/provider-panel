<?php


namespace App\Repositories;


use App\Interfaces\ConsentRepositoryInterface;
use App\Models\Consent;
use App\Services\UploadFileService;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

class ConsentRepository extends BaseRepository implements ConsentRepositoryInterface
{
    protected UploadFileService $uploadFileService;

    public function __construct(Consent $consent, UploadFileService $uploadFileService)
    {
        $this->uploadFileService = $uploadFileService;

        $this->query = $consent->newQuery();
    }


    public function list(array $queryData): LengthAwarePaginator
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
        return $this->applyGet();
    }

    public function create($consentDetails): Consent
    {
        return $this->query->create([
            ...$consentDetails,
            "file" => $consentDetails["file"] ? $this->uploadFileService->init("consents")[0] : ""]);
    }

    public function show(Consent $consent): Consent
    {
        return $consent;
    }

    public function update(Consent $consent, $newConsentDetails): void
    {
        $consent->update([
            ...$newConsentDetails,
            "file" => $newConsentDetails["file"] ?
                (is_string($newConsentDetails["file"]) ? $newConsentDetails["file"] : $this->uploadFileService->init("consents")[0]) :
                ""
        ]);
    }

    public function delete(Consent $consent): ?bool
    {
//        if ($consent->tests()->count() < 1)
        return $consent->delete();
        return false;
    }

    public function applyFilter($filters = []): void
    {
        if (isset($filters["search"])) {
            $this->query->search();
        }
        if (isset($filters["name"])) {
            $this->query->search($filters["name"], ["name"]);
        }
    }

    public function getById($id): Consent|null
    {
        return $this->query->where("id", $id)->first();
    }


}
