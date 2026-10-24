<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * A mirror of a LIS pre-order. Never edited here: every change comes from the LIS as a full
 * snapshot, and center actions go back through the api app.
 */
class PreOrder extends Model
{
    protected $fillable = ['server_id', 'user_id', 'code', 'version', 'stage', 'action_owner', 'snapshot', 'closed_at'];

    protected $casts = [
        'snapshot' => 'array',
        'version' => 'integer',
        'closed_at' => 'datetime',
    ];

    /**
     * @return BelongsTo<User, $this>
     */
    public function User(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * @return HasMany<Order, $this>
     */
    public function Orders(): HasMany
    {
        return $this->hasMany(Order::class);
    }

    /**
     * @return HasMany<PreOrderAction, $this>
     */
    public function Actions(): HasMany
    {
        return $this->hasMany(PreOrderAction::class);
    }
}
