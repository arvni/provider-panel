<?php

namespace App\Models;

use App\Enums\OrderStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * One recorded step in an order's lifecycle.
 *
 * Rows flagged `backfilled` were reconstructed from the sent_at/received_at/
 * reported_at columns when the table was introduced, not observed as they
 * happened, so they are necessarily incomplete for older orders.
 */
class OrderStatusHistory extends Model
{
    use HasFactory;

    protected $fillable = [
        'order_id',
        'from_status',
        'to_status',
        'changed_at',
        'user_id',
        'backfilled',
    ];

    protected $casts = [
        'from_status' => OrderStatus::class,
        'to_status' => OrderStatus::class,
        'changed_at' => 'datetime',
        'backfilled' => 'boolean',
    ];

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
