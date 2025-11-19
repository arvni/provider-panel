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
        'user_id',
        'sample_type_id',
        'material_id'
    ];

    // Removed eager loading of OrderItems to prevent circular references
    // Use explicit ->with('OrderItems') when needed
    protected $with = ["SampleType", "Patient"];

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

    public function OrderItems()
    {
        return $this->belongsToMany(OrderItem::class, 'order_item_sample');
    }

}
