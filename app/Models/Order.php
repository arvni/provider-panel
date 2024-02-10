<?php

namespace App\Models;

use App\Enums\OrderStatus;
use App\Enums\OrderStep;
use App\Traits\Searchable;
use App\Traits\Statusable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class Order extends Model
{
    use HasFactory, Statusable, Searchable;

    protected $searchable = [
        "id",
        "Patient.fullName",
        "Patient.reference_id",
        "Samples.sampleId"
    ];

    protected $fillable = [
        "status",
        "step",
        "orderForms",
        "consents",
        "files",
        "sent_at",
        "received_at",
        "reported_at",
    ];
    protected $casts = [
        "status" => OrderStatus::class,
        "step" => OrderStep::class,
        "orderForms" => "json",
        "files" => "json",
        "consents"=>"json"
    ];

    public function Patient()
    {
        return $this->belongsTo(Patient::class);
    }

    public function User()
    {
        return $this->belongsTo(User::class);
    }

    public function Samples()
    {
        return $this->hasMany(Sample::class);
    }

    public function OrderItems()
    {
        return $this->hasMany(OrderItem::class);
    }

    public function Tests()
    {
        return $this->belongsToMany(Test::class,"order_items");
    }

}
