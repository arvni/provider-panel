<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\Pivot;

class SampleTypeTest extends Pivot
{
    protected $fillable = [
        "id",
        "description",
        "is_default",
        "sample_type_id"
    ];

    protected $hidden=[
        "test_id",
        "sample_type_id"
    ];

    public $timestamps=false;

    protected $casts = [
        "is_default" => "boolean"
    ];


    public function Test()
    {
        return $this->belongsTo(Test::class);
    }

    public function SampleType()
    {
        return $this->belongsTo(SampleType::class);
    }
}
