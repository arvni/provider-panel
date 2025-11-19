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
        "Patient.reference_id"
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
        "server_id",
        "main_patient_id",
        "patient_ids",
        'user_id',
        'created_at',
        'updated_at'
    ];
    protected $casts = [
        "status" => OrderStatus::class,
        "step" => OrderStep::class,
        "orderForms" => "json",
        "files" => "json",
        "consents" => "json",
        "patient_ids" => "json"
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
        return $this->belongsTo(Patient::class, 'main_patient_id');
    }

    /**
     * Get the main patient (alias for Patient relationship)
     */
    public function MainPatient()
    {
        return $this->belongsTo(Patient::class, 'main_patient_id');
    }

    /**
     * Get all patients in this order
     */
    public function Patients()
    {
        // Get unique patients from all order items
        return Patient::whereIn('id', $this->patient_ids ?? [])->get();
    }

    public function User()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get all samples for this order through its order items
     * Note: This returns a collection, not a relationship.
     * Use OrderItems()->with('Samples') for eager loading in queries.
     */
    public function getSamplesAttribute()
    {
        if (!$this->relationLoaded('OrderItems')) {
            $this->load('OrderItems.Samples');
        }

        return $this->OrderItems->pluck('Samples')->flatten();
    }

    public function OrderItems()
    {
        return $this->hasMany(OrderItem::class);
    }

    public function Tests()
    {
        return $this->belongsToMany(Test::class, "order_items");
    }

    public function CollectRequest()
    {
        return $this->belongsTo(CollectRequest::class);
    }

}
