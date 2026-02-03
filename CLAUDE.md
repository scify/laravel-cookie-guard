# CLAUDE.md - Laravel Cookie Guard

## Project Overview

Laravel Cookie Guard is a GDPR-compliant cookie consent package for Laravel applications. It provides a customizable modal dialog allowing users to control which cookie categories they accept, with support for 26 languages.

**Repository:** <https://github.com/scify/laravel-cookie-guard>
**Author:** SciFY (Paul Isaris)
**License:** MIT/Apache 2.0

## Quick Reference

```bash
# Development
npm install && npm run build    # Build frontend assets
composer install                # Install PHP dependencies

# Testing
composer test                   # Run Pest tests
composer test-coverage          # Run tests with coverage

# Linting
npm run lint:js                 # ESLint for JavaScript
npm run lint:css                # Stylelint for CSS/SCSS
npm run lint:blade              # blade-formatter for Blade templates
./vendor/bin/pint               # Laravel Pint for PHP

# Publishing (in consuming Laravel app)
php artisan vendor:publish --provider="SciFY\LaravelCookiesConsent\LaravelCookiesConsentServiceProvider" --tag="cookies-consent-config"
```

## Directory Structure

```text
src/
├── LaravelCookiesConsentServiceProvider.php  # Main service provider
├── LaravelCookiesConsent.php                 # Base class (placeholder)
├── Facades/LaravelCookiesConsent.php         # Facade
├── Http/Controllers/CookiesController.php    # Handles AJAX consent saving
└── View/Components/                          # Blade components
    ├── LaravelCookiesConsent.php             # Main modal component
    ├── LaravelCookiesConsentPage.php         # Separate page component
    └── LaravelCookiesConsentScripts.php      # Asset loader component

resources/
├── js/scripts.js                             # Frontend JavaScript
├── styles/
│   ├── styles.scss                           # Main stylesheet
│   ├── _variables.css                        # CSS custom properties
│   └── *.scss                                # Partial stylesheets
└── views/components/
    ├── laravel-cookie-guard.blade.php        # Main modal template
    ├── laravel-cookie-guard-page.blade.php   # Policy page template
    ├── laravel-cookie-guard-scripts.blade.php # Assets template
    └── _cookie-categories.blade.php          # Categories partial

config/cookies_consent.php                    # Configuration file
routes/web.php                                # Package routes
lang/{locale}/messages.php                    # Translations (26 locales)
public/                                       # Compiled assets (gitignored, built)
tests/                                        # Pest test suite
```

## Architecture

### Service Provider (`LaravelCookiesConsentServiceProvider`)

Responsibilities:

- Registers three Blade components: `laravel-cookie-guard`, `laravel-cookie-guard-page`, `laravel-cookie-guard-scripts`
- Loads translations from `lang/` directory
- Publishes config, assets, views, and translations
- Loads routes from `routes/web.php`

### Data Flow

1. Page loads → `initializeCookieBanner()` checks for existing consent cookie
2. If no cookie → Show modal dialog
3. User selects preferences → Click save/accept/reject
4. JavaScript sends POST to `/guard-settings/save` with consent JSON
5. `CookiesController::save_cookies_consent_selection()` stores HTTP cookie
6. Response triggers success toast, closes modal, shows floating button

### Key Files for Common Tasks

| Task | Files to Modify |
|------|-----------------|
| Change modal appearance | `resources/styles/styles.scss`, `resources/styles/_variables.css` |
| Add/modify cookie categories | `config/cookies_consent.php` |
| Change modal behavior | `resources/js/scripts.js` |
| Add new translation | `lang/{locale}/messages.php` |
| Modify modal HTML structure | `resources/views/components/laravel-cookie-guard.blade.php` |
| Change how consent is saved | `src/Http/Controllers/CookiesController.php` |
| Add new Blade component props | `src/View/Components/LaravelCookiesConsent.php` |

## Configuration (`config/cookies_consent.php`)

Key options:

- `cookie_prefix` - Prefix for all cookies (multi-app support)
- `display_floating_button` - Show/hide floating settings button
- `use_separate_page` - Simple dialog vs all-in-one mode
- `categories_collapsed_by_default` - Accordion default state
- `use_floating_modal` - `<dialog>` vs floating modal approach
- `cookies` - Array of cookie categories with nested cookie definitions
- `enabled` - Pre-checked categories on first load
- `required` - Categories user cannot disable
- `cookie_lifetime` - Days until consent cookie expires (default: 365)

## Blade Components Usage

```blade
{{-- In layout head/footer --}}
<x-laravel-cookie-guard-scripts />

{{-- Modal dialog --}}
<x-laravel-cookie-guard />

{{-- With custom heading levels (for SEO/accessibility) --}}
<x-laravel-cookie-guard heading="h2" accordion-heading="h5" />

{{-- Separate policy page --}}
<x-laravel-cookie-guard-page />
```

## JavaScript API

Public functions exposed on `window`:

- `window.toggleCookieBanner()` - Toggle modal visibility

Key internal functions in `resources/js/scripts.js`:

- `handleAcceptAllCookies()` - Accept all categories
- `handleRejectOptionalCookies()` - Only accept required categories
- `handleAcceptSelectedCookies()` - Accept user selections
- `handleCookieConsent(consent)` - Send AJAX request to backend
- `getConsentSettings(acceptAll, requiredCategory)` - Build consent object

## Routes

```text
GET  /cookie-policy/{locale}  - Cookie policy page with locale
POST /guard-settings/save     - Save consent preferences (AJAX)
```

## Testing

Uses Pest with Orchestra Testbench. Test files:

- `tests/TestCase.php` - Base test case with service provider loading
- `tests/TranslationTest.php` - Verifies translation keys exist

Run tests:

```bash
composer test              # Standard run
./vendor/bin/pest          # Direct Pest execution
composer test-coverage     # With coverage report
```

## Building Frontend Assets

Uses Vite for bundling:

```bash
npm run build              # Production build
npm run dev                # Development with watch
```

Output goes to `public/` directory:

- `scripts.js` - Compiled JavaScript
- `styles.css` - Compiled CSS
- `_variables.css` - CSS custom properties (separate for easy override)

## Adding a New Language

1. Copy an existing language directory: `cp -r lang/en lang/xx`
2. Translate all keys in `lang/xx/messages.php`
3. Test by setting locale: `app()->setLocale('xx')`

## CSS Customization

Override CSS variables in your app's stylesheet:

```css
:root {
  --scify-cookies-primary-color: #your-brand-color;
  --scify-cookies-bg-color: #your-background;
  /* See resources/styles/_variables.css for all options */
}
```

## Common Gotchas

1. **Assets not appearing**: Run `php artisan vendor:publish --tag="cookies-consent-public"` and clear browser cache
2. **Translations not working**: Ensure locale is set before components render
3. **Modal not showing**: Check for JavaScript errors; requires `<x-laravel-cookie-guard-scripts />` in page
4. **Cookie not persisting**: Verify CSRF token meta tag exists: `<meta name="csrf-token" content="{{ csrf_token() }}">`
5. **Floating button hidden on mobile**: Check `hide_floating_button_on_mobile` config option

## Dependencies

**PHP:** 8.0+
**Laravel:** 7.x - 11.x (tested)
**No frontend framework dependencies** - Vanilla JavaScript, self-contained CSS

Dev dependencies: Pest, PHPStan/Larastan, Laravel Pint, Vite, ESLint, Prettier, Stylelint
