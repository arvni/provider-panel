<?php

return [
    /*
    |--------------------------------------------------------------------------
    | API Server Configuration
    |--------------------------------------------------------------------------
    |
    | Configuration for the external API server including base URL and
    | authentication credentials.
    |
    */

    'server_url' => env('SERVER_URL', 'http://localhost:8002/api/'),

    /*
    |--------------------------------------------------------------------------
    | API Endpoints
    |--------------------------------------------------------------------------
    |
    | Define the various API endpoint paths. These will be appended to the
    | server_url to form complete URLs.
    |
    */

    'tests_path' => env('TESTS_PATH', 'tests'),
    'referrers_path' => env('REFERRER_PATH', 'referrers'),
    'orders_path' => env('ORDER_PATH', 'orders'),
    'order_materials_path' => env('ORDER_MATERIAL_PATH', 'order-materials'),
    'report_path' => env('REPORT_PATH', 'orders'),
    'sample_types_path' => env('SAMPLE_TYPES_PATH', 'sample-types'),
    'login_path' => env('LOGIN_PATH', 'login'),
    'logistic_request' => env('LOGISTIC_REQUEST', 'logistic-request'),

    /*
    |--------------------------------------------------------------------------
    | Authentication
    |--------------------------------------------------------------------------
    |
    | API authentication credentials. These should be set in your .env file
    | and never committed to version control.
    |
    */

    'email' => env('API_LOGIN_EMAIL'),
    'password' => env('API_LOGIN_PASSWORD'),
];
