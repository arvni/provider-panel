<?php

namespace App\Exports;

use App\Models\Material;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\FromCollection;

class MaterialExport implements FromCollection
{
    /**
     * @return Collection
     */
    public function collection()
    {
        $materials = Material::with(["SampleType","Sample.Order.CollectRequest", "Sample.Order.Patient"])->withAggregate("User", "name")->get();
        $keys = [
            "barcode" => "Barcode",
            "sampleType" => "sample Type",
            "created_at" => "created At",
            "expired_at" => "expired At",
            "clientName" => "Client Name",
            "collectionDate" => "collection Date",
            "patientName" => "PatientName",
            "status" => "Order Status",
            "received_at" => "received At",
            "reported_at" => "reported At",
            "sent_at" => "sent At"
        ];
        $output = [$keys];
        foreach ($materials as $material) {
            $output[] = [
                "barcode" => $material->barcode,
                "sampleType" => $material?->SampleType?->name,
                "created_at" => $material->created_at ? Carbon::parse($material->created_at)->format("Y-m-d H:i") : null,
                "expired_at" => $material->expired_at ? Carbon::parse($material->expired_at)->format("Y-m-d H:i") : null,
                "clientName" => $material->user_name,
                "collectionDate" => $material->Sample?->collectionDate,
                "patientName" => $material->Sample?->Order?->Patient?->fullName,
                "status" => $material->Sample?->Order?->status?->value,
                "received_at" => $material->Sample?->Order?->received_at,
                "reported_at" => $material->Sample?->Order?->reported_at,
                "sent_at" => $material->Sample?->Order?->sent_at,
            ];
        }
        return collect($output);
    }
}
