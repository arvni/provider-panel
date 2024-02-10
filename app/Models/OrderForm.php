<?php

namespace App\Models;

use App\Traits\Searchable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class OrderForm extends Model
{
    use HasFactory, Searchable;

    protected $searchable = [
        "name"
    ];

    protected $fillable = [
        "name",
        "file",
        "formData"
    ];

    protected $casts = [
        "formData" => "json"
    ];

    public function Tests()
    {
        return $this->hasMany(Test::class);
    }


}
