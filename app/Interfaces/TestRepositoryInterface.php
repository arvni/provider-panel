<?php

namespace App\Interfaces;

use App\Models\Test;

interface TestRepositoryInterface
{
    public function list(array $queryData);
    public function listUserTests(array $queryData);
    public function getAll(array $queryData);
    public function getPaginate(array $queryData);
    public function create(array $testData);
    public function getById($id): ?Test;
    public function getByServerId($id): ?Test;
    public function show(Test $test);
    public function edit(Test $test, array $newTestData);
    public function destroy(Test $test);

}
