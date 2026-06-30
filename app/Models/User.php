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
     * The default role granted to providers synced from the LIS server. It
     * bundles the provider-facing permissions (see PROVIDER_PERMISSIONS) and is
     * seeded by RoleAndPermissionSeeder.
     */
    public const PROVIDER_ROLE = 'provider';

    /**
     * The canonical set of provider-facing permissions that gate the (non-admin)
     * left-menu pages and their actions. Kept as the reference list used to seed
     * the provider role; access is now granted purely by the permissions a user
     * holds (via a role) — a user with no role has no access.
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
     * Whether the user may access a provider-facing feature. Access is granted
     * solely by the permissions the user holds (through an assigned role); a user
     * without a role — and therefore without permissions — has no access.
     */
    public function hasAccess(string $permission): bool
    {
        return $this->can($permission);
    }

    /**
     * The effective permission names used to drive menu/UI visibility on the
     * front-end: the real permissions the user holds via their assigned roles.
     *
     * @return Collection<int, string>
     */
    public function effectivePermissions()
    {
        return $this->getAllPermissions()->pluck('name');
    }
}
