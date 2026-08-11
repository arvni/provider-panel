<?php

namespace App\Models;

use App\Enums\CollectRequestStatus;
use App\Traits\Searchable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Support\Facades\Gate;

class CollectRequest extends Model
{
    use HasFactory, Searchable;

    protected $searchable = [
        'user.name',
        'details',
        'status',
        'server_id',
    ];

    protected $fillable = [
        'user_id',
        'details',
        'status',
        'preferred_date',
        'notes',
        'server_id',
        'received_at',
    ];

    protected $appends = [
        'deletable',
        'status_label',
    ];

    protected $casts = [
        'details' => 'json',
        'status' => CollectRequestStatus::class,
        'received_at' => 'datetime',
    ];

    // Accessors
    public function getDeletableAttribute(): bool
    {
        return Gate::allows('delete', $this);
    }

    public function getStatusLabelAttribute(): string
    {
        return $this->status->getLabel();
    }

    // Relationships
    public function orders(): HasMany
    {
        return $this->hasMany(Order::class);
    }

    public function samples(): HasMany
    {
        return $this->hasMany(Sample::class);
    }

    /**
     * The kit asked for while raising this request, if any. Only one can be
     * chosen on the form, so this reads as a single material.
     */
    public function orderMaterial(): HasOne
    {
        return $this->hasOne(OrderMaterial::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    // Scopes
    public function scopeByStatus($query, CollectRequestStatus $status)
    {
        return $query->where('status', $status);
    }

    public function scopePending($query)
    {
        return $query->whereIn('status', [
            CollectRequestStatus::REQUESTED,
            CollectRequestStatus::SCHEDULED,
        ]);
    }

    public function scopeCompleted($query)
    {
        return $query->whereIn('status', [
            CollectRequestStatus::PICKED_UP,
            CollectRequestStatus::RECEIVED,
        ]);
    }

    // Helper methods

    /**
     * A request raised without an order, where the provider asked for kits to be
     * sent out rather than for samples to be picked up.
     *
     * Nothing about it belongs on the logistics endpoint: what the lab has to
     * act on is the OrderMaterial, which syncs on its own. Never send one of
     * these as a collect request.
     */
    public function isKitOrder(): bool
    {
        return ($this->details['mode'] ?? null) === 'order';
    }

    public function canBeDeleted(): bool
    {
        return $this->status === CollectRequestStatus::REQUESTED;
    }

    public function markAsScheduled(): void
    {
        $this->update(['status' => CollectRequestStatus::SCHEDULED]);
    }

    public function markAsPickedUp(): void
    {
        $this->update(['status' => CollectRequestStatus::PICKED_UP]);
    }

    public function markAsReceived(): void
    {
        $this->update(['status' => CollectRequestStatus::RECEIVED]);
    }
}
