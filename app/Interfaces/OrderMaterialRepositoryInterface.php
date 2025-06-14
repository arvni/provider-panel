<?php


namespace App\Interfaces;



use App\Models\OrderMaterial;

interface OrderMaterialRepositoryInterface
{
    public function list(array $inputs);
    public function getUserOrders(array $inputs);
    public function getAll(array $inputs);
    public function findById($id);
    public function create($orderMaterialDetails);
    public function show(OrderMaterial $orderMaterial);
    public function update(OrderMaterial $orderMaterial, $newOrderMaterialDetails);
    public function delete(OrderMaterial $orderMaterial);
}
