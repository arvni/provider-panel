<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Email Two-Factor Authentication
    |--------------------------------------------------------------------------
    |
    | Controls the email one-time-code challenge that runs after a user's
    | password has been verified. Disable it only in local/testing setups.
    |
    */

    // Master switch. When false, login completes right after the password check.
    'enabled' => env('TWO_FACTOR_ENABLED', true),

    // How long a generated code stays valid, in minutes.
    'expiry' => (int) env('TWO_FACTOR_EXPIRY', 10),

    // Maximum number of wrong guesses allowed against a single code before it
    // is invalidated and the user is sent back to the login screen.
    'max_attempts' => (int) env('TWO_FACTOR_MAX_ATTEMPTS', 5),

    // Minimum seconds a user must wait between "resend code" requests.
    'resend_throttle' => (int) env('TWO_FACTOR_RESEND_THROTTLE', 60),

];
