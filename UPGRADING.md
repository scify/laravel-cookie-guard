# How To Upgrade to a New Major Version

## Why Upgrade?

According to the EU General Data Protection Regulation (GDPR), websites must obtain user consent before storing cookies
on a user's device. The Laravel Cookies Consent plugin helps you comply with this regulation by providing a customizable
cookies consent dialog that allows users to choose which cookies they want to accept.

The intuition behind the a new major release is always to provide a more analytical, user-friendly and intuitive UI for
the cookies
consent dialog,
as well as to make the configuration file more structured and easier to use.

Additionally, we want to provide the users with a more detailed list of each cookie category and the cookies that are
being used, and allow the users to change their cookies preferences at any time.

## How to upgrade to a new major version

### Step 0: Backup Your Current Configuration File

The configuration file has been updated in v2. The new configuration file has some important changes and generally is
not 100% backward compatible with the v1 configuration file.

So, in order to update to the new configuration file, you should save your current configuration file (e.g.
`config/cookies-consent.php`) to a safe place.

### Step 1: Backup any changes made to the styles file

The v.1 of the plugin had a styles file that was published to `public/vendor/scify/laravel-cookie-guard/css/style.css`.
If you have
made any changes to this file, you should back it up before updating the plugin.

The v2 of the plugin has a new styles file, which is published to
`public/vendor/scify/laravel-cookie-guard/css/styles.css`. You should transfer any changes you made to the old styles
file
to the new one.

### Step 2: Update the Plugin

First, update the plugin to the latest version. You can do this by running the following command:

```bash
composer update scify/laravel-cookie-guard
```

### Step 3: Update the Configuration file

1. Publish the new configuration file by running the following command:

```bash
php artisan vendor:publish --provider="SciFY\LaravelCookiesConsent\LaravelCookiesConsentServiceProvider" --tag=cookies-consent-config --force
```

**CAUTION**: The `--force` flag is necessary in order to overwrite the existing configuration file.

2. Go over the "Explanation of the configuration file" in the [README.md](README.md) file, in order to understand the
   new structure
   of the configuration file.

3. Compare the new configuration file (`config/cookies-consent.php`) with your old configuration file. You should copy
   the values from your old configuration file to the new one. Most importantly, you should migrate the `cookies` array
   from the old configuration file to the new one, which contains the cookies that your website uses.

4. Make sure that the new configuration file is correct and that it contains all the necessary information about the
   cookies and the cookie categories that your website uses.

5. Make sure that the `cookies` array in the new configuration file is structured correctly. The `cookies` array should
   contain the cookies that your website uses, grouped by category.

6. Make sure that the `cookies` array in the new configuration file contains the necessary information about each cookie
   (e.g. name, description, duration, etc.).

### Step 4: Update the styles file (if necessary)

If you have made any changes to the styles file in the v1 version of the plugin, you should transfer these changes to
the new styles file.

Old styles file: `public/vendor/scify/laravel-cookie-guard/css/style.css`
New styles file: `public/vendor/scify/laravel-cookie-guard/css/styles.css`

### Step 5: Test that the Plugin Works Correctly

After updating the plugin and the configuration file, you should test that the plugin works correctly. You should test
the following:

1. The cookies consent dialog is displayed correctly on your website.
2. The cookies consent dialog is displayed in the correct language.
3. The cookies consent dialog displays the correct information about the cookies and the cookie categories.
4. The cookies consent dialog allows users to change their cookies preferences.
5. The cookies consent dialog saves the users' cookies preferences correctly.
6. The cookies consent dialog displays the correct cookies banner based on the users' cookies preferences.
