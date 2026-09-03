<?php

use Illuminate\Support\Facades\Cookie;

it('saves cookie consent selection and returns success JSON response', function (): void {
    $response = $this->postJson('/guard-settings/save', [
        'strictly_necessary' => true,
        'marketing' => false,
        'locale' => 'en',
    ]);

    $response->assertOk()
        ->assertJson([
            'success' => true,
            'message' => 'Cookies consent selection saved',
        ])
        ->assertJsonStructure([
            'success',
            'message',
            'data',
        ]);
});

it('includes submitted data in the response', function (): void {
    $consentData = [
        'strictly_necessary' => true,
        'marketing' => true,
        'targeting' => false,
        'locale' => 'en',
    ];

    $response = $this->postJson('/guard-settings/save', $consentData);

    $response->assertOk()
        ->assertJsonFragment([
            'data' => $consentData,
        ]);
});

it('queues a cookie with the configured prefix', function (): void {
    Cookie::spy();

    $this->postJson('/guard-settings/save', [
        'strictly_necessary' => true,
        'locale' => 'en',
    ]);

    Cookie::shouldHaveReceived('queue')
        ->once()
        ->withArgs(function ($name, $value, $minutes): bool {
            $prefix = config('cookies_consent.cookie_prefix');
            $expectedName = $prefix . 'cookies_consent_selection';
            $expectedMinutes = 1440 * config('cookies_consent.cookie_lifetime');

            return $name === $expectedName
                && $minutes === $expectedMinutes
                && str_contains($value, 'strictly_necessary');
        });
});

it('returns localized message for German locale', function (): void {
    $response = $this->postJson('/guard-settings/save', [
        'strictly_necessary' => true,
        'locale' => 'de',
    ]);

    $expectedMessage = __('cookies_consent::messages.selection_saved_message', [], 'de');

    $response->assertOk()
        ->assertJsonFragment([
            'message' => $expectedMessage,
        ]);
});

it('returns localized message for French locale', function (): void {
    $response = $this->postJson('/guard-settings/save', [
        'strictly_necessary' => true,
        'locale' => 'fr',
    ]);

    $expectedMessage = __('cookies_consent::messages.selection_saved_message', [], 'fr');

    $response->assertOk()
        ->assertJsonFragment([
            'message' => $expectedMessage,
        ]);
});

it('handles empty consent data', function (): void {
    $response = $this->postJson('/guard-settings/save', [
        'locale' => 'en',
    ]);

    $response->assertOk()
        ->assertJson([
            'success' => true,
        ]);
});

it('renders the cookie policy page', function (): void {
    $response = $this->get('/cookie-policy/en');

    $response->assertOk();
});

it('renders the cookie policy page with different locales', function (): void {
    $locales = ['en', 'de', 'fr', 'es', 'el'];

    foreach ($locales as $locale) {
        $response = $this->get('/cookie-policy/' . $locale);
        $response->assertOk();
    }
});

it('sets the application locale from route parameter', function (): void {
    $this->get('/cookie-policy/de');

    expect(app()->getLocale())->toBe('de');
});

it('falls back to the application locale when the submitted locale is not a valid identifier', function (): void {
    app()->setLocale('en');

    $response = $this->postJson('/guard-settings/save', [
        'strictly_necessary' => true,
        'locale' => '../../../../etc/passwd',
    ]);

    $response->assertOk()
        ->assertJson([
            'success' => true,
            'message' => 'Cookies consent selection saved',
        ]);
});

it('rejects path separators in the cookie policy locale', function (): void {
    $this->get('/cookie-policy/..%5C..%5Cetc')->assertNotFound();
    $this->get('/cookie-policy/en%2F..%2F..%2Fetc')->assertNotFound();
});

it('accepts region-qualified locales', function (): void {
    $this->get('/cookie-policy/pt-br')->assertOk();

    $this->postJson('/guard-settings/save', ['strictly_necessary' => true, 'locale' => 'pt-br'])
        ->assertOk()
        ->assertJson(['message' => __('cookies_consent::messages.selection_saved_message', [], 'pt-br')]);
});
