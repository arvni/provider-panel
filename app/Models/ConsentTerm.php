<?php

namespace App\Models;

use App\Traits\Searchable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ConsentTerm extends Model
{
    use HasFactory, Searchable;

    protected $searchable=["name"];

    protected $fillable=[
        "name",
        "is_active"
    ];

    protected $casts=[
        "is_active"=>"boolean"
    ];

    public function scopeActive($query)
    {
        return $query->where("is_active",true);
    }

}
