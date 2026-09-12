# Changelog

All notable changes to `laravel-cookie-guard` will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/)
and this project adheres to [Semantic Versioning](http://semver.org/).

## v5.1.0 - Save route under `web`, config-driven consent lifetime, validated payload

- **Security:** the package routes now run inside the `web` middleware group. `POST /guard-settings/save` was registered without middleware since the first release, so the CSRF token the JavaScript sent was never checked. If you call that route from your own code, send the CSRF token (on Laravel 13 a same-origin request is also accepted without one).
- The save request sends the `XSRF-TOKEN` cookie as `X-XSRF-TOKEN`, so the token stays current on pages that never reload (Inertia, Livewire, Turbo); a token rendered into the page went stale after login and the save failed with 419 on Laravel 12. Without the cookie the JavaScript uses `data-csrf-token`, now on the banner root of both components, then the `csrf-token` meta tag of components published before 5.1. The package no longer renders that meta tag itself (it was in `_cookie-categories.blade.php`); if your own scripts read it, render one in your layout.
- Removed the server-side `{cookie_prefix}cookies_consent_selection` cookie. It was queued with `Cookie::queue()` on a route without the `web` group, so it never reached a browser, and nothing in the package read it. The `{cookie_prefix}cookies_consent` cookie written by the JavaScript is the single source of the visitor's consent.
- `cookie_lifetime` now governs the consent cookie the browser stores. The JavaScript used a hardcoded 30 days while the config said 365 and the default banner declared one year. The templates render the configured value as `data-cookie-lifetime`, and the JavaScript uses it (default 365 when the attribute is missing, for example in published views that predate it). New consents last the configured lifetime; existing 30-day cookies expire on their own schedule. If you use a custom `cookie_lifetime`, check that the duration declared for the consent cookie in `strictly_necessary` matches.
- The consent payload is validated: one boolean per configured cookie category plus a `locale` string. Unknown keys are dropped from the echoed `data`, a non-boolean category value returns 422, and the categories listed in `required` are always stored as accepted regardless of what the browser sent.
- The JavaScript hides the banner only after the server confirms the save. Previously it hid the banner before sending the request, so a failed request left the visitor with no banner and no consent cookie until the next page load. It also sends `Accept: application/json`, so validation and CSRF errors come back as JSON.
- Rejecting a category now erases the cookies declared by `name` in it. When the visitor rejects a category, or withdraws consent for it later, the JavaScript expires each declared cookie on the current host and on its parent domains down to the registrable one, so `_ga` and `_ga_<id>` no longer outlive a withdrawn consent. Only the names in your config are touched; required categories are never erased. The banner root carries the configured categories with their cookie names as `data-cookie-categories` and the `required` list as `data-required-categories`. If you published the components, re-publish them or add the two attributes to the root element yourself; without them the JavaScript falls back to the checkboxes and erases nothing.
- Fixed "Accept all" and "Reject optional" in `use_separate_page` mode. The banner there renders no category checkboxes, and the JavaScript built the selection from the checkboxes, so both buttons posted an empty selection. The stored cookie then held only the required categories, and a consumer check such as `$cookiesConsent['targeting']` never became true after "Accept all". The JavaScript now builds the selection from the categories on the banner root, so every configured category is stored as accepted or rejected in both modes.
- Removed the click handler that erased a cookie named `cookieConsent`, the pre-v3 name that no v4 or v5 install writes.
- "Reject optional" keeps every category listed in `required`. Only `strictly_necessary` was kept, so a second required category was stored as rejected and the erase above would have removed its cookies. The browser now stores the selection the server confirmed.
- The floating button opens with Enter. Its own Enter handler fired after the browser's native click, so the banner toggled twice and closed at once.
- Translations are now published to `lang/vendor/cookies_consent/`, the path Laravel reads for the `cookies_consent` namespace. Files there override the package strings key by key, so you keep only the strings you change and receive every other fix. Previously the files were published to `lang/vendor/scify/laravel-cookie-guard/` and the provider swapped the whole translation path, so a published install carried a full copy of every file and missed every later fix until `vendor:publish --force`. The old directory is still read, with a warning in the log on each boot, until v6. Move the strings you changed to the new path and delete the old directory.
- The Swedish translations moved from `lang/se` to `lang/sv`, the ISO 639-1 code for Swedish (`se` is Northern Sami). An application with `app.locale = 'sv'` now gets Swedish instead of the English fallback. If you set the locale to `se` to reach these strings, switch to `sv`.
- Removed the `enabled` config option. It was documented as the list of pre-selected categories, but nothing read it: the checkboxes start unchecked except the `required` ones, which render checked and locked. A published config that still contains the key keeps working.
- The consent cookie is written with `SameSite=Lax`, and with `Secure` when the page is served over HTTPS. The server-side cookie removed above inherited both from the application's session config; the JavaScript cookie set neither.
- Tests: the route middleware and the absence of the server cookie are asserted on the real response instead of a `Cookie` spy. The jsdom behaviour tests can now run the success path of the save (async helper, dialog stub, natural `DOMContentLoaded`) and read the cookie expiry from the cookie jar.

## v5.0.2 - Fix plural duration intervals on Laravel 12.48+

- Fixed cookie durations rendering as `[2,Inf] 2 years` on Laravel 12.48 and newer. All 24 locale files spelled the open plural interval as `[2,Inf]`, the Symfony Translation form. Laravel's `MessageSelector` documents `[2,*]`, and `[2,Inf]` only worked because the pre-12.48 condition regex accepted any text between brackets. laravel/framework#58367 restricts the condition to digits and `*`, so the interval was neither matched nor stripped. The `hours`, `days`, `years`, `minutes` and `months` keys now use `[2,*]`, which Laravel has supported since 5.4. Fixes #119, contributed by @codeuxius in #123.
- Added a test that renders all five duration units with `duration_count` 2 in every locale and asserts that no raw interval reaches the output.
- If you published the package translations, re-run `php artisan vendor:publish --tag="cookies-consent-translations" --force`. The published copies override the package files and still contain `[2,Inf]`.
- v4.x contains the same `[2,Inf]` spelling and is not patched. v4 users on Laravel 12.48+ should upgrade to v5 (PHP 8.2+, Laravel 12+) or stay on Laravel below 12.48.

## v5.0.1 - Locale validation, Laravel 12+, real JavaScript coverage reporting

- **Security:** the `locale` submitted to `POST /guard-settings/save` is now validated against a locale identifier pattern (for example `en`, `pt-br`, `zh_Hant_TW`) before it is passed to the translator. Previously the raw value ended up in a translation file path. Invalid values fall back to the application locale. The `GET /cookie-policy/{locale}` route now applies the same pattern and returns 404 for anything else.
- **Laravel 11 support removed** (`illuminate/contracts: ^12.0|^13.0`). Laravel 11 reached end of life in March 2026 and was declared but never tested in v5.0.0. The README now states Laravel 12 or 13.
- JavaScript behaviour tests now execute the compiled bundle through `vm.Script` with jsdom's `runVMScript` instead of `window.eval`, so c8 can attribute coverage to the source. The Vite build now emits `public/scripts.js.map`, which is committed and published with the other assets, and which c8 uses to report against `resources/js/scripts.js`.
- `npm run test:coverage` runs both JavaScript test files and emits an lcov report, which the CI coverage job uploads to Codecov next to the PHP clover report.
- Removed the unused coverage badge step and its artifact upload from the CI coverage job. The README badge is served by Codecov.

## v5.0.0 - PHP 8.2 requirement & dependency updates

- **Breaking:** the package now requires PHP 8.2 or newer (`"php": "^8.2"`). PHP 8.0 and 8.1 are no longer supported.
- **Breaking:** the package now declares a Laravel floor of 11 (`illuminate/contracts: ^11.0|^12.0|^13.0`). It uses the typed config getters `config()->integer()` and `config()->string()`, which were introduced in Laravel 11.
- CI now tests against Laravel 12 on PHP 8.2, 8.3 and 8.4, and Laravel 13 on PHP 8.3 and 8.4.
- Updated development dependencies to their latest major versions: Orchestra Testbench 11, Pest 4, PHPUnit 12, ESLint 10, jsdom 30, c8 12. The previous majors remain allowed so the PHP 8.2 / Laravel 12 matrix jobs can resolve.
- Raised the PHPStan level from 4 to 9 and fixed the reported type issues.
- Hardened the GitHub Actions workflows: `npm ci --ignore-scripts`, lock-file based `composer install` for the coverage job, and removed an unpinned `npm install -g npm@latest` step.

## v4.1.13 - Fix `view:cache` failure when vendor views are not published

- Fixed a `DirectoryNotFoundException` thrown by `php artisan view:cache` when the package's vendor views had not been published. The service provider now only registers the published views path if it actually exists, falling back to the bundled package views otherwise.

## v4.1.6 - Bug Fixes & Improvements

- Fixed the issue with the undefined `$accordionHeader` in the cookie consent dialog.
- Added dev-related tools (linter, prettier, etc)
- Updated dependencies to their latest versions.

## v4.1.5 - Fixes For Safari Browser

- Fixed the issue with the cookie consent dialog overflow in Safari.

## v4.1.4 - Customizable Heading Level for Dialog & Opening by hash

- Added the ability to customize the heading level of the cookie consent dialog title and the accordion headings via the `heading` and `accordion-heading` attribute on the `<x-laravel-cookie-guard>` component.
- This allows developers to specify the semantic heading tag (e.g., `h2`, `h3`, etc.) for better accessibility and SEO integration with their application's heading structure.
- Example usage:

  ```blade
  <x-laravel-cookie-guard heading="h2" accordion-heading="h5"/>
  ```

- The default heading level is now `h2` for `heading` and `h5` for `accordion-heading`, if not specified.
- The cookie consent banner can now also be opened by navigating to the `#consent-settings` hash in the URL. The banner will open automatically on page load or when the hash changes to `#consent-settings`.
  Example usage:

  ```html
  <div>
    <a href="#consent-settings">Cookies Preferences</a>
  </div>
  ```

## v4.1.3 - Button hover text color & Modal placement

- Fixed the issue with the button hover text color in the cookies consent modal.
- Fixed the issue with the placement of the cookies consent modal in Safari.

## v4.1.2 - Fixed Back Scrolling & Button focus

- Fixed the issue with the back scrolling of the page when the cookies consent modal is open.
- Fixed the issue with the button focus in Safari.

## v4.1.0 - Improved Accessibility & Bug Fixes - 2025-04-03

We have decided to give the developers the ability to use the pure `<dialog>` HTML element functionality for our cookie
consent component to enhance accessibility and ensure compliance with privacy regulations.

The `<dialog>` element is designed to create a modal dialog that captures the user's focus, preventing interaction with
the rest of the webpage
until the dialog is dismissed.
This approach ensures that users must make a choice regarding cookie consent before they
can continue using the website. Read more [here](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/dialog).

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
`use_floating_modal` flag in the `config/cookies_consent.php` file to `true`.

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

- JSON Cookie Storage: Cookies are now stored in a JSON object under a single key with the prefix specified in the
  configuration file. This change improves the structure and management of cookies.

- Configuration File Changes: The configuration file format has been updated to reflect the new JSON cookie storage
  method. The `cookie_prefix` is now used to store cookies in a JSON object.

## New Features

- JSON Cookie Storage: Cookies are now stored in a JSON object under a single key with the prefix specified in the
  configuration file. This change improves the structure and management of cookies.
- `hide_floating_button_on_mobile` option: A new configuration option has been added to hide the floating cookies button
  on mobile devices. This option allows you to control the visibility of the floating button based on the device type.
- UI/UX Improvements: The cookies consent modal has been updated with improved styling and layout for a better user
  experience.

### Migration Guide

1. Update the configuration file to reflect the new JSON cookie storage method:

- Ensure the `cookie_prefix` is set in the `config/cookies_consent.php` file.
- Update the `name` field of each cookie in the `cookies` array to reflect the new JSON storage format.

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

- Update the Blade files to reflect the new JSON cookie storage method. The `cookie` helper function is used to set and
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

- Run the following command to publish the updated assets:
  `php artisan vendor:publish --provider="SciFY\LaravelCookiesConsent\LaravelCookiesConsentServiceProvider" --tag="cookies-consent-public" --force`

4. Test your application

- Ensure that the cookies consent functionality works as expected with the new JSON storage format.
- Verify that the cookies are correctly set and retrieved in the browser.

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

- Fixed z-index issue (as reported in <https://github.com/scify/laravel-cookie-guard/issues/10>)
- Now the front-end assets (styles) file is not automatically published, to avoid causing overriding (reported
  in <https://github.com/scify/laravel-cookie-guard/issues/11>)
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
