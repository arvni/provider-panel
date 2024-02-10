<?php

namespace App\Models;

use App\Traits\Searchable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Test extends Model
{
    use Searchable, SoftDeletes;

    protected $searchable = ["name", "code", "shortName"];
    protected $fillable = [
        "name",
        "code",
        "shortName",
        "description",
        "turnaroundTime",
    ];


    public function Consent()
    {
        return $this->belongsTo(Consent::class);
    }

    public function OrderForm()
    {
        return $this->belongsTo(OrderForm::class);
    }

    public function SampleTypes()
    {
        return $this->hasMany(SampleTypeTest::class)
            ->with(["SampleType"]);
    }

    public function DefaultSampleType()
    {
        return $this->hasManyThrough(SampleType::class, SampleTypeTest::class, "test_id", "id", "id", "sample_type_id")
            ->one()
            ->where("is_default", true)
            ->with(["SampleType"]);
    }


}
