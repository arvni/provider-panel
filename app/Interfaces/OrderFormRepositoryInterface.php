<?php


namespace App\Interfaces;


use App\Models\OrderForm;

interface OrderFormRepositoryInterface
{
    public function list(array $queryData);
    public function getAll(array $queryData);
    public function create($orderFormDetails);
    public function show(OrderForm $orderForm);
    public function update(OrderForm $orderForm, $newOrderFormDetails);
    public function delete(OrderForm $orderForm);
    public function getById(int $id);
    public function getByServerId(int $id);
}
