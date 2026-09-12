# laravel-cookie-guard: nothing is erased when consent is withdrawn

Checked at v5.0.2.

## What we saw

The package has a working `eraseCookie()` (`resources/js/scripts.js:358`) and calls it once, on the name `cookieConsent`, when the cookie-policy link is clicked (`resources/js/scripts.js:322-328`).

`cookieConsent` is the pre-v3 cookie name. At v3.0.0 (2025-01-30) the JS still read `cookieConsent` and already wrote `{prefix}cookies_consent`; v4 reopens the banner via `#consent-settings` instead. No v4 or v5 install writes a cookie called `cookieConsent`, so the call erases nothing. Harmless, and dead.

The consequence that reaches visitors: when a visitor rejects a category, or later withdraws it, the cookies that category declared stay in the browser until they expire on their own. On a site with Google Analytics that is `_ga` and `_ga_<id>` living up to two years after consent was withdrawn. The consent gate itself works (the analytics script is not loaded), so this is about disclosure and a clean cookie jar, not about tracking continuing.

## How to see it

Accept analytics, load a page, reopen the banner and reject. Cookie inspector: `_ga*` still present.

## A design note before any fix

A generic package cannot safely blanket-delete `_ga*`. GA sets them with `cookie_domain: auto`, which resolves to the registrable domain, so on `app.example.org` they live on `.example.org` and are shared with sibling sites. Erasing them all would reset other sites' analytics identity. Not wiring the erase may have been restraint rather than oversight.

A shape that stays safe: on rejection, erase the cookies declared by name in the non-required categories. Operators who declare real names get precise cleanup; operators who leave placeholders get nothing erased, which is today's behaviour. Declaring precisely and erasing precisely become the same feature, and nothing is touched that the operator did not claim. The cookie's domain matters for the erase: a robust implementation expires the name on the host and on each parent domain up to the registrable one.

The `cookieConsent` line can go on its own, whatever happens to the rest.
