<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Material;
use App\Models\SampleType;
use Illuminate\Http\Request;

class CheckMaterialController extends Controller
{
    /**
     * Handle the incoming request.
     */
    public function __invoke(Request $request)
    {
        $id = $request->get("id");
        $barcode = $request->get("sampleId");
        $user=$request->get("user");
        $material = Material::query()->where("barcode", $barcode)->where("user_id",$user);
        if ($material->clone()->count() < 1)
            return response()->json(["message" => "There isn't any Material With this sample ID", "success" => false], 403);
        $material->whereHas("Sample", function ($q) use ($id) {
            $q->whereNot("samples.id", $id);
        });
        if ($material->count())
            return response()->json(["message" => "This Material Used Before", "success" => false], 403);

        return response()->json(["success" => true],);

    }
}
