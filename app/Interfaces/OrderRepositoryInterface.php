<?php

namespace App\Interfaces;

use App\Enums\OrderStep;
use App\Models\Order;
use App\Models\User;

interface OrderRepositoryInterface
{
    public function getAll(array $queryData = []);
    public function list(array $queryData = []);
    public function getUserOrders(array $queryData = []);
    public function getById(int $id): ?Order;
    public function getRecentlyOrders();
    public function notDownloadedOrdersReportCount();
    public function delete(Order $order): ?bool;
    public function create(array $orderDetails): Order;
    public function createOrderByBarcode(string $barcode):Order;
    public function update(Order $order, array $newDetails,OrderStep $step);
    public function deleteAllOrderItems(Order $order);
}
