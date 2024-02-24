<?php

namespace App\Models;

use App\Enums\OrderStatus;
use App\Enums\OrderStep;
use App\Traits\Searchable;
use App\Traits\Statusable;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Support\Facades\Gate;

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
        "consents" => "json"
    ];

    protected $appends = [
        "editable",
        "deletable",
        "orderId"
    ];

    public function getOrderIdAttribute()
    {
        return "OR" . Carbon::parse($this->created_at)->format(".Ymd.") . $this->id;
    }

    public function getEditableAttribute(): bool
    {
        return Gate::allows("update", $this);
    }

    public function getDeletableAttribute(): bool
    {
        return Gate::allows("delete",$this);
    }

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
        return $this->belongsToMany(Test::class, "order_items");
    }

}
