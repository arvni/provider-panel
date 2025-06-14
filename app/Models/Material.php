<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Material extends Model
{
    use HasFactory;

    protected $fillable = [
        "order_material_id",
        "sample_type_id",
        "barcode",
        "expire_date"
    ];

    protected $casts = [
        "expire_date" => "datetime:Y-m-d"
    ];

    public function Sample()
    {
        return $this->hasOne(Sample::class);
    }

    public function SampleType()
    {
        return $this->belongsTo(SampleType::class);
    }

    public function OrderMaterial()
    {
        return $this->belongsTo(OrderMaterial::class);
    }

    public function User()
    {
        return $this->belongsTo(User::class);
    }

    public function scopeUsed($query)
    {
        return $query->whereHas("Sample", function ($q) {
            $q->whereNotNull("samples.id");
        });
    }

}
