<?php

namespace App\Interfaces;

use App\Models\SampleType;
use Illuminate\Database\Eloquent\Collection;

interface SampleTypeRepositoryInterface
{
    public function list(array $queryData = []);
    public function getAll(array $queryData = []);
    public function create(array $sampleTypeDetails): SampleType;
    public function show(SampleType $sampleType):SampleType;
    public function update(SampleType $sampleType, array $newDetails);
    public function delete(SampleType $sampleType): ?bool;
    public function getById(int $id): SampleType;
    public function getByServerId(int $id): ?SampleType;


}
