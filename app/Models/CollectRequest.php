<?php

namespace App\Models;

use App\Enums\CollectRequestStatus;
use App\Traits\Searchable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Gate;

class CollectRequest extends Model
{
    use HasFactory, Searchable;

    protected $searchable = [
        'user.name',
        'details',
        'status'
    ];

    protected $fillable = [
        'user_id',
        'details',
        'status',
        'preferred_date',
        'notes'
    ];

    protected $appends = [
        'deletable',
        'status_label'
    ];

    protected $casts = [
        'details' => 'json',
        'created_at' => 'datetime:Y-m-d H:i',
        'updated_at' => 'datetime:Y-m-d H:i',
        'preferred_date' => 'date:Y-m-d',
        'status' => CollectRequestStatus::class
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
            CollectRequestStatus::SCHEDULED
        ]);
    }

    public function scopeCompleted($query)
    {
        return $query->whereIn('status', [
            CollectRequestStatus::PICKED_UP,
            CollectRequestStatus::RECEIVED
        ]);
    }

    // Helper methods
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
