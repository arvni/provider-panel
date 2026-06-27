<?php

namespace App\Models;

use App\Traits\Searchable;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Collection;
use Laravel\Sanctum\HasApiTokens;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable implements MustVerifyEmail
{
    use HasApiTokens, HasFactory, HasRoles, Notifiable, Searchable;

    /**
     * Permissions granted by default to providers that have not been assigned
     * any role. These gate the (non-admin) left-menu pages and their actions.
     * Assigning a role to a user switches them to explicit permission checks.
     *
     * @var array<int, string>
     */
    public const PROVIDER_PERMISSIONS = [
        'Order.Index',
        'Order.Create',
        'Patient.Index',
        'Sample.Index',
        'CollectRequest.Index',
        'OrderMaterial.Index',
        'OrderMaterial.Create',
        'Test.Index',
    ];

    /**
     * @var array|string[]
     */
    public array $searchable = ['name', 'userName', 'email', 'mobile'];

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'userName',
        'email',
        'password',
        'meta',
        'mobile',
        'active',
        'referrer_id',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'password',
        'remember_token',
        'active' => 'boolean',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'mobile_verified_at' => 'datetime',
        'meta' => 'json',
    ];

    public function RegisteredPatients()
    {
        return $this->hasMany(Patient::class);
    }

    public function isActive($query)
    {
        return $query->where('active', true);
    }

    public function Patients()
    {
        return $this->hasMany(Patient::class);
    }

    public function Orders()
    {
        return $this->hasMany(Order::class);
    }

    public function OrderMaterials()
    {
        return $this->hasMany(OrderMaterial::class);
    }

    public function Tests()
    {
        return $this->belongsToMany(Test::class);
    }

    /**
     * Whether the user may access a provider-facing feature. Users without a
     * role keep the default self-service access; users with a role must be
     * granted the matching permission explicitly.
     */
    public function hasAccess(string $permission): bool
    {
        if ($this->roles()->count() === 0) {
            return in_array($permission, self::PROVIDER_PERMISSIONS, true);
        }

        return $this->can($permission);
    }

    /**
     * The effective permission names used to drive menu/UI visibility on the
     * front-end: real permissions plus the provider defaults for role-less users.
     *
     * @return Collection<int, string>
     */
    public function effectivePermissions()
    {
        $permissions = $this->getAllPermissions()->pluck('name');

        if ($this->roles()->count() === 0) {
            $permissions = $permissions->merge(self::PROVIDER_PERMISSIONS)->unique()->values();
        }

        return $permissions;
    }
}
