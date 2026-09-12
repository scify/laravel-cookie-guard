<?php

use Illuminate\Routing\Router;

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
    config(['cookies_consent.cookies' => [
        'strictly_necessary' => [],
        'marketing' => [],
        'targeting' => [],
    ]]);

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

it('registers the package routes inside the web middleware group', function (): void {
    $saveRoute = resolve(Router::class)->getRoutes()->getByAction('SciFY\LaravelCookiesConsent\Http\Controllers\CookiesController@save_cookies_consent_selection');

    expect($saveRoute)->not->toBeNull()
        ->and($saveRoute->gatherMiddleware())->toContain('web');
});

it('does not set a server-side consent cookie', function (): void {
    config(['cookies_consent.cookie_prefix' => 'my_app_']);

    $this->postJson('/guard-settings/save', ['strictly_necessary' => true, 'locale' => 'en'])
        ->assertOk()
        ->assertCookieMissing('my_app_cookies_consent_selection');
});

it('drops keys that are not configured cookie categories', function (): void {
    $response = $this->postJson('/guard-settings/save', [
        'strictly_necessary' => true,
        'not_a_category' => true,
        'locale' => 'en',
    ]);

    $response->assertOk()
        ->assertJsonPath('data.strictly_necessary', true)
        ->assertJsonMissingPath('data.not_a_category');
});

it('rejects a category value that is not a boolean', function (): void {
    $this->postJson('/guard-settings/save', [
        'strictly_necessary' => 'yes please',
        'locale' => 'en',
    ])->assertUnprocessable();
});

it('forces required categories to true', function (): void {
    $response = $this->postJson('/guard-settings/save', [
        'strictly_necessary' => false,
        'locale' => 'en',
    ]);

    $response->assertOk()
        ->assertJsonPath('data.strictly_necessary', true);
});
