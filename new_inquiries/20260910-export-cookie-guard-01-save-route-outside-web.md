# laravel-cookie-guard: the save route runs outside the `web` middleware group

Checked at v5.0.2. Found while making one consuming site's cookie declarations match what its browser actually stores; not a review of the package.

## What we saw

`POST /guard-settings/save` is registered with a bare `loadRoutesFrom()` and no middleware (`src/LaravelCookiesConsentServiceProvider.php:51`, `routes/web.php:23`). Three things follow from that one fact:

1. **The CSRF token is sent and never checked.** The component renders `<meta name="csrf-token">` (`resources/views/components/_cookie-categories.blade.php:7`) and the JS sends it as `X-CSRF-TOKEN` (`resources/js/scripts.js:277`). The middleware that compares it with the session token belongs to the `web` group and does not run here, and without `StartSession` there is no session token to compare against.
2. **`Cookie::queue()` never reaches a browser.** Queued cookies are attached to the response by `AddQueuedCookiesToResponse`, also in `web`. The `{prefix}cookies_consent_selection` cookie (`src/Http/Controllers/CookiesController.php:27`) has never been set on any install. The JS writes the real consent cookie itself (`resources/js/scripts.js:284`), and nothing in the package reads the queued one.
3. **The suite cannot see either.** `tests/CookiesControllerTest.php:40` uses `Cookie::spy()` and asserts that `queue` was called, not that the response carries a cookie.

The route has been registered this way in every version of `routes/web.php` since the initial commit (2022-11-18).

## How to see it

Route table of any consuming app. The save route prints no middleware line; a route in the `web` group prints `⇂ web` beneath it:

```
php artisan route:list --path=guard-settings -v
```

A token-less request from outside the browser. It answers `200` with the payload echoed back and no `Set-Cookie` header:

```
curl -s -D - -X POST https://<app>/guard-settings/save \
  -H 'Content-Type: application/json' -H 'Accept: application/json' \
  -d '{"strictly_necessary":true,"locale":"en"}'
```

A test that fails today, appended to `tests/CookiesControllerTest.php`:

```php
it('sends the queued consent cookie to the browser', function (): void {
    config(['cookies_consent.cookie_prefix' => 'my_app_']);

    $this->postJson('/guard-settings/save', ['strictly_necessary' => true])
        ->assertOk()
        ->assertCookie('my_app_cookies_consent_selection');
});
```

Result at v5.0.2: `Cookie [my_app_cookies_consent_selection] not present on response.`

The CSRF half cannot be shown by a test: the middleware skips itself under unit tests (`PreventRequestForgery::handle()`, the `runningUnitTests()` branch). The curl above is the demonstration.

## What is coupled

Wrapping the routes in `Route::middleware('web')->group(...)` fixes both points, with one side effect: the queued cookie starts shipping. It lasts 365 days by default (`config/cookies_consent.php:69`), is encrypted, is not declared in the default banner config, and is read by nothing. Two ways to keep the banner truthful: drop the `Cookie::queue()` line and let the JS cookie stay the single source, or keep it and declare it in the default config. Either works for consumers; the first is the smaller change. Reports 02 (lifetime) and 04 (payload) describe what becomes live the moment the route joins `web`.

## References

- Laravel package docs, Routes: the example is a bare `loadRoutesFrom()` and the page says nothing about middleware. https://laravel.com/docs/13.x/packages#routes
- `web` group composition: `Illuminate\Foundation\Configuration\Middleware::getMiddlewareGroups()`, the `'web'` entry.
- Queued cookies reach the response only in `Illuminate\Cookie\Middleware\AddQueuedCookiesToResponse::handle()`.
- Token comparison: `Illuminate\Foundation\Http\Middleware\PreventRequestForgery::tokensMatch()` on Laravel 13 (`ValidateCsrfToken` extends it); `ValidateCsrfToken` on Laravel 12. Laravel 13 also accepts same-origin requests via the `Sec-Fetch-Site` header without a token; Laravel 12 does not.
