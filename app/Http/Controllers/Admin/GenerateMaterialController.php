<?php

namespace App\Http\Controllers\Admin;

use App\Enums\OrderMaterialStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\GenerateMaterialRequest;
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
    public function __invoke(OrderMaterial $orderMaterial, GenerateMaterialRequest $request)
    {

        if ($orderMaterial->Materials()->count())
            return back()->withErrors("This Order Previously Generated");
        $this->generateMaterials($orderMaterial, $request->get("expireDate"));
        $orderMaterial->update(["status"=>OrderMaterialStatus::GENERATED]);
        return back()->with(["success"=>true, "status"=>"Successfully Generated"]);
    }

    public function generateMaterials(OrderMaterial $orderMaterial, $expireDate)
    {
        $materials = [];
        for ($i =0; $i < $orderMaterial->amount; $i++) {
            $tmp = new Material([
                "barcode"=>$this->generateBarcode($expireDate,$orderMaterial->SampleType->name,$i),
                "expire_date"=>Carbon::parse($expireDate)
            ]);
            $tmp->SampleType()->associate($orderMaterial->SampleType->id);
            $tmp->User()->associate($orderMaterial->User->id);
            $materials[]=$tmp;
        }
        $orderMaterial->Materials()->saveMany($materials);
    }

    public function generateBarcode($expireDate, $sampleType, $i)
    {
        return Carbon::parse($expireDate)->format("y") . ucfirst(substr($sampleType, 0, 1)).(Carbon::now()->getTimestamp()+$i);
    }

}
