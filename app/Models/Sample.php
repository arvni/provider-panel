<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Sample extends Model
{
    use HasFactory;

    protected $fillable = [
        "sampleId",
        "collectionDate"
    ];

    protected $with=["SampleType"];

    public function Order()
    {
        return $this->belongsTo(Order::class);
    }

    public function SampleType()
    {
        return $this->belongsTo(SampleType::class);
    }
}
