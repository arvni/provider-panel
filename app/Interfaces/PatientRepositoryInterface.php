<?php

namespace App\Interfaces;

use App\Models\Patient;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

interface PatientRepositoryInterface
{
    public function list(array $queryData = []): LengthAwarePaginator;
    public function getAll(array $queryData = []): Collection|array;
    public function show(Patient $patient): Patient;
    public function update(Patient $patient, array $data): Patient;
    public function delete(Patient $patient): bool;
    public function canDelete(Patient $patient): array;
}
