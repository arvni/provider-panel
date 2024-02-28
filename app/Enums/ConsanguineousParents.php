<?php

namespace App\Enums;
use Kongulov\Traits\InteractWithEnum;

enum ConsanguineousParents: string
{
    use InteractWithEnum;
    case YES ="1";
    case NO = "0";
    case UNKNOWN = "-1";
}
