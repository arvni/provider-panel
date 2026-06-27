<?php

namespace App\Http\Controllers;

use App\Enums\OrderStep;
use App\Interfaces\OrderRepositoryInterface;
use App\Models\Material;
use Illuminate\Http\Request;

class AddOrderByBarcodeController extends Controller
{
    protected OrderRepositoryInterface $orderRepository;

    public function __construct(OrderRepositoryInterface $orderRepository)
    {
        $this->orderRepository = $orderRepository;
    }

    /**
     * Handle the incoming request.
     */
    public function __invoke(Request $request)
    {
        $request->validate([
            'barcode' => ['required', function ($attribute, $value, $fail) {
                $query = Material::query()->where('barcode', $value ?? '')->where('user_id', auth()->user()->id);
                if ($query->clone()->count() < 1) {
                    $fail("There isn't any Material With this sample ID");
                }
                $material = $query->whereHas('Sample', function ($q) {
                    $q->whereNot('id', null);
                });
                if ($material->count()) {
                    $fail('this material used before');
                }
            }],
            'test.id' => [
                'required',
                'exists:tests,id',
            ],
        ]
        );
        $order = $this->orderRepository->createOrderByBarcode($request->get('barcode'), [$request->get('test')]);

        return redirect()->route('orders.edit', ['order' => $order, 'step' => OrderStep::PATIENT_DETAILS]);
    }
}
