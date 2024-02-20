<?php

namespace App\Models;

use App\Enums\CollectRequestStatus;
use App\Traits\Searchable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Gate;

class CollectRequest extends Model
{
    use HasFactory, Searchable;

    protected $searchable = [
        "User.name"
    ];

    protected $fillable = [
        "details",
        "status"
    ];

    protected $appends=[
        "deletable"
    ];

    public function getDeletableAttribute()
    {
        return Gate::allows("delete",$this);
    }

    protected $casts = [
        "details" => "json",
        "created_at" => "datetime:Y-m-d H:i",
        "status" => CollectRequestStatus::class
    ];

    public function Orders()
    {
        return $this->hasMany(Order::class);
    }

    public function User()
    {
        return $this->belongsTo(User::class);
    }

}
