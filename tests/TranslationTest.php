<?php

use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\ServiceProvider;
use SciFY\LaravelCookiesConsent\LaravelCookiesConsentServiceProvider;

it('provides translations', function (): void {
    $this->assertTranslationExists('cookies_consent::messages.title');
    $this->assertTranslationExists('cookies_consent::messages.description');
});

it('publishes the translations to the cookies_consent namespace path', function (): void {
    $paths = ServiceProvider::pathsToPublish(
        LaravelCookiesConsentServiceProvider::class,
        'cookies-consent-translations',
    );

    expect(array_values($paths))->toBe([lang_path('vendor/cookies_consent')]);
});

it('overrides single keys from lang/vendor/cookies_consent and keeps the rest from the package', function (): void {
    $dir = lang_path('vendor/cookies_consent/en');
    File::ensureDirectoryExists($dir);
    File::put($dir . '/messages.php', "<?php return ['title' => 'Custom title'];");

    try {
        expect(__('cookies_consent::messages.title'))->toBe('Custom title')
            ->and(__('cookies_consent::messages.description'))->not->toBe('cookies_consent::messages.description');
    } finally {
        File::deleteDirectory(lang_path('vendor/cookies_consent'));
    }
});

it('still reads a legacy published directory and logs a deprecation warning', function (): void {
    $dir = lang_path('vendor/scify/laravel-cookie-guard/en');
    File::ensureDirectoryExists($dir);
    File::put($dir . '/messages.php', "<?php return ['title' => 'Legacy title'];");

    Log::spy();

    try {
        (new LaravelCookiesConsentServiceProvider($this->app))->boot();

        expect(__('cookies_consent::messages.title'))->toBe('Legacy title');
        Log::shouldHaveReceived('warning')
            ->once()
            ->withArgs(fn (string $message): bool => str_contains($message, 'lang/vendor/cookies_consent'));
    } finally {
        File::deleteDirectory(lang_path('vendor/scify'));
    }
});
