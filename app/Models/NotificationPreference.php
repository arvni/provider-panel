<?php

namespace App\Models;

use App\Enums\NotificationType;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * One user's explicit answer for one switch: a notification type, which flavour
 * of it (empty for types that are simply on or off), and a channel.
 *
 * @property int $user_id
 * @property NotificationType $type
 * @property string $variant
 * @property string $channel
 * @property bool $enabled
 */
class NotificationPreference extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'type',
        'variant',
        'channel',
        'enabled',
    ];

    protected $casts = [
        'type' => NotificationType::class,
        'enabled' => 'boolean',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
