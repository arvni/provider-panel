<?php

return [
    "server_url" => env("SERVER_URL", "http://localhost:8001/"),
    "tests_path" => env("SERVER_URL", "").env("TESTS_PATH", "tests/"),
    "referrers_path" => env("SERVER_URL", "").env("REFERRER_PATH", "referrers/"),
    "orders_path" => env("SERVER_URL", "").env("ORDER_PATH", "orders/"),
    "report_path" => env("SERVER_URL", "").env("REPORT_PATH", "reports/"),
    "login_path" => env("LOGIN_PATH", "login/"),
    "email" => env("API_LOGIN_EMAIL",""),
    "password" => ENV("API_LOGIN_PASSWORD",""),
    "logistic_request" => env("LOGISTIC_REQUEST", "logistic-request/"),
];
