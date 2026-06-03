<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Hash;

class TwoFactorCode extends Model
{
    protected $fillable = [
        'user_id',
        'code_hash',
        'attempts',
        'expires_at',
    ];

    protected $casts = [
        'expires_at' => 'datetime',
        'attempts' => 'integer',
    ];

    /**
     * Issue a fresh code for the given user and return the plaintext value.
     *
     * Only the hash is persisted; the plaintext is returned once so it can be
     * emailed and then discarded. Any previous code for the user is replaced.
     */
    public static function generateFor(User $user): string
    {
        // Cryptographically secure 6-digit code (leading zeros preserved).
        $code = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);

        static::updateOrCreate(
            ['user_id' => $user->id],
            [
                'code_hash' => Hash::make($code),
                'attempts' => 0,
                'expires_at' => now()->addMinutes(config('two_factor.expiry', 10)),
            ]
        );

        return $code;
    }

    /**
     * Timing-safe verification of a candidate code.
     */
    public function matches(string $code): bool
    {
        return Hash::check($code, $this->code_hash);
    }

    public function isExpired(): bool
    {
        return $this->expires_at->isPast();
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
