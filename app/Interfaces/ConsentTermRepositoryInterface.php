<?php


namespace App\Interfaces;


use App\Models\ConsentTerm;

interface ConsentTermRepositoryInterface
{
    public function list(array $inputs);

    public function getAll(array $inputs);

    public function create($consentTermDetails);

    public function show(ConsentTerm $consentTerm);

    public function update(ConsentTerm $consentTerm, $newConsentTermDetails);

    public function delete(ConsentTerm $consentTerm);
}
