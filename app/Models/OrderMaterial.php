<?php

namespace App\Models;

use App\Enums\OrderMaterialStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class OrderMaterial extends Model
{
    use HasFactory;

    protected $fillable = [
        "amount",
        "server_id"
    ];

    protected $casts = [
        "created_at" => "datetime:Y/m/d H:i",
        "status" => OrderMaterialStatus::class
    ];

    public function User()
    {
        return $this->belongsTo(User::class);
    }

    public function SampleType()
    {
        return $this->belongsTo(SampleType::class);
    }

    public function Materials()
    {
        return $this->hasMany(Material::class);
    }

}
