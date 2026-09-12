# laravel-cookie-guard: the consent payload is stored unvalidated

Checked at v5.0.2. Companion to report 01; the effect appears the moment the save route joins `web`.

## What we saw

`save_cookies_consent_selection()` takes `$request->all()` (`src/Http/Controllers/CookiesController.php:25`), JSON-encodes it into the queued cookie (line 27) and echoes it back in the response (line 32). Since v5.0.1 the `locale` value is validated before it reaches the translator (line 41); the rest of the body is not.

Today the cookie never ships (report 01), so the only reachable effect is the echo in an `application/json` response. Low. Once the route runs inside `web`, whatever a client posts (any keys, any size, any types) is written into an encrypted cookie for 365 days.

## What the JS actually sends

`{ "<category>": bool, ..., "locale": "<locale>" }`: one boolean per `.cookie-category` element (`resources/js/scripts.js:236-255`), plus `locale`.

## A shape that matches

- Each key in `config('cookies_consent.enabled')` accepted as `boolean`; `locale` kept under the existing pattern; nothing else accepted.
- Required categories forced to `true` server-side. The browser cannot untick them, and the server should not have to trust that.

## One coupling to know before returning 422

The JS hides the banner before the request is answered (`resources/js/scripts.js:267` hides, `:273` fetches) and only acts on `data.success` (`:283`). A validation error response has no `success`, so the banner would already be gone, no cookie would be written, and the banner would return on the next page load with no message. If the controller starts rejecting input, the JS should hide the banner on success only, or show the error with the message helper it already has.
