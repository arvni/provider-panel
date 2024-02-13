<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Material;
use App\Models\OrderMaterial;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class GenerateMaterialController extends Controller
{
    /**
     * Handle the incoming request.
     */
    public function __invoke(OrderMaterial $orderMaterial, Request $request)
    {
        if ($orderMaterial->Materials()->count())
            return back()->withErrors("This Order Previously Generated");
        $this->generateMaterials($orderMaterial, $request->get("expireDate"));
        return redirect()->route("admin.orderMaterials.show");
    }

    public function generateMaterials(OrderMaterial $orderMaterial, $expireDate)
    {
        $materials = [];
        for ($i = 0; $i < $orderMaterial->amount; $i++) {
            $tmp = new Material([
                "barcode"=>$this->generateBarcode($expireDate,$orderMaterial->SampleType->name,$i),
                "expireDate"=>Carbon::parse($expireDate)
            ]);
            $tmp->SampleType()->associate($orderMaterial->SampleType->id);
            $tmp->User()->associate($orderMaterial->User->id);
            $materials[]=$tmp;
        }
        $orderMaterial->Materials()->saveMany($materials);
    }

    public function generateBarcode($expireDate, $sampleType, $i)
    {
        return ucfirst(substr($sampleType, 0, 1)) . Carbon::parse($expireDate)->format("-Ymd-") . $i;
    }

}
