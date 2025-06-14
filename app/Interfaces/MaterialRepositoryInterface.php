<?php
namespace App\Interfaces;

use App\Models\Material;

interface MaterialRepositoryInterface
{
    public function getByBarcode(string $barcode);

    public function createMaterial($data);
    public function updateMaterial(Material$material,$data);
}
