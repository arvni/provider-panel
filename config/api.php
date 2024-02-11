<?php

return [
    "server_url" => env("SERVER_URL", ""),
    "tests_path" => env("SERVER_URL", "").env("TESTS_PATH", "tests/"),
    "login_path" => env("LOGIN_PATH", "login/"),
    "email" => env("API_LOGIN_EMAIL",""),
    "password" => ENV("API_LOGIN_PASSWORD",""),
    "logistic_request" => env("LOGISTIC_REQUEST", ""),
];
