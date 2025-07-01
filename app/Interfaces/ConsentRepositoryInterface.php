<?php


namespace App\Interfaces;


use App\Models\Consent;

interface ConsentRepositoryInterface
{
    public function list(array $queryData);
    public function getAll(array $queryData);
    public function create($consentDetails);
    public function show(Consent $consent);
    public function update(Consent $consent, $newConsentDetails);
    public function delete(Consent $consent);
    public function getById(int $id);
    public function getByServerId(int $id);
}
