<?php

namespace App\Models;

use App\Traits\Searchable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SampleType extends Model
{
    use HasFactory, Searchable;

    protected $searchable = ["name"];
    protected $fillable = [
        "name",
        "sample_id_required",
        "orderable",
        "server_id"
    ];
    protected $casts = ["
    sample_id_required" => "boolean",
        "orderable" => "boolean",
    ];

    public function Tests()
    {
        return $this->belongsToMany(Test::class)->withPivot("is_default");
    }

    public function DefaultTest()
    {
        return $this->hasOne(SampleTypeTest::class)
            ->ofMany("is_default")
            ->with("Test");
    }
}
