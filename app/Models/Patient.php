<?php

namespace App\Models;

use App\Enums\ConsanguineousParents;
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
        "reference_id",
        "id_no",
        "user_id"
    ];
    protected $casts = [
        "gender" => Gender::class,
        "contact" => "json",
        "isFetus" => "boolean",
        "consanguineousParents" => ConsanguineousParents::class
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
        return $this->hasMany(Order::class, 'main_patient_id');
    }

    /**
     * All orders where this patient is involved (main or additional)
     */
    public function AllOrders()
    {
        return $this->belongsToMany(Order::class, 'order_item_patient')
            ->withTimestamps();
    }

    /**
     * Order items (tests) this patient is associated with
     */
    public function OrderItems()
    {
        return $this->belongsToMany(OrderItem::class, 'order_item_patient')
            ->withPivot('is_main')
            ->withTimestamps();
    }

    /**
     * Patients related to this patient
     */
    public function RelatedPatients()
    {
        return $this->belongsToMany(Patient::class, 'patient_relations', 'patient_id', 'related_patient_id')
            ->withPivot('relation_type', 'notes')
            ->withTimestamps();
    }

    /**
     * Patients who have this patient as a relation (inverse)
     */
    public function RelatedByPatients()
    {
        return $this->belongsToMany(Patient::class, 'patient_relations', 'related_patient_id', 'patient_id')
            ->withPivot('relation_type', 'notes')
            ->withTimestamps();
    }

    /**
     * Get all relations (both directions)
     */
    public function AllRelations()
    {
        return $this->RelatedPatients->merge($this->RelatedByPatients)->unique('id');
    }
}
