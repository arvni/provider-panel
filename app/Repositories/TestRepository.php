<?php

namespace App\Repositories;

use App\Interfaces\MaterialRepositoryInterface;
use App\Interfaces\TestRepositoryInterface;
use App\Models\Material;
use App\Models\Test;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class TestRepository extends BaseRepository implements TestRepositoryInterface
{

    protected MaterialRepositoryInterface $materialRepository;

    public function __construct(Test $test, MaterialRepositoryInterface $materialRepository)
    {
        $this->query = $test->newQuery();
        $this->materialRepository = $materialRepository;
    }

    public function list(array $queryData): LengthAwarePaginator
    {
        $this->query
            ->withAggregate("DefaultSampleType", "name")
            ->withAggregate("Consent", "file")
            ->withAggregate("Instruction", "file")
            ->withAggregate("OrderForm", "file")
            ->with(["sampleTypes"]);
        if (isset($queryData["active"]))
            $this->query->active();
        $this->applyQueries($queryData);
        return $this->applyPagination($queryData["pageSize"] ?? $this->pageSize);
    }

    public function listUserTests(array $queryData): LengthAwarePaginator
    {
        $this->query = auth()->user()->Tests();
        $this->query
            ->withAggregate("DefaultSampleType", "name")
            ->withAggregate("Consent", "file")
            ->withAggregate("Instruction", "file")
            ->withAggregate("OrderForm", "file")
            ->with(["sampleTypes"]);
        if (isset($queryData["active"]))
            $this->query->active();
        $this->applyQueries($queryData);
        return $this->applyPagination($queryData["pageSize"] ?? $this->pageSize);
    }

    public function getAll(array $queryData): Collection|array
    {
        $this->query = auth()->user()->Tests()
            ->active()
            ->select(DB::raw("*"));
        $this->applyQueries($queryData);
        return $this->applyGet();
    }

    /**
     * @param array $queryData
     * @return LengthAwarePaginator
     */
    public function getPaginate(array $queryData): LengthAwarePaginator
    {
        $this->query
            ->with("sampleTypes")
            ->withAggregate("Consent", "file")
            ->withAggregate("Instruction", "file")
            ->withAggregate("OrderForm", "file")
            ->active();
        $this->applyQueries($queryData);
        return $this->applyPagination($queryData["pageSize"] ?? $this->pageSize);
    }

    public function create(array $testData)
    {
        $test = $this->query->make($testData);
        if (isset($testData["consent"]["id"]))
            $test->Consent()->associate($testData["consent"]["id"]);
        if (isset($testData["instruction"]["id"]))
            $test->Instruction()->associate($testData["instruction"]["id"]);
        if (isset($testData["order_form"]["id"]))
            $test->OrderForm()->associate($testData["order_form"]["id"]);
        $test->save();
        $test->refresh();
        $this->syncSampleTypes($test, $testData["sample_types"]);
        return $test;
    }

    /**
     * find test by id
     *
     * @param $id
     * @return Test|null
     */
    public function getById($id): Test|null
    {
        return $this->query->where("id", $id)->with(["Consent:name,id", "Instruction:name,id", "OrderForm", "SampleTypes"])->first();
    }

    /**
     *
     * @param Test $test
     * @return Test
     */
    public function show(Test $test): Test
    {
        return $test->load(["Consent:name,id", "Instruction:name,id", "OrderForm", "SampleTypes"]);
    }

    /**
     * @param Test $test
     * @param array $newTestData
     * @return void
     */
    public function edit(Test $test, array $newTestData): void
    {
        $test->fill($newTestData);
        if (isset($newTestData["consent"]["id"]))
            $test->Consent()->associate($newTestData["consent"]["id"]);
        if (isset($newTestData["instruction"]["id"]))
            $test->Instruction()->associate($newTestData["instruction"]["id"]);
        if (isset($newTestData["order_form"]["id"]))
            $test->OrderForm()->associate($newTestData["order_form"]["id"]);

        if ($test->isDirty())
            $test->update();
        $this->syncSampleTypes($test, $newTestData["sample_types"]);
    }

    public function destroy(Test $test): void
    {
        // @todo add if and count relations
        $test->delete();
    }

    protected function applyFilter(array $filters): void
    {
        if (isset($filters["search"])) {
            $this->query->search($filters["search"]);
        }
        if (isset($filters["name"])) {
            $this->query->search($filters["name"], ["name"]);
        }
        if (isset($filters["shortName"])) {
            $this->query->search($filters["shortName"], ["shortName"]);
        }
        if (isset($filters["code"])) {
            $this->query->search($filters["code"], ["code"]);
        }
        if (isset($filters["barcode"])) {
            $material = $this->materialRepository->getByBarcode($filters["barcode"]);
            $this->query->whereHas("AllSampleTypes", function ($q) use ($material) {
                $q->where("sample_types.id", $material->SampleType->id);
            });
        }
    }

    private function syncSampleTypes(Test $test, array $sampleTypes): void
    {
        if ($test->SampleTypes()->count())
            $test->SampleTypes()->delete();
        $test->SampleTypes()->createMany(array_map(fn(array $item) => [...$item, "id" => Str::uuid(), "sample_type_id" => $item["sample_type"]["id"]], $sampleTypes));
    }
}
