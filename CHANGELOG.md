# Changelog

All notable changes to `laravel-cookie-guard` will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/)
and this project adheres to [Semantic Versioning](http://semver.org/).

## v4.1.0 - Improved Accessibility & Bug Fixes - 2025-04-03

We have decided to give the developers the ability to use the pure `<dialog>` HTML element functionality for our cookie
consent component to enhance accessibility and ensure compliance with privacy regulations.

The `<dialog>` element is designed to create a modal dialog that captures the user's focus, preventing interaction with
the rest of the webpage
until the dialog is dismissed.
This approach ensures that users must make a choice regarding cookie consent before they
can continue using the website.

By using the `<dialog>` element, we achieve the following benefits:

1. **Improved Accessibility:** The `<dialog>` element is natively supported by modern browsers and provides built-in
   accessibility features. It ensures that screen readers and other assistive technologies can properly announce the
   dialog and its contents to users with disabilities.


2. **Focus Management:** When the dialog is open, it automatically captures the focus, preventing users from navigating
   outside of it. This ensures that users cannot interact with other parts of the website until they have accepted or
   rejected the cookies, making the consent process clear and unavoidable.


3. **Compliance with Privacy Regulations:** By requiring users to make a choice before continuing to use the website, we
   ensure compliance with privacy regulations such as the GDPR. This approach guarantees that users are informed about
   and consent to the use of cookies before any data is collected.

Overall, the use of the `<dialog>` element enhances the user experience by providing a clear and accessible way to
manage cookie consent, ensuring that all users can interact with our website in a compliant and user-friendly manner.

This functionality is now the **default behavior of the plugin**, and it can be disabled by setting the new
`use_floating_modal`
flag in the `config/cookies_consent.php` file to `true`.

## v4.0.0 - Multilingual Support & Better Theming - Breaking Changes in Configuration and Functionality - 2025-03-07

The plugin is now renamed to `laravel-cookie-guard` and has undergone some major updates! 🎉🥳😍

**Important:**
Since the plugin now has a completely new name, you will need to uninstall the old package, and install the new one.

```bash
rm -rf public/vendor/scify && rm -rf vendor/scify

composer remove scify/laravel-cookies-consent

composer require scify/laravel-cookie-guard

php artisan vendor:publish --provider="SciFY\LaravelCookiesConsent\LaravelCookiesConsentServiceProvider" --tag="cookies-consent-public" --force
```

Then, make sure to check the configuration file `config/cookies_consent.php` and update it according
to [the new one](config/cookies_consent.php).

Then, make sure that the Laravel components you use are the new ones:

Intead of using:

```html

<x-laravel-cookies-consent></x-laravel-cookies-consent>
```

Use:

```html

<x-laravel-cookie-guard-scripts></x-laravel-cookie-guard-scripts>
<x-laravel-cookie-guard></x-laravel-cookie-guard>
```

### Introduction

In order to conform with the European Union's General Data Protection Regulation (GDPR) and improve the user experience,
the Laravel Cookies Consent plugin has undergone a major update. This release includes a multi-language support in the
banner, in order to allow the banner to change when the `locale` is changed. The plugin now supports multiple languages
in all the texts that are displayed to the user!

Also, in order to improve the flexibility and theming of the plugin, we now provide a `_variables.css` file, which can
be used to customize the colors and fonts of the plugin. This file is located in the
`public/vendor/scify/laravel-cookie-guard/styles` directory and can
be customized to match the design of your application.

### New Features

- **Multi-Language Support:** The plugin now supports multiple languages in the banner and the cookies consent modal.
  The texts displayed to the user can be translated based on the `locale` set in the application. By default, all 24
  languages of the EU are supported.
- **Automatic locale detection:** The plugin automatically detects the app's locale based on the Laravel locale, and
  displays the banner in the corresponding language.
- **Customizable Theme:** A `_variables.css` file is now being added to the
  `public/vendor/scify/laravel-cookie-guard/styles`
  directory, once you publish the front-end assets. This file can be used to customize the colors and fonts of the
  plugin to match the design of your
  application.
- **Cookies categories collapsed by default:** The cookies categories are now collapsed by default in the cookies
  consent modal. Users can expand each category to view the cookies included in that category. This can be tweaked in
  the `config/cookies_consent.php` file.
- **Improved UI/UX:** The cookies consent modal has been updated with improved styling and layout for a better user
  experience.

#### How to override the CSS styles

If you want to override the CSS styles of the cookies consent dialog, you can do this:

```html

<x-laravel-cookie-guard></x-laravel-cookie-guard>
<style>
  #scify-cookies-consent {
    --scify-cookies-primary-color: #ff5722; /* Override primary color */

    ...

    /* Add more override rules here */
  }
</style>
```

The full list of CSS variables that can be overridden can be found in the
`public/vendor/scify/laravel-cookie-guard/_variables.css` file.

### Breaking Changes

The `v4.0.0` release introduces significant changes to the `config/cookies_consent.php` configuration file.
These changes are necessary to improve the flexibility and usability of the plugin. Below
are the details of the changes and the steps required to update your existing configuration.

#### Configuration File Changes

**Cookie Categories:**

The structure of the `cookies` array has been updated to reflect the new multi-language support.
Each cookie now has their description derived from the language files, based on the `locale` set in the application.

**Cookie Duration:**

Each cookie category now includes a `description`, `duration`, and `duration_count` attributes.
For example, if you want to set the duration of a cookie to `2 years`, you can set the `duration` to
`cookies_consent::messages.years` and the `duration_count` to `2`.
The plugin will automatically translate the duration text, based on the `locale` set in the application.

**Cookies categories collapsed by default:**

The cookies categories are now collapsed by default in the cookies consent modal. Users can expand each category to view
the cookies included in that category. This can be tweaked in the `config/cookies_consent.php` file, in the
`categories_collapsed_by_default` key.

### Migration Guide

1. Backup your existing configuration file: Before updating to the new version, make sure to take a backup of your
   existing
   `config/cookies_consent.php` file to avoid losing any custom settings.
2. **Update the Configuration File:** Run
   `php artisan vendor:publish --provider="SciFY\LaravelCookiesConsent\LaravelCookiesConsentServiceProvider" --tag=cookies-consent-config --force`
   and then ensure the `cookie_prefix` is set in the `config/cookies_consent.php` file. Update
   the
   `description`, `duration`, and `duration_count` fields of **each cookie** in the cookies array to reflect the new
   JSON
   storage format.
3. **Publish the Front-End Assets:** Run the following command to publish the updated assets:
   `php artisan vendor:publish --provider="SciFY\LaravelCookiesConsent\LaravelCookiesConsentServiceProvider" --tag="cookies-consent-public" --force`
4. **Build the Laravel configuration cache:** Run the following command to rebuild the configuration cache:
   `php artisan config:cache`
5. **Test Your Application:** Ensure that the cookies consent functionality works as expected with the new JSON storage
   format. Verify that the cookies are correctly set and retrieved in the browser.

## v3.1.0 - Changes in assets files in the public directory - 2025-01-31

In order to simplify the installation process and avoid potential conflicts with existing assets, the front-end assets
are now included directly in the package and loaded from the `vendor/scify/laravel-cookie-guard/` directory.

This means that the `public/vendor/scify/laravel-cookie-guard` directory should be deleted, and the assets should be
published
again:

In order to update to the new version, you need to remove the `public/vendor/scify/laravel-cookie-guard` directory
and run the
asset publishing command:

```bash
rm -rf public/vendor/scify/laravel-cookie-guard
```

And then:

```bash
php artisan vendor:publish \
--provider="SciFY\LaravelCookiesConsent\LaravelCookiesConsentServiceProvider" \
--tag="cookies-consent-public"
```

## v3.0.2 - Major Release - JSON Cookie Storage & Configuration Changes - 2025-01-30

### Breaking Changes

* JSON Cookie Storage: Cookies are now stored in a JSON object under a single key with the prefix specified in the
  configuration file. This change improves the structure and management of cookies.

* Configuration File Changes: The configuration file format has been updated to reflect the new JSON cookie storage
  method. The `cookie_prefix` is now used to store cookies in a JSON object.

## New Features

* JSON Cookie Storage: Cookies are now stored in a JSON object under a single key with the prefix specified in the
  configuration file. This change improves the structure and management of cookies.
* `hide_floating_button_on_mobile` option: A new configuration option has been added to hide the floating cookies button
  on mobile devices. This option allows you to control the visibility of the floating button based on the device type.
* UI/UX Improvements: The cookies consent modal has been updated with improved styling and layout for a better user
  experience.

### Migration Guide

1. Update the configuration file to reflect the new JSON cookie storage method:

* Ensure the `cookie_prefix` is set in the `config/cookies_consent.php` file.
* Update the `name` field of each cookie in the `cookies` array to reflect the new JSON storage format.

Example:

```php
'cookie_prefix' => 'my_app_',
'cookies' => [
    'strictly_necessary' => [
        [
            'name' => 'my_app_cookies_consent',
            'description' => 'This cookie is set by the GDPR Cookie Consent plugin and is used to store whether or not user has consented to the use of cookies. It does not store any personal data.',
            'duration' => '2 years',
            'policy_external_link' => null,
        ],
        // other cookies...
    ],
    'targeting' => [
        // cookies...
    ],
],
```

2. Update Blade Files

* Update the Blade files to reflect the new JSON cookie storage method. The `cookie` helper function is used to set and
  retrieve cookies from the JSON object.

Example:

```php
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

3. Publish the front-end assets

* Run the following command to publish the updated assets:
  `php artisan vendor:publish --provider="SciFY\LaravelCookiesConsent\LaravelCookiesConsentServiceProvider" --tag="cookies-consent-public" --force`

4. Test your application

* Ensure that the cookies consent functionality works as expected with the new JSON storage format.
* Verify that the cookies are correctly set and retrieved in the browser.

## v2.0.7 - UI Improvements for smaller screens - 2024-01-27

- Improved the UI design for smaller screens (phones & tablets)
- Fixed the width of the cookies container

## v2.0.0 - Major Release - GDPR & UI Improvements - 2024-10-10

The v2 of the Laravel Cookies Consent plugin has been released! 🎉🥳😍

This version includes some important changes and improvements, such as:

- A new configuration file format. Now you can declare the cookies each cookie category uses in a
  more structured way.
- A new, clean, and intuitive UI for the cookies consent modal.
- An option to present the cookies consent dialog in a separate page instead of a modal.
- A stick cookies button that allows users to change their cookies preferences at any time. This button is optional and
  it's existence can be tweaked in the configuration file.
- A separate page for the cookies preferences, where users can read more about each cookie category and change their
  preferences.

## v1.1.3 - UI Improvements for compliance with GDPR - 2023-10-26

- Changed the background color of the "Allow all cookies" button, in order to be compliant with the GDPR rules
- Fixed the padding of the button texts

## v.1.1.2 - Portuguese Language v2

Added Portuguese Language corrections, thanks to
this [PR](https://github.com/scify/laravel-cookie-guard/commit/a0ce037cd3bc82ca95c52ff30d2bf07236bd8306)
by [ViNiSeNnAtt](https://github.com/scify/laravel-cookie-guard/commits?author=ViNiSeNnAtt)

## v1.1.1 - Portuguese Language

Added Portuguese Language, thanks
to [this commit](https://github.com/scify/laravel-cookie-guard/commit/c5e015f93df4ad9a40450cea37231592613e77b8)
by [ViNiSeNnAtt](https://github.com/scify/laravel-cookie-guard/commits?author=ViNiSeNnAtt)

## v1.1.0 - Improvements regarding the styles file, Composer lib updates

Improvements regarding the styles file, Composer lib updates

**List of Updates:**

- Fixed z-index issue (as reported in https://github.com/scify/laravel-cookie-guard/issues/10)
- Now the front-end assets (styles) file is not automatically published, to avoid causing overriding (reported
  in https://github.com/scify/laravel-cookie-guard/issues/11)
- Composer libraries update
- Improved Development guidelines in Readme file

**Notable Changes:**

Now, in order to publish the styles file to `public/vendor/scify/laravel-cookie-guard/css/style.css` it is **required
** to manually
run the publishing command:

```bash
php artisan vendor:publish \
--provider="SciFY\LaravelCookiesConsent\LaravelCookiesConsentServiceProvider" \
--tag="cookies-consent-public"

```

## v1.0.1 - Fixed bug on setting "all" cookies button - 2023-03-16

This release addresses [this issue](https://github.com/scify/laravel-cookie-guard/issues/4), regarding the cookie
prefix when accepting "all" cookies.

## v1.0.0 - First Stable Release - 2022-12-19

This is the first stable release of the plugin!
Feel free to download, try and customize it. If you find any issues, please report them to
the [issue page](https://github.com/scify/laravel-cookie-guard/issues).
Check out the [CONTRIBUTING.md](https://github.com/scify/laravel-cookie-guard/blob/main/CONTRIBUTING.md) guide to
contribute to this open-source project!

## Use of app()->langPath() Laravel method, in order to publish the translation resources - 2022-12-09

The plugin now uses Laravel's `app()->langPath()` method, in order to publish the translation files.

## v0.9.3 - Plugin is now compatible with all 7.x and 8.x versions - 2022-11-21

Set the required PHP version to either `7.x` or `8.x`, in order to accommodate older Laravel installations.

## v0.9.2 - Fixed bugs on cookie prefix, improved documentation - 2022-11-21

- Now the cookie prefix is set entirely from the configuration file. The trailing character should be set there.

## v0.9.0 - Tested and improved UI in smaller screens - 2022-11-21

- Improved UI design in smaller (phone & tablet) screens.
- The plugin is now ready to be tested and used in 3rd party Laravel apps.

## v0.0.3 - Improvements in Design & Layout - 2022-11-21

Improved the overall design and fixed the width of the cookies container

## v0.0.2 - Added translations, cookie lifetime duration - 2022-11-18

- Added the ability to set cookie duration
- Fixed container width on larger screens
- Added remaining languages
- Improved README.md instructions

## v0.0.1 First Testing Version - 2022-11-18

This is the initial release of the plugin.
SciFY Team will start testing the plugin in our own projects and proceed to the release of version 1.0.0, when deem
applicable.
