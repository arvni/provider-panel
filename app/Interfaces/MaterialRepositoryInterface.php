<?php
namespace App\Interfaces;

interface MaterialRepositoryInterface
{
    public function getByBarcode(string $barcode);
}
