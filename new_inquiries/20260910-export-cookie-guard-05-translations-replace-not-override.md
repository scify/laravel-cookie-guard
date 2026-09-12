# laravel-cookie-guard: published translations replace the package files instead of overriding them

Checked at v5.0.2. A convention note for a future major, not a bug report.

## What we saw

The provider publishes the translations to `lang/vendor/scify/laravel-cookie-guard` (`src/LaravelCookiesConsentServiceProvider.php:48`) and then, when that directory exists, registers it as the `cookies_consent` namespace path in place of the package's own `lang/` (`:14-24`, the `if / elseif / else`).

Laravel's convention is different. `loadTranslationsFrom($path, 'cookies_consent')` registers the namespace; consumers override single strings by placing files under `lang/vendor/cookies_consent/{locale}/`, and the loader merges those over the package file (`Illuminate\Translation\FileLoader::loadNamespaceOverrides()`, `array_replace_recursive`). The docs: "you should only define the translation strings you wish to override. Any translation strings you don't override will still be loaded from the package's original language files." https://laravel.com/docs/13.x/localization#overriding-package-language-files

Because the publish target is the vendor/package path rather than the namespace, Laravel's lookup never finds it, and the provider compensates by swapping the whole path. The result is replace semantics:

- A consumer who publishes carries a full copy of every file, in every locale they publish.
- A partial file renders the missing keys as raw `cookies_consent::messages.…`.
- Every translation fix in the package (v5.0.2 is one) reaches published installs only after `vendor:publish --force` or a hand edit, and `--force` discards the consumer's own changes. The v5.0.2 release note already has to say so.
- A key added in a future version is missing from every published install until copied.

## What the convention would look like

Publish to `$this->app->langPath('vendor/cookies_consent')` and drop the path swap. Consumers then keep only the strings they change (typically the title, the description and the cookie descriptions) and inherit everything else, including fixes.

It is a breaking change for anyone who published: their files sit at the old path and would stop being read. A major version with an upgrade note, and one release that still detects the old directory and warns, would carry it. The README section on publishing translations (`README.md:621-624`) changes with it.
