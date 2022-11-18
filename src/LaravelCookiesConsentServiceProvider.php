<?php

namespace SciFY\LaravelCookiesConsent;

use Illuminate\Support\Facades\Blade;
use Spatie\LaravelPackageTools\Package;
use Spatie\LaravelPackageTools\PackageServiceProvider;

class LaravelCookiesConsentServiceProvider extends PackageServiceProvider {

    public function configurePackage(Package $package): void {
        /*
         * This class is a Package Service Provider
         *
         * More info: https://github.com/spatie/laravel-package-tools
         */
        $package
            ->name('laravel-cookies-consent')
            ->hasConfigFile('cookies_consent');
    }

    public function boot() {

        $this->publishes([
            __DIR__ . '/../public' => public_path('vendor/cookies_consent'),
        ], 'laravel-assets');

        $this->publishes([
            __DIR__ . '/../resources/views/components/' => resource_path('views/vendor/cookies_consent/components'),
        ], 'cookies-consent-components');

        $this->publishes([
            __DIR__ . '/../config/cookies_consent.php' => config_path('cookies_consent.php'),
        ], 'cookies-consent-config');

        $version = intval(substr(app()->version(), 0, 1));
        $translations_publishing_path_relative = 'lang/vendor/cookies_consent';
        $translations_publishing_path = base_path($translations_publishing_path_relative);
        if ($version < 9) {
            $translations_publishing_path = resource_path($translations_publishing_path_relative);
        }
        $this->publishes([
            __DIR__ . '/../lang' => $translations_publishing_path,
        ], 'cookies-consent-translations');

        $this->loadViewsFrom(__DIR__ . '/../resources/views', 'cookies_consent');
        $this->loadRoutesFrom(__DIR__ . '/../routes/web.php');
        $this->loadTranslationsFrom(__DIR__ . '/../lang', 'cookies_consent');

        Blade::component('laravel-cookies-consent', \SciFY\LaravelCookiesConsent\View\Components\LaravelCookiesConsent::class);
        return parent::boot();
    }

}
