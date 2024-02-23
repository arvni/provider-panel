<?php

namespace App\Models;

use App\Traits\Searchable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Test extends Model
{
    use Searchable, SoftDeletes, HasFactory;

    protected $searchable = ["name", "code", "shortName"];
    protected $fillable = [
        "server_id",
        "name",
        "code",
        "shortName",
        "description",
        "turnaroundTime",
        "is_active",
        "multi_add",
        "gender"
    ];

    protected $casts = [
        "multi_add" => "boolean",
        "is_active" => "boolean",
        "gender" => "json"
    ];


    public function Instruction()
    {
        return $this->belongsTo(Instruction::class);
    }

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

    public function ServerSampleTypes()
    {
        return $this->belongsToMany(SampleType::class, "sample_type_test")->withPivot(["is_default", "description", "id"]);
    }

    public function DefaultSampleType()
    {
        return $this->hasManyThrough(SampleType::class, SampleTypeTest::class, "test_id", "id", "id", "sample_type_id")
            ->one()
            ->where("is_default", true)
            ->with(["SampleType"]);
    }

    public function scopeActive($query)
    {
        return $query->where("is_active", true);
    }


}
