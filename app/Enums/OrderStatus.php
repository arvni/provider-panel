<?php

namespace App\Enums;

enum OrderStatus: string
{
    case PENDING = "pending";
    case REQUESTED = "requested";
    case LOGISTIC_REQUESTED = "logistic requested";
    case SENT = "sent";
    case RECEIVED = "received";
    case PROCESSING = "processing";
    case SEMI_REPORTED = "semi reported";
    case REPORTED = "reported";
    case REPORT_DOWNLOADED = "report downloaded";
}
