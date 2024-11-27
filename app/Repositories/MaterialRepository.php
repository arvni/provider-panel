<?php
namespace App\Repositories;

use App\Interfaces\MaterialRepositoryInterface;
use App\Models\Material;

class MaterialRepository extends BaseRepository implements MaterialRepositoryInterface
{
    public function __construct(Material $material)
    {
        $this->query=$material->newQuery();
    }

    protected function applyFilter(array $filters): void
    {
        // TODO: Implement applyFilter() method.
    }

    public function getByBarcode(string $barcode)
    {
        return $this->query->where("barcode", $barcode)->with("SampleType")->first();
    }

}
