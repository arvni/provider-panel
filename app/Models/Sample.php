<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Sample extends Model
{
    use HasFactory;

    protected $fillable = [
        "sampleId",
        "collectionDate",
        "patient_id",
        "order_item_id"
    ];

    protected $with = ["SampleType", "Patient", "OrderItem"];

    public function Order()
    {
        return $this->belongsTo(Order::class);
    }

    public function SampleType()
    {
        return $this->belongsTo(SampleType::class);
    }

    public function Material()
    {
        return $this->belongsTo(Material::class);
    }

    public function Patient()
    {
        return $this->belongsTo(Patient::class);
    }

    public function OrderItem()
    {
        return $this->belongsTo(OrderItem::class);
    }

}
