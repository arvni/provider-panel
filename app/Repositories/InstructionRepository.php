<?php


namespace App\Repositories;


use App\Interfaces\InstructionRepositoryInterface;
use App\Models\Instruction;
use App\Services\UploadFileService;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

class InstructionRepository extends BaseRepository implements InstructionRepositoryInterface
{
    protected UploadFileService $uploadFileService;

    public function __construct(Instruction $instruction, UploadFileService $uploadFileService)
    {
        $this->uploadFileService = $uploadFileService;

        $this->query = $instruction->newQuery();
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

    public function create($instructionDetails): Instruction
    {
        return $this->query->create([
            ...$instructionDetails,
            "file" => $instructionDetails["file"] ? $this->uploadFileService->init("instructions")[0] : ""]);
    }

    public function show(Instruction $instruction): Instruction
    {
        return $instruction;
    }

    public function update(Instruction $instruction, $newInstructionDetails): void
    {
        $instruction->update([
            ...$newInstructionDetails,
            "file" => $newInstructionDetails["file"] ?
                (is_string($newInstructionDetails["file"]) ? $newInstructionDetails["file"] : $this->uploadFileService->init("instructions")[0]) :
                ""
        ]);
    }

    public function delete(Instruction $instruction): ?bool
    {
        return $instruction->delete();
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

    public function getById($id): Instruction|null
    {
        return $this->query->where("id", $id)->first();
    }


}
