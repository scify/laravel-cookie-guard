<?php

namespace SciFY\LaravelCookiesConsent\Tests;

use Illuminate\Support\Facades\File;
use Orchestra\Testbench\TestCase as Orchestra;
use RuntimeException;
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
        $sourceDir = realpath(__DIR__ . '/../public');
        $targetDir = public_path('vendor/scify/laravel-cookie-guard');

        $requiredFiles = ['scripts.js', 'styles.css', '_variables.css'];

        // Verify source directory exists
        if (! $sourceDir || ! File::isDirectory($sourceDir)) {
            throw new RuntimeException(
                "Public assets source directory not found. Run 'npm run build' first. " .
                'Expected: ' . __DIR__ . '/../public'
            );
        }

        // Verify required files exist
        foreach ($requiredFiles as $file) {
            if (! File::exists($sourceDir . '/' . $file)) {
                throw new RuntimeException(
                    sprintf("Required asset '%s' not found in %s. Run 'npm run build' first.", $file, $sourceDir)
                );
            }
        }

        // Create target directory
        if (! File::exists($targetDir)) {
            File::makeDirectory($targetDir, 0755, true);
        }

        // Copy all files from package's public directory
        foreach (File::files($sourceDir) as $file) {
            File::copy($file->getPathname(), $targetDir . '/' . $file->getFilename());
        }
    }
}
