<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** A center action sent to the LIS, kept until the LIS reports it applied or refused. */
class PreOrderAction extends Model
{
    public const PENDING = 'pending';

    public const DONE = 'done';

    public const FAILED = 'failed';

    protected $fillable = ['uuid', 'user_id', 'pre_order_id', 'type', 'payload', 'status', 'error'];

    protected $casts = [
        'payload' => 'array',
    ];

    /**
     * @return BelongsTo<PreOrder, $this>
     */
    public function PreOrder(): BelongsTo
    {
        return $this->belongsTo(PreOrder::class);
    }
}
