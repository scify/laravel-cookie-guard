# laravel-cookie-guard: optional items found while reading the whole package

Checked at the head of #129 (`11d194c`), 2026-09-12, after reading every runtime file of the package: provider, controller, routes, config, the six templates, the JavaScript, and the tooling. The three bugs from the same reading are fixed in PR #130, stacked on #129, and are not repeated here. Nothing below is a bug that reaches a visitor. Each item is a decision, so each ends with options rather than a recommendation.

## 1. `enabled` is configured and documented, and read nowhere

`config/cookies_consent.php` ships `'enabled' => ['strictly_necessary']` and the README says it sets "the cookie categories that will be pre-selected". No file in `src/`, `resources/views/` or `resources/js/` reads that key. The checkboxes are rendered from `cookies` and their initial state comes from `required` (`checked disabled`) or from the consent cookie (`setSliders()`).

How to see it:

```
grep -rn "enabled" src resources/views resources/js
```

Options:

- Wire it: in `_cookie-categories.blade.php`, render `checked` for categories listed in `enabled` when no consent cookie exists yet. `setSliders()` already overrides that state once a cookie is present.
- Remove it from the default config and the README, and note the removal in the changelog. Consumers who kept the key lose nothing, because nothing read it.

## 2. Swedish is filed under `lang/se`

`lang/se/messages.php` is Swedish (`'title' => 'Cookie-samtycke'`). `se` is the ISO 639-1 code for Northern Sami; Swedish is `sv`. A Laravel application with `app.locale = 'sv'`, or a visitor negotiated to `sv`, never resolves these strings and falls back to English.

How to see it:

```
ls lang | grep -c '^sv$'      # 0
head -6 lang/se/messages.php
```

Options:

- Rename the directory to `sv`. A consumer who set `se` on purpose to reach Swedish is unlikely; if that worries you, keep `se` as a copy for one release and drop it in v6.

## 3. README says six built-in languages

Two places say "6 built-in languages: English, Greek, Spanish, German, Italian, and Swedish": the features list near line 126 and the FAQ near line 762 (the FAQ paragraph was edited in #129). `lang/` has 24 locale directories, and `AGENTS.md` already says 24.

Options:

- State 24, or drop the count and list nothing, so the next added locale does not make the sentence wrong again.

## 4. The consent cookie is written with neither `SameSite` nor `Secure`

`setCookie()` in `resources/js/scripts.js` writes `name=value; expires=...; path=/`. Browsers default `SameSite` to `Lax`, so behaviour is fine today. `Secure` is absent, so on an HTTPS site the cookie is also sent over HTTP if a plain-HTTP page of the same host exists.

Options:

- Append `; SameSite=Lax` explicitly, and `; Secure` when `window.location.protocol === "https:"`. One line, no behaviour change for HTTPS-only sites, and the cookie declaration in the banner stays accurate.

## 5. `cookie_lifetime => 0` now means a year

Before #127 the value fed `Cookie::queue()` in minutes, where `0` produced a session cookie. After #127 the JavaScript reads it as `parseInt(value, 10) || 365`, so `0` becomes 365 days. Nobody is likely to have set `0`, but the meaning silently flipped.

Options:

- Treat `0` as a session cookie: `setCookie()` already writes no `expires` when `days` is falsy, so only the `|| 365` fallback needs to distinguish "missing attribute" from "zero" (`Number.isNaN(parsed) ? 365 : parsed`).
- Or document in the config comment that the minimum is one day.

## 6. Skeleton leftovers

Files the package skeleton generated and nothing uses:

- `configure.php` (the interactive skeleton setup script; it offers to delete itself and never ran).
- `src/LaravelCookiesConsent.php` (an empty class), `src/Facades/LaravelCookiesConsent.php` and the `aliases` entry in `composer.json` that points at them.
- `database/migrations/create_cookies_consent_table.php.stub` (never published; `database/` is also `export-ignore`d).
- `.gitattributes` entries for `psalm.xml`, `.php_cs.dist.php`, `/art`, `/docs`, which do not exist.
- `package.json`: `"license": "ISC"` while `composer.json` says MIT; `"main": "index.js"` points at no file; `"description"` is an `<img>` tag.

Options:

- Remove in one housekeeping commit, or leave. None of it reaches a consumer except the licence mismatch on npm metadata, which nobody installs from.

## 7. Views publish to the pre-#129 shape

Views publish to `resources/views/vendor/scify/laravel-cookie-guard/components` and the provider prepends that path by hand when it exists. Laravel's `loadViewsFrom()` already looks in `resources/views/vendor/cookies_consent` for overrides, the same convention #129 adopted for translations. Unlike translations, view override is per file either way, so this is consistency, not a behaviour difference.

Options:

- Align with #129 in v6, when the translation path swap is removed anyway, with the same "legacy directory still read, with a warning" bridge.
- Leave as is; it works.

## For completeness: verified at `11d194c`

Pest 42 tests / 105 assertions, jsdom 12, Pint, PHPStan level 9: all green before PR #130, which adds 5 jsdom tests and 2 Pest tests and leaves every existing test untouched.
