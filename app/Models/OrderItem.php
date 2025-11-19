<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class OrderItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'order_id',
        'test_id',
        'server_id'
    ];

    /**
     * Get the order this item belongs to
     */
    public function Order()
    {
        return $this->belongsTo(Order::class);
    }

    /**
     * Get the test for this order item
     */
    public function Test()
    {
        return $this->belongsTo(Test::class);
    }

    /**
     * Get all patients associated with this order item
     */
    public function Patients()
    {
        return $this->belongsToMany(Patient::class, 'order_item_patient')
            ->withPivot('is_main')
            ->withTimestamps();
    }

    /**
     * Get the main patient for this order item
     */
    public function MainPatient()
    {
        return $this->belongsToMany(Patient::class, 'order_item_patient')
            ->wherePivot('is_main', true)
            ->withPivot('is_main')
            ->withTimestamps()
            ->first();
    }

    /**
     * Get additional patients (not main) for this order item
     */
    public function AdditionalPatients()
    {
        return $this->belongsToMany(Patient::class, 'order_item_patient')
            ->wherePivot('is_main', false)
            ->withPivot('is_main')
            ->withTimestamps();
    }

    public function Samples()
    {
        return $this->belongsToMany(Sample::class, 'order_item_sample');
    }
}
