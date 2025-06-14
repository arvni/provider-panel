<?php

namespace App\Repositories;

use App\Interfaces\MaterialRepositoryInterface;
use App\Models\Material;
use Carbon\Carbon;
use Illuminate\Support\Arr;

class MaterialRepository extends BaseRepository implements MaterialRepositoryInterface
{
    public function __construct(Material $material)
    {
    }

    protected function applyFilter(array $filters): void
    {
        // TODO: Implement applyFilter() method.
    }

    public function getByBarcode(string $barcode)
    {
        return Material::where("barcode", $barcode)->with("SampleType")->first();
    }

    public function createMaterial($data)
    {
        $material = Material::make(Arr::except($data, ["user_id", "sample_type_id"]));
        $material->User()->associate($data['user_id']);
        $material->SampleType()->associate($data['sample_type_id']);
        $material->save();
        return $material;
    }

    public function updateMaterial(Material $material, $data)
    {
        $material->update($data);
    }
}
