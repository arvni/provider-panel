<?php

namespace App\Enums;
enum OrderMaterialStatus: string
{
    case ORDERED = "ORDERED";
    case GENERATED = "PROCESSED";
}
