<?php
/*
 * Secret key and Site key get on https://www.google.com/recaptcha
 * */
return [
    'secret' => env('GOOGLE_CAPTCHA_SECRET_KEY', 'default_secret'),
    'sitekey' => env('GOOGLE_CAPTCHA_SITE_KEY', 'default_sitekey'),
    /**
     * @var string|null Default ``null``.
     * Custom with function name (example customRequestCaptcha) or class@method (example \App\CustomRequestCaptcha@custom).
     * Function must be return instance, read more in repo ``https://github.com/thinhbuzz/laravel-google-captcha-examples``
     */
    'request_method' => null,
    'options' => [
        'multiple' => false,
        'lang' => app()->getLocale(),
    ],
    'attributes' => [
        'theme' => 'light'
    ],
];
