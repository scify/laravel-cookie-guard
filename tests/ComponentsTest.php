<?php

it('renders the main cookie guard component', function (): void {
    $view = $this->blade('<x-laravel-cookie-guard />');

    $view->assertSee('scify-cookies-consent-banner', false);
    $view->assertSee(__('cookies_consent::messages.title'), false);
});

it('renders the cookie guard component with dialog element', function (): void {
    $view = $this->blade('<x-laravel-cookie-guard />');

    $view->assertSee('<dialog', false);
    $view->assertSee('</dialog>', false);
});

it('renders accept all button', function (): void {
    $view = $this->blade('<x-laravel-cookie-guard />');

    $view->assertSee(__('cookies_consent::messages.accept_all_btn'), false);
});

it('renders reject all button', function (): void {
    $view = $this->blade('<x-laravel-cookie-guard />');

    $view->assertSee(__('cookies_consent::messages.reject_optional_btn'), false);
});

it('renders with custom heading level', function (): void {
    $view = $this->blade('<x-laravel-cookie-guard heading="h3" />');

    $view->assertSee('<h3', false);
});

it('renders with custom accordion heading level', function (): void {
    config(['cookies_consent.use_separate_page' => false]);

    $view = $this->blade('<x-laravel-cookie-guard accordion-heading="h6" />');

    $view->assertSee('<h6', false);
});

it('renders the floating button when enabled', function (): void {
    config(['cookies_consent.display_floating_button' => true]);

    $view = $this->blade('<x-laravel-cookie-guard />');

    $view->assertSee('scify-cookie-consent-floating-button', false);
});

it('does not render the floating button when disabled', function (): void {
    config(['cookies_consent.display_floating_button' => false]);

    $view = $this->blade('<x-laravel-cookie-guard />');

    $view->assertDontSee('scify-cookie-consent-floating-button', false);
});

it('renders the scripts component with CSS assets', function (): void {
    $view = $this->blade('<x-laravel-cookie-guard-scripts />');

    $view->assertSee('laravel-cookie-guard/styles.css', false);
    $view->assertSee('laravel-cookie-guard/_variables.css', false);
});

it('renders the scripts component with JavaScript assets', function (): void {
    $view = $this->blade('<x-laravel-cookie-guard-scripts />');

    $view->assertSee('laravel-cookie-guard/scripts.js', false);
});

it('renders the scripts component with translation variables', function (): void {
    $view = $this->blade('<x-laravel-cookie-guard-scripts />');

    $view->assertSee('window.cookies_consent_translations', false);
    $view->assertSee('read_more', false);
    $view->assertSee('read_less', false);
});

it('renders cookie categories from config', function (): void {
    config(['cookies_consent.use_separate_page' => false]);
    config(['cookies_consent.cookies' => [
        'strictly_necessary' => [
            [
                'name' => 'test_cookie',
                'description' => 'Test description',
                'duration' => 'cookies_consent::messages.days',
                'duration_count' => 30,
                'policy_external_link' => null,
            ],
        ],
    ]]);

    $view = $this->blade('<x-laravel-cookie-guard />');

    $view->assertSee('strictly_necessary', false);
    $view->assertSee('test_cookie', false);
});

it('renders the cookie policy page component', function (): void {
    $view = $this->blade('<x-laravel-cookie-guard-page />');

    $view->assertSee(__('cookies_consent::messages.cookie_policy_title'), false);
    $view->assertSee(__('cookies_consent::messages.what_are_cookies_title'), false);
});

it('renders cookie policy page with use of cookies section', function (): void {
    $view = $this->blade('<x-laravel-cookie-guard-page />');

    $view->assertSee(__('cookies_consent::messages.use_of_cookies_title'), false);
    $view->assertSee(__('cookies_consent::messages.cookies_used_title'), false);
});

it('renders required category as always active', function (): void {
    config(['cookies_consent.use_separate_page' => false]);
    config(['cookies_consent.required' => ['strictly_necessary']]);

    $view = $this->blade('<x-laravel-cookie-guard />');

    $view->assertSee(__('cookies_consent::messages.always_active'), false);
});

it('renders customise button in default mode', function (): void {
    config(['cookies_consent.use_separate_page' => false]);

    $view = $this->blade('<x-laravel-cookie-guard />');

    $view->assertSee(__('cookies_consent::messages.customise_btn'), false);
});

it('renders link to cookie policy page when separate page is enabled', function (): void {
    config(['cookies_consent.use_separate_page' => true]);
    config(['cookies_consent.cookie_policy_page_custom_url' => null]);

    $view = $this->blade('<x-laravel-cookie-guard />');

    $view->assertSee('cookie-policy', false);
});
