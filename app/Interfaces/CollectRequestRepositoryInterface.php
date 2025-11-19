<?php


namespace App\Interfaces;


use App\Models\CollectRequest;

interface CollectRequestRepositoryInterface
{
    public function list(array $queryData);
    public function getUserList(array $queryData);
    public function getAll(array $queryData);
    public function create($collectRequestDetails);
    public function show(CollectRequest $collectRequest);
    public function update(CollectRequest $collectRequest, $newCollectRequestDetails);
    public function delete(CollectRequest $collectRequest);
    public function getById(int $id);
    public function getByServerId(int $id);
}
