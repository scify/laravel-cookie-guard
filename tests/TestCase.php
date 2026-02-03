<?php

namespace SciFY\LaravelCookiesConsent\Tests;

use Illuminate\Support\Facades\File;
use Orchestra\Testbench\TestCase as Orchestra;
use SciFY\LaravelCookiesConsent\LaravelCookiesConsentServiceProvider;

class TestCase extends Orchestra {
    protected function setUp(): void {
        parent::setUp();

        $this->setUpPublicAssets();
    }

    protected function getPackageProviders($app): array {
        return [
            LaravelCookiesConsentServiceProvider::class,
        ];
    }

    public function assertTranslationExists(string $key): void {
        $this->assertTrue(trans($key) != $key, sprintf('Failed to assert that a translation exists for key `%s`', $key));
    }

    /**
     * Copy public assets to Testbench's public directory for tests that render views with asset references.
     */
    protected function setUpPublicAssets(): void {
        $sourceDir = __DIR__ . '/../public';
        $targetDir = public_path('vendor/scify/laravel-cookie-guard');

        if (! File::exists($targetDir)) {
            File::makeDirectory($targetDir, 0755, true);
        }

        // Copy all files from package's public directory
        if (File::exists($sourceDir)) {
            foreach (File::files($sourceDir) as $file) {
                File::copy($file->getPathname(), $targetDir . '/' . $file->getFilename());
            }
        }
    }
}
