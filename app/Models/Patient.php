<?php

namespace App\Models;

use App\Enums\Gender;
use App\Enums\Nationality;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Patient extends Model
{
    use HasFactory;

    protected $fillable = [
        "fullName",
        "nationality",
        "dateOfBirth",
        "gender",
        "consanguineousParents",
        "contact",
        "extra",
        "isFetus",
        "reference_id"
    ];
    protected $casts = [
        "gender" => Gender::class,
        "contact" => "json",
        "isFetus" => "boolean"
    ];

    public function getNationalityAttribute()
    {
        return (new Nationality)($this->attributes["nationality"]);
    }

    public function User()
    {
        return $this->belongsTo(User::class);
    }

    public function Orders()
    {
        return $this->hasMany(Order::class);
    }
}
