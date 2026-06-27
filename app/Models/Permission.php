<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Spatie\Permission\Models\Permission as BasePermissionModel;

class Permission extends BasePermissionModel
{
    use HasFactory;
}
