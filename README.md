# Laravel Cookies Consent Plugin - Make your Laravel app compliant with the EU GDPR cookie law

<p align="center">
<img src="logo.jpg" alt="logo" width="400">
</p>


<hr>

[![Latest Version on Packagist](https://img.shields.io/packagist/v/scify/laravel-cookies-consent.svg?style=flat-square)](https://packagist.org/packages/scify/laravel-cookies-consent)
[![GitHub Tests Action Status](https://img.shields.io/github/actions/workflow/status/scify/laravel-cookies-consent/run-tests.yml?branch=main)](https://github.com/scify/laravel-cookies-consent/actions?query=workflow%3Arun-tests+branch%3Amain)
[![Total Downloads](https://img.shields.io/packagist/dt/scify/laravel-cookies-consent.svg?style=flat-square)](https://packagist.org/packages/scify/laravel-cookies-consent)
[![GitHub Issues](https://img.shields.io/github/issues/scify/laravel-cookies-consent)](https://img.shields.io/github/issues/scify/laravel-cookies-consent)
[![GitHub Stars](https://img.shields.io/github/stars/scify/laravel-cookies-consent)](https://img.shields.io/github/stars/scify/laravel-cookies-consent)
[![GitHub forks](https://img.shields.io/github/forks/scify/laravel-cookies-consent)](https://img.shields.io/github/forks/scify/laravel-cookies-consent)
[![contributions welcome](https://img.shields.io/badge/contributions-welcome-brightgreen.svg?style=flat)](https://github.com/dwyl/esta/issues)
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![Maintenance](https://img.shields.io/badge/Maintained%3F-yes-green.svg)](https://GitHub.com/Naereen/StrapDown.js/graphs/commit-activity)
[![Ask Me Anything !](https://img.shields.io/badge/Ask%20me-anything-1abc9c.svg)](https://GitHub.com/scify)
[![GitHub contributors](https://img.shields.io/github/contributors/scify/laravel-cookies-consent)](https://github.com/scify/laravel-cookies-consent/graphs/contributors)
[![GitHub pull-requests](https://img.shields.io/github/issues-pr/scify/laravel-cookies-consent)](https://github.com/scify/laravel-cookies-consent/pulls)
[![GitHub closed pull-requests](https://img.shields.io/github/issues-pr-closed/scify/laravel-cookies-consent)](https://github.com/scify/laravel-cookies-consent/pulls?q=is%3Apr+is%3Aclosed)

## Upgrading to v4

As of **February 2025**, The `v4` of the Laravel Cookies Consent plugin has been released! 🎉🥳😍

In order to upgrade to `v4`, please follow the instructions in the [CHANGELOG](CHANGELOG.md) file, and consult also
the [How To Upgrade to a New Major Version](UPGRADING.md) file.

## About the plugin

According to the [GDPR law](https://gdpr-info.eu/), every platform is required to allow the users to decide which cookie
categories they will allow,
and, if a cookie category is not allowed, the application should not use the functionality tied to that cookie.

This plugin provides a simple cookie consent window through which the user can specify the cookies they would like to
allow.

After the user submission, the page reloads and the relevant cookies are set on the browser, and can then be used in the
front-end.

# Screenshots

![img.png](readme-images/img.png)

## Features

- Customizable cookie categories
- A new configuration file format. Now you can declare the cookies each cookie category uses in a
  more structured way.
- A new, clean, and intuitive UI for the cookies consent modal.
- An option to present the cookies consent dialog in a separate page instead of a modal.
- A sticky cookies button that allows users to change their cookies preferences at any time. This button is optional and
  it's existence can be tweaked in the configuration file.
- A separate page for the cookies preferences, where users can read more about each cookie category and change their
  preferences.
- Multi-lingual support. The plugin comes with 6 built-in languages: English, Greek, Spanish, German, Italian, and
  Swedish. You can add your own language by publishing the translations and editing/adding your own translations.

## Installation

You can install the package via composer:

```bash
composer require scify/laravel-cookies-consent
```

**Make sure to manually publish** the cookie image file, by running:

```bash
php artisan vendor:publish \
--provider="SciFY\LaravelCookiesConsent\LaravelCookiesConsentServiceProvider" \
--tag="cookies-consent-assets"
```

**Notice:** if a new version of the plugin has been released and you want to update the front-end files, please make
sure to
use `--force` option, to overwrite the file.

By doing so, the image file will be copied to `public/vendor/scify/laravel-cookies-consent`.

**IMPORTANT:**

You can then either decide to include the `public/vendor/scify/laravel-cookies-consent/*` files to git (especially if
you
want
to edit it first), or add it to `.gitignore`, and make sure to also run this command on the staging/production server.

Next, you need to publish the config file:

```bash
php artisan vendor:publish \
--provider="SciFY\LaravelCookiesConsent\LaravelCookiesConsentServiceProvider" \
--tag="cookies-consent-config"
```

The configuration file will be published to `config/cookies_consent.php`.

### Explanation of the configuration file

In the config file, you can change the cookie categories of your application, set the required and pre-selected
categories, as well as add new categories.

This is the contents of the published config file:

```bash
return [
    /**
     * This prefix will be applied when setting and getting all cookies.
     * If not set, the cookies will not be prefixed.
     * If set, a good strategy is to also add a trailing underscore "_", that will be added between the field value, and each cookie.
     * For example, if `cookie_prefix` is set to `my_app_`, then the targeting cookie will have a value of `my_app_cookies_consent_targeting`.
     * When using this plugin for multiple apps, it is a good strategy to set a prefix that is relevant to the app
     * (for example "my_app_", in order for the cookies not to be mingled when running locally.
     */
    'cookie_prefix' => '',
    'display_floating_button' => true, // Set to false to display the footer link instead
    'hide_floating_button_on_mobile' => false, // Set to true to hide the floating button on mobile
    'use_separate_page' => false, // Set to true to use a separate page for cookies explanation
    /*
    |--------------------------------------------------------------------------
    | Editor
    |--------------------------------------------------------------------------
    |
    | Choose your preferred cookies to be shown. You can add more cookies as desired.
    | If, for example you add another cookie with the name "marketing", then you should also
    | publish the translation files and add a "cookie_marketing" key in the translation file,
    | since the plugin will try to display the cookie name by this convention.
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
                'duration_count' => 2,
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
     * Set the cookie duration in days.  Default is 365 days.
     */
    'cookie_lifetime' => 365,
];
```

The `cookie_prefix` is optional and, if set, will be applied to every cookie.

If set, a good strategy is to also add a trailing underscore "_", that will be added between the field value, and each
cookie.

For example, if `cookie_prefix` is set to `my_app_`, then the targeting cookie will have a value
of `my_app_cookies_consent_targeting`.

The `display_floating_button` field is optional and, if set to `true`, will display a floating button on the bottom
right corner of the page.
If set to `false`, then you will need to add a relevant link in your footer, in order to show the cookies preferences
page:

```html
<a href="javascript:void(0);" onclick="toggleCookieBanner()" onkeyup="if (event.key === 'Enter') toggleCookieBanner()"
   role="button" aria-label="{{ __('cookies_consent::messages.cookies_settings') }}">
    {{ __('cookies_consent::messages.cookies_settings') }}
</a>
```

The `hide_floating_button_on_mobile` field is optional and, if set to `true`, will hide the floating button on mobile

The `use_separate_page` field is optional and, if set to `true`, will display the cookies preferences in a separate
page.

You can add as many cookie categories as you like, simply by adding values to the `cookies` array.

If you want to remove a cookie category, simply remove it from the array.

You can use the `enabled` array to set the cookie categories that will be pre-selected,
and the `required` array to set the cookies that the user won't be able to deselect.

If you want to change how long the cookies will be stored, edit the `cookie_lifetime` variable.

## Usage

When the plugin is installed, a `laravel-cookies-consent`
custom [Laravel View Component](https://laravel.com/docs/9.x/blade#components) is automatically registered.

This will render the following cookies consent that, will look very much like this one.

![dialog](readme-images/img2.png)

You can then use this component in order to display the cookies consent window, wherever you'd like.

Typically, a good strategy is to put the component just before the closing `<body>` tag:

```html
<body>
    ...
    ...
    ...
    <x-laravel-cookies-consent></x-laravel-cookies-consent>
</body>
```

## How to add a new cookie category

In order to add a new cookie category, you need to add a new entry in the `cookies` array in the configuration file:

```php
        'strictly_necessary' => [
            ...
            ...
        ],
        'targeting' => [
            [
                'name' => '_ga',
                'description' => 'This cookie is installed by Google Analytics. The cookie is used to calculate visitor, session, campaign data and keep track of site usage for the site\'s analytics report. The cookies store information anonymously and assign a randomly generated number to identify unique visitors.',
                'duration' => 'cookies_consent::messages.years',
                'duration_count' => 2,
                'policy_external_link' => 'https://policies.google.com/privacy?hl=en-US',
            ],
            [
                'name' => '_gid',
                'description' => 'This cookie is installed by Google Analytics. The cookie is used to store information of how visitors use a website and helps in creating an analytics report of how the website is doing. The data collected including the number visitors, the source where they have come from, and the pages visited in an anonymous form.',
                'duration' => 'cookies_consent::messages.days',
                'duration_count' => 1,
                'policy_external_link' => 'https://policies.google.com/privacy?hl=en-US',
            ],
            [
                'name' => '_gat',
                'description' => 'This cookies is installed by Google Universal Analytics to throttle the request rate to limit the colllection of data on high traffic sites.',
                'duration' => 'cookies_consent::messages.minutes',
                'duration_count' => 1,
                'policy_external_link' => 'https://policies.google.com/privacy?hl=en-US',
            ],
        ],
```

Or, you can set the `description` to be null (or an empty string), or set a translation key directly, like so:

1. Create a cookies-specific translation file:

```bash
 touch lang/en/cookies.php
```

Contents:

```php
<?php

return [
    'google_analytics' => [
        '_ga_description' => 'This cookie is installed by Google Analytics. The cookie is used to calculate visitor, session, campaign data and keep track of site usage for the site\'s analytics report. The cookies store information anonymously and assign a randomly generated number to identify unique visitors.',
        '_gid_description' => 'This cookie is installed by Google Analytics. The cookie is used to store information of how visitors use a website and helps in creating an analytics report of how the website is doing. The data collected including the number visitors, the source where they have come from, and the pages visited in an anonymous form.',
        '_gat_description' => 'This cookies is installed by Google Universal Analytics to throttle the request rate to limit the colllection of data on high traffic sites.',
    ]
];
```

Then, in your `config/cookies_consent.php` file, you can set the `description` fields to be the translation keys.
Notice that the `description` fields have `cookies.google_analytics.*` values: (from the `cookies.php` file we just
created).

```php
        'strictly_necessary' => [
            ...
            ...
        ],
        'targeting' => [
            [
                'name' => '_ga',
                'description' => 'cookies.google_analytics._ga_description',
                'duration' => 'cookies_consent::messages.years',
                'duration_count' => 2,
                'policy_external_link' => 'https://policies.google.com/privacy?hl=en-US',
            ],
            [
                'name' => '_gid',
                'description' => 'cookies.google_analytics._gid_description',
                'duration' => 'cookies_consent::messages.days',
                'duration_count' => 1,
                'policy_external_link' => 'https://policies.google.com/privacy?hl=en-US',
            ],
            [
                'name' => '_gat',
                'description' => 'cookies.google_analytics._gat_description',
                'duration' => 'cookies_consent::messages.minutes',
                'duration_count' => 1,
                'policy_external_link' => 'https://policies.google.com/privacy?hl=en-US',
            ],
        ],

```

After that, you can use the `$_COOKIE` global object, in order to check for the appropriate cookie.

Now you can use this object in your Blade files like this:

```bash
$_COOKIE[config('cookies_consent.cookie_prefix') . {{ COOKIE_NAME }}]
```

For example, An application that wants to load the Google Analytics script only if the user has given their consent to
the `targeting` cookie category,
might do the following:

```php
<!-- Check the 'targeting' cookie: -->
@if(isset($_COOKIE[config('cookies_consent.cookie_prefix') . 'cookies_consent']))
    @php
        $cookiesConsent = json_decode($_COOKIE[config('cookies_consent.cookie_prefix') . 'cookies_consent'], true);
    @endphp
    @if(isset($cookiesConsent['targeting']) && $cookiesConsent['targeting'] && config('app.google_analytics_id'))
        <!-- Google Analytics -->
        <script defer async>
            (function (i, s, o, g, r, a, m) {
                i['GoogleAnalyticsObject'] = r;
                i[r] = i[r] || function () {
                    (i[r].q = i[r].q || []).push(arguments)
                }, i[r].l = 1 * new Date();
                a = s.createElement(o),
                    m = s.getElementsByTagName(o)[0];
                a.async = 1;
                a.src = g;
                m.parentNode.insertBefore(a, m)
            })(window, document, 'script', 'https://www.google-analytics.com/analytics.js', 'ga');

            window.ga('create', '{{ config('app.google_analytics_id') }}', 'auto');
            window.ga('set', 'anonymizeIp', true);
            window.ga('send', 'pageview');
        </script>
    @endif
@endif
```

In this example, we checked whether
the `$_COOKIE[config('cookies_consent.cookie_prefix') . 'cookies_consent_targeting']` key exists or not.

## Customization

### Customizing the component texts

If you want to modify the texts shown in the cookies dialog, you can publish the language resource files with this
command:

```bash
php artisan vendor:publish \
--provider="SciFY\LaravelCookiesConsent\LaravelCookiesConsentServiceProvider" \
--tag="cookies-consent-translations"
```

This will publish the translation files to `lang/vendor/scify/laravel-cookies-consent/` directory.

The plugin comes with many built-in languages. You can change the translations for a given language, or add additional
languages yourself.

### Customizing the component contents

If you need full control over the contents of the cookies dialog, you can publish the views of the package:

```bash
php artisan vendor:publish \
--provider="SciFY\LaravelCookiesConsent\LaravelCookiesConsentServiceProvider" \
--tag="cookies-consent-components"
```

This will copy the view files over to `resources/views/components/vendor/scify/laravel-cookies-consent` directory.

## Development

In order to locally run the package, you should use a local Laravel application, in which you are going to install it.

Make sure that the `composer.json` file of the Laravel app has the following entry:

```text

"require": {
    "scify/laravel-cookies-consent": "@dev",
}
...
...
"repositories": [
        {
            "type": "path",
            "url": "../path/to/laravel-cookies-consent/",
            "options": {
                "symlink": true
            }
        }
    ],
"minimum-stability": "dev",
```

This will tell composer that the code for the package is of the `"@dev"` version and that it exists in the specified
path.

Then run:

```bash
composer update scify/laravel-cookies-consent --prefer-source
```

To fetch the local package.

## Testing

This project uses [Pest](https://pestphp.com/) for testing. To execute the test suite, run:

```bash
composer test
```

## FAQ

**Question:** Is this plugin free to use?

**Answer:** Yes. This plugin is totally free and developed as
an [Open-Source project](https://github.com/scify/laravel-cookies-consent).

---

**Question:** How long do the cookies last?

**Answer:** The duration is set in days, in `config/cookies_consent.php` file. In order to publish this file, run

```bash
php artisan vendor:publish \
--provider="SciFY\LaravelCookiesConsent\LaravelCookiesConsentServiceProvider" \
--tag="cookies-consent-config"
```

The configuration file will be published to `config/cookies_consent.php`.

Then, edit the `cookie_lifetime` field (in days).

---

**Question:** Will the cookie consent window show every time?

**Answer:** No. As soon as the user clicks one of the "Accept all", "Accept selection", or "Decline all", the selection
will be stored in another cookie, and the window won't pop up again, until this cookie expires, or is deleted.

---

**Question:** In which languages is the plugin available?

**Answer:** The plugin has 6 built-in languages: English, Greek, Spanish, German, Italian, and Swedish. If you would
like to add a language, publish the translations by running:

```bash
php artisan vendor:publish \
--provider="SciFY\LaravelCookiesConsent\LaravelCookiesConsentServiceProvider" \
--tag="cookies-consent-translations"
```

And add/change your own translations. If you add a new language, consider also opening
a [pull request](https://github.com/scify/laravel-cookies-consent/pulls), in order for this language to be included in
the plugin.

---

**Question:** Does this plugin work with all Laravel versions?

**Answer:** We have tested the plugin with Laravel 7, 8, and 9. The plugin's simplicity allows it to work with any
Laravel version, but if you try it with a version other that the tested ones and it does not work, please open an issue
on [GitHub](https://github.com/scify/laravel-cookies-consent/issues).

---

**Question:** If I install later a new cookie category, how can I force the plugin to "reset" and show again?

**Answer:** The easiest way is to publish the configuration file, and change the `cookie_prefix` field. This will force
the plugin to show again.

## Changelog

Please see [CHANGELOG](CHANGELOG.md) for more information on what has changed recently.

## Contributing

Please see [CONTRIBUTING](CONTRIBUTING.md) for general details.

### PHP code style - Laravel Pint

This application uses [Laravel Pint](https://laravel.com/docs/9.x/pint) in order to perform code-style.

In order to run the styler, run :

```bash
./vendor/bin/pint --test -v # the --test will not do any changes, it will just output the changes needed

./vendor/bin/pint -v # this command will actually perform the code style changes 
```

### Releasing a new version

After you have committed your changes, create a new git tag:

```bash
git tag -a vx.y.z -m "This is a nice tag name"
```

(for the `x.y.z` version number, follow the [Semantic Versioning](https://semver.org/) guidelines).

Then, push the tag:

```bash
git push origin vx.y.z
```

Then, in the [GitHub Releases page](https://github.com/scify/laravel-cookies-consent/releases), create a new Release *
*and correlate it with the tag that you just created.**

That's it! Packagist will be updated automatically.

Also, don't forget to update the `CHANGELOG.md` file with the new version name, release date, and release notes.

## Credits

- [SciFY Dev Team](https://github.com/scify)
- <a href="https://www.flaticon.com/free-icons/cookie" title="cookie icons">Cookie icons created by Freepik -
  Flaticon</a>

## License

The Apache Licence. Please see the [Licence File](LICENCE.md) for more information.
