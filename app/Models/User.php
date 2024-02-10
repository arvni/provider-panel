<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use App\Traits\Searchable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable, HasRoles, Searchable;

    /**
     * @var array|string[]
     */
    public array $searchable = ["name", "userName", "email", "mobile"];

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
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'password',
        'remember_token',
        'active' => "boolean"
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'mobile_verified_at' => 'datetime',
        "meta" => "json"
    ];

    public function RegisteredPatients()
    {
        return $this->hasMany(Patient::class);
    }

    public function isActive($query)
    {
        return $query->where("active", true);
    }

    public function Patients()
    {
        return $this->hasMany(Patient::class);
    }

    public function Orders()
    {
        return $this->hasMany(Order::class);
    }
}
