<?php

namespace App\Exceptions;

use Exception;

/**
 * Custom exception for API service errors
 */
class ApiServiceException extends Exception
{
    public function __construct(string $message = "", int $code = 0, ?Exception $previous = null)
    {
        parent::__construct($message, $code, $previous);
    }
}
