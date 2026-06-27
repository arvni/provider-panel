<?php

namespace App\Enums;

use Kongulov\Traits\InteractWithEnum;

enum Gender: string
{
    use InteractWithEnum;

    case MALE = '1';
    case FEMALE = '0';
    case UNKNOWN = '-1';
}
