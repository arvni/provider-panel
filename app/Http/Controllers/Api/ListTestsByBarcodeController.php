<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Interfaces\TestRepositoryInterface;
use App\Models\Material;
use Illuminate\Http\Request;

class ListTestsByBarcodeController extends Controller
{
    protected TestRepositoryInterface $testRepository;

    public function __construct(TestRepositoryInterface $testRepository)
    {
        $this->testRepository = $testRepository;
    }

    /**
     * Handle the incoming request.
     */
    public function __invoke(Request $request)
    {
        $request->validate([
                "barcode" => ["required", function ($attribute, $value, $fail) {
                    $query = Material::query()->where("barcode", $value ?? "")->where("user_id", auth()->user()->id);
                    if ($query->clone()->count() < 1)
                        $fail("There isn't any Material With this sample ID");
                    $material = $query->whereHas("Sample", function ($q) use ($value) {
                        $q->whereNot("id", null);
                    });
                    if ($material->count())
                        $fail("this material used before");
                }]
            ]
        );
        $tests = $this->testRepository->getAll(["filters"=>["barcode" => $request->get("barcode")]]);
        return response()->json(["tests" => $tests]);

    }
}
