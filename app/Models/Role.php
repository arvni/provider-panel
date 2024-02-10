<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use \Spatie\Permission\Models\Role as BaseRoleModel;

class Role extends BaseRoleModel
{
    use HasFactory;
}
