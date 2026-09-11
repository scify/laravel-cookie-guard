<?php

namespace SciFY\LaravelCookiesConsent;

use Illuminate\Support\Facades\Blade;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\ServiceProvider;
use Illuminate\Translation\TranslationServiceProvider;
use SciFY\LaravelCookiesConsent\View\Components\LaravelCookiesConsent;
use SciFY\LaravelCookiesConsent\View\Components\LaravelCookiesConsentPage;
use SciFY\LaravelCookiesConsent\View\Components\LaravelCookiesConsentScripts;

class LaravelCookiesConsentServiceProvider extends ServiceProvider {
    public function boot(): void {
        $this->loadTranslationsFrom($this->translationsPath(), 'cookies_consent');

        $viewPaths = [__DIR__ . '/../resources/views'];
        $publishedViewPath = resource_path('views/vendor/scify/laravel-cookie-guard');

        if (is_dir($publishedViewPath)) {
            array_unshift($viewPaths, $publishedViewPath);
        }

        $this->loadViewsFrom($viewPaths, 'cookies_consent');

        $this->publishes([
            __DIR__ . '/../resources/views/components/' => resource_path('views/vendor/scify/laravel-cookie-guard/components'),
        ], 'cookies-consent-components');

        $this->publishes([
            __DIR__ . '/../public' => public_path('vendor/scify/laravel-cookie-guard'),
        ], 'cookies-consent-public');

        $this->publishes([
            __DIR__ . '/../config/cookies_consent.php' => config_path('cookies_consent.php'),
        ], 'cookies-consent-config');

        $this->publishes([
            __DIR__ . '/../lang' => $this->app->langPath('vendor/cookies_consent'),
        ], 'cookies-consent-translations');

        $this->loadRoutesFrom(__DIR__ . '/../routes/web.php');

        Blade::component('laravel-cookie-guard', LaravelCookiesConsent::class);
        Blade::component('laravel-cookie-guard-page', LaravelCookiesConsentPage::class);
        Blade::component('laravel-cookie-guard-scripts', LaravelCookiesConsentScripts::class);
    }

    /**
     * Translations are published to lang/vendor/cookies_consent, where Laravel merges
     * them over the package files key by key. Translations published before v5.1 live
     * under lang/vendor/scify/laravel-cookie-guard and replace the package files
     * entirely; that path is still honoured, with a warning, until v6.
     */
    private function translationsPath(): string {
        $legacyPaths = [
            resource_path('lang/vendor/scify/laravel-cookie-guard'),
            $this->app->langPath('vendor/scify/laravel-cookie-guard'),
        ];

        foreach ($legacyPaths as $legacyPath) {
            if (is_dir($legacyPath)) {
                Log::warning(sprintf(
                    'laravel-cookie-guard: translations published to %s replace the package files and will no longer be read in v6. Move the strings you changed to %s and delete the rest.',
                    $legacyPath,
                    $this->app->langPath('vendor/cookies_consent'),
                ));

                return $legacyPath;
            }
        }

        return __DIR__ . '/../lang';
    }

    public function register(): void {
        // Ensure the translation service is registered
        $this->app->register(TranslationServiceProvider::class);
        $this->mergeConfigFrom(
            __DIR__ . '/../config/cookies_consent.php', 'cookies_consent'
        );
    }
}
