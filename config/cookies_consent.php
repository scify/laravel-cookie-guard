<?php

return [
    /**
     * This prefix will be applied when setting and getting all cookies.
     * If not set, the cookies will not be prefixed.
     * If set, a good strategy is to also add a trailing underscore "_", that will be added between the field value, and each cookie.
     * For example, if `cookie_prefix` is set to `my_app_`, then the consent is stored in a cookie named `my_app_cookies_consent`.
     * Example:
     *
     * {
     *    "my_app_cookies_consent": {
     *       "strictly_necessary": true,
     *      "performance": false,
     *     "targeting": false
     *   }
     * }
     */
    'cookie_prefix' => 'my_app_',
    'display_floating_button' => true, // Set to false to display the footer link instead
    'hide_floating_button_on_mobile' => false, // Set to true to hide the floating button on mobile
    'use_separate_page' => false, // Set to true to use a separate page for cookies explanation
    'categories_collapsed_by_default' => true, // Set to false to initially collapse the optional categories
    'cookie_policy_page_custom_url' => null, // Set the custom page URL if use_separate_page is set to true and you want to use a custom URL or Laravel route
    'use_floating_modal' => false, // Set to true to disable the use of showModal() on the dialog HTML element
    /*
    |--------------------------------------------------------------------------
    | Editor
    |--------------------------------------------------------------------------
    |
    | Choose your preferred cookies to be shown. You can add more cookies as desired.
    |
    | Built-in: "strictly_necessary"
    |
    */
    'cookies' => [
        'strictly_necessary' => [
            [
                // you need to change this in order to reflect the cookie_prefix from above
                'name' => 'my_app_cookies_consent',
                'description' => 'cookies_consent::messages.cookie_cookies_consent_description',
                'duration' => 'cookies_consent::messages.years',
                'duration_count' => 1,
                'policy_external_link' => null,
            ],
            [
                'name' => 'XSRF-TOKEN',
                'description' => 'cookies_consent::messages.cookie_xsrf_token_description',
                'duration' => 'cookies_consent::messages.hours',
                'duration_count' => 2,
                'policy_external_link' => null,
            ],
            [
                'name' => 'laravel_session',
                'description' => 'cookies_consent::messages.cookie_laravel_session_description',
                'duration' => 'cookies_consent::messages.hours',
                'duration_count' => 2,
                'policy_external_link' => null,
            ],
        ],
    ],
    'enabled' => [
        'strictly_necessary',
    ],
    'required' => ['strictly_necessary'],
    /*
     * Lifetime, in days, of the `{cookie_prefix}cookies_consent` cookie that stores the visitor's choices.
     * Default is 365 days. If you change it, also update the `duration` / `duration_count` declared
     * for that cookie under `strictly_necessary` above, so that the banner tells the visitor the truth.
     */
    'cookie_lifetime' => 365,
];
