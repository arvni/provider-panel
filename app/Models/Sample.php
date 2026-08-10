<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Sample extends Model
{
    use HasFactory;

    protected $fillable = [
        'sampleId',
        'collectionDate',
        'patient_id',
        'user_id',
        'sample_type_id',
        'material_id',
        'collect_request_id',
        'pooling',
    ];

    protected $casts = [
        'pooling' => 'boolean',
    ];

    // Removed eager loading of OrderItems to prevent circular references
    // Use explicit ->with('OrderItems') when needed
    protected $with = ['SampleType', 'Patient'];

    public function SampleType(): BelongsTo
    {
        return $this->belongsTo(SampleType::class);
    }

    public function Material(): BelongsTo
    {
        return $this->belongsTo(Material::class);
    }

    public function Patient(): BelongsTo
    {
        return $this->belongsTo(Patient::class);
    }

    public function OrderItems(): BelongsToMany
    {
        return $this->belongsToMany(OrderItem::class, 'order_item_sample');
    }

    public function CollectRequest(): BelongsTo
    {
        return $this->belongsTo(CollectRequest::class);
    }
}
