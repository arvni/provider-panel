<?php

namespace App\Models;

use App\Enums\OrderMaterialStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Gate;

class OrderMaterial extends Model
{
    use HasFactory;

    protected $fillable = [
        'amount',
        'server_id',
        'status',
        'collect_request_id',
    ];

    protected $casts = [
        'status' => OrderMaterialStatus::class,
    ];

    protected $appends = [
        'deletable',
    ];

    public function getDeletableAttribute(): bool
    {
        return Gate::allows('delete', $this);
    }

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

    /**
     * The logistic request this kit was asked for on, when it came from that
     * form rather than from the Order Materials page.
     */
    /**
     * @return BelongsTo<CollectRequest, $this>
     */
    public function CollectRequest(): BelongsTo
    {
        return $this->belongsTo(CollectRequest::class);
    }
}
