<?php

namespace App\Models;

use App\Traits\Searchable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Instruction extends Model
{
    use HasFactory, Searchable;
    protected $searchable = ["name"];

    protected $fillable = [
        "name",
        "file"
    ];

}
