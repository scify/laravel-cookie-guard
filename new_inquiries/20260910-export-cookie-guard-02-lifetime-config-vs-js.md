# laravel-cookie-guard: three lifetimes for one consent cookie

Checked at v5.0.2. Companion to report 01.

## What we saw

The consent cookie the browser actually holds is written by the JS with a hardcoded 30 days (`resources/js/scripts.js:284`, `setCookie(..., 30)`). Two other numbers describe the same cookie and neither reaches the browser:

- `cookie_lifetime => 365` (`config/cookies_consent.php:69`) feeds only the server-side `Cookie::queue()` (`src/Http/Controllers/CookiesController.php:27`), which never ships (report 01).
- The default banner declares the consent cookie as `years` / 1 (`config/cookies_consent.php:42-43`).

A stock install tells the visitor "1 year", the config says 365 days, and the browser expires the cookie after 30. The visitor answers the banner monthly.

History: `cookie_lifetime` dates from 2022-11-18, when the cookie was meant to be set server-side. The 30 in the JS is already present in the compiled bundle at v3.0.0 (2025-01-30). The two never met.

## How to see it

Any consuming app, after clicking Accept: the browser's cookie inspector shows `{prefix}cookies_consent` expiring 30 days out, while the banner says one year.

## Options

- The JS reads the lifetime from a data attribute rendered from `cookie_lifetime`, so config governs the cookie the browser gets, and the default declaration changes to match. Then `cookie_lifetime` means what its comment says.
- The smaller edit: change the default declaration to `days` / 30 so the banner matches the JS, and leave `cookie_lifetime` to the server cookie if report 01 keeps it.

Either way, one number that config, banner and browser agree on.
