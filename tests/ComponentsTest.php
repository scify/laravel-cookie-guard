<?php

use Illuminate\Support\Facades\File;
use SciFY\LaravelCookiesConsent\LaravelCookiesConsentServiceProvider;

/**
 * One optional category with an external policy link, next to the required one.
 *
 * @return array<string, array<int, array<string, mixed>>>
 */
function twoCategories(?string $policyLink = null): array {
    return [
        'strictly_necessary' => [
            ['name' => 'my_app_cookies_consent', 'description' => 'cookies_consent::messages.cookie_cookies_consent_description', 'duration' => 'cookies_consent::messages.years', 'duration_count' => 1, 'policy_external_link' => null],
        ],
        'analytics' => [
            ['name' => '_ga', 'description' => 'Analytics cookie', 'duration' => 'cookies_consent::messages.years', 'duration_count' => 2, 'policy_external_link' => $policyLink],
        ],
    ];
}

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

it('renders plural cookie durations in every locale', function (): void {
    config(['cookies_consent.use_separate_page' => false]);
    config(['cookies_consent.cookies' => [
        'strictly_necessary' => [
            ['name' => 'a', 'description' => 'a', 'duration' => 'cookies_consent::messages.minutes', 'duration_count' => 2, 'policy_external_link' => null],
            ['name' => 'b', 'description' => 'b', 'duration' => 'cookies_consent::messages.hours', 'duration_count' => 2, 'policy_external_link' => null],
            ['name' => 'c', 'description' => 'c', 'duration' => 'cookies_consent::messages.days', 'duration_count' => 2, 'policy_external_link' => null],
            ['name' => 'd', 'description' => 'd', 'duration' => 'cookies_consent::messages.months', 'duration_count' => 2, 'policy_external_link' => null],
            ['name' => 'e', 'description' => 'e', 'duration' => 'cookies_consent::messages.years', 'duration_count' => 2, 'policy_external_link' => null],
        ],
    ]]);

    foreach (File::directories(__DIR__ . '/../lang') as $directory) {
        app()->setLocale(basename($directory));

        $view = $this->blade('<x-laravel-cookie-guard />');

        $view->assertDontSee('[2,', false);
    }
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

it('renders cookie category checkboxes with lcg- prefixed ids', function (): void {
    config(['cookies_consent.use_separate_page' => false]);
    config(['cookies_consent.cookies' => [
        'analytics' => [['name' => 'a', 'description' => 'a', 'duration' => 'cookies_consent::messages.days', 'duration_count' => 1, 'policy_external_link' => null]],
        'marketing' => [['name' => 'b', 'description' => 'b', 'duration' => 'cookies_consent::messages.days', 'duration_count' => 1, 'policy_external_link' => null]],
    ]]);

    $view = $this->blade('<x-laravel-cookie-guard />');

    $view->assertSee('id="lcg-analytics"', false);
    $view->assertSee('id="lcg-marketing"', false);
    $view->assertSee('for="lcg-analytics"', false);
    $view->assertSee('for="lcg-marketing"', false);
    $view->assertDontSee('id="analytics"', false);
    $view->assertDontSee('id="marketing"', false);
});

it('uses published view override when present', function (): void {
    $publishedDir = resource_path('views/vendor/scify/laravel-cookie-guard/components');
    File::makeDirectory($publishedDir, 0755, true, true);
    File::put($publishedDir . '/laravel-cookie-guard.blade.php', '<div id="custom-override">custom-published-view</div>');

    // The provider registers the published path only when it exists at boot time,
    // so boot it again as an application would after vendor:publish.
    view()->getFinder()->flush();
    view()->getFinder()->replaceNamespace('cookies_consent', []);
    (new LaravelCookiesConsentServiceProvider($this->app))->boot();

    $view = $this->blade('<x-laravel-cookie-guard />');

    File::deleteDirectory(resource_path('views/vendor'));

    $view->assertSee('custom-published-view', false);
    $view->assertDontSee('scify-cookies-consent-banner', false);
});

it('keeps the package views when no override is published', function (): void {
    File::deleteDirectory(resource_path('views/vendor'));
    view()->getFinder()->flush();
    view()->getFinder()->replaceNamespace('cookies_consent', []);
    (new LaravelCookiesConsentServiceProvider($this->app))->boot();

    $this->blade('<x-laravel-cookie-guard />')
        ->assertSee('scify-cookies-consent-banner', false);
});

it('renders link to cookie policy page when separate page is enabled', function (): void {
    config(['cookies_consent.use_separate_page' => true]);
    config(['cookies_consent.cookie_policy_page_custom_url' => null]);

    $view = $this->blade('<x-laravel-cookie-guard />');

    $view->assertSee('cookie-policy', false);
});

it('renders the configured cookie lifetime for the JavaScript', function (): void {
    config(['cookies_consent.cookie_lifetime' => 180]);

    $this->blade('<x-laravel-cookie-guard />')
        ->assertSee('data-cookie-lifetime="180"', false);

    $this->blade('<x-laravel-cookie-guard-page />')
        ->assertSee('data-cookie-lifetime="180"', false);
});

it('renders the cookie categories and the required list on the banner root of both components', function (): void {
    config(['cookies_consent.cookies' => [
        'strictly_necessary' => [['name' => 'my_app_cookies_consent', 'description' => '', 'duration' => 'cookies_consent::messages.years', 'duration_count' => 1, 'policy_external_link' => null]],
        'analytics' => [
            ['name' => '_ga', 'description' => '', 'duration' => 'cookies_consent::messages.years', 'duration_count' => 2, 'policy_external_link' => null],
            ['name' => '_ga_ABC123', 'description' => '', 'duration' => 'cookies_consent::messages.years', 'duration_count' => 2, 'policy_external_link' => null],
        ],
    ]]);
    $categories = 'data-cookie-categories="{&quot;strictly_necessary&quot;:[&quot;my_app_cookies_consent&quot;],&quot;analytics&quot;:[&quot;_ga&quot;,&quot;_ga_ABC123&quot;]}"';
    $required = 'data-required-categories="[&quot;strictly_necessary&quot;]"';

    $this->blade('<x-laravel-cookie-guard />')
        ->assertSee($categories, false)
        ->assertSee($required, false)
        ->assertDontSee('data-cookie-names', false);

    $this->blade('<x-laravel-cookie-guard-page />')
        ->assertSee($categories, false)
        ->assertSee($required, false);
});

it('renders the cookie categories on the banner root in separate page mode, where no checkbox exists', function (): void {
    config(['cookies_consent.use_separate_page' => true]);

    $this->blade('<x-laravel-cookie-guard />')
        ->assertDontSee('class="form-check-input cookie-category"', false)
        ->assertSee('data-cookie-categories="{&quot;strictly_necessary&quot;:', false)
        ->assertSee('data-required-categories="[&quot;strictly_necessary&quot;]"', false);
});

it('renders the floating button without a key handler of its own', function (): void {
    config(['cookies_consent.display_floating_button' => true]);

    $view = $this->blade('<x-laravel-cookie-guard />');

    $view->assertSee('id="scify-cookie-consent-floating-button"', false)
        ->assertDontSee('onkeyup', false);
});

it('renders the csrf token on the banner root of both components', function (): void {
    $this->startSession();

    $this->blade('<x-laravel-cookie-guard />')
        ->assertSee('data-csrf-token="' . csrf_token() . '"', false);

    $this->blade('<x-laravel-cookie-guard-page />')
        ->assertSee('data-csrf-token="' . csrf_token() . '"', false);
});

it('renders the default heading levels h2 and h5', function (): void {
    config(['cookies_consent.use_separate_page' => false]);

    $this->blade('<x-laravel-cookie-guard />')
        ->assertSee('<h2 id="cookie-consent-title"', false)
        ->assertSee('<h5 class="accordion-header h5"', false);
});

it('renders required categories checked and disabled and optional ones unchecked', function (): void {
    config(['cookies_consent.use_separate_page' => false, 'cookies_consent.cookies' => twoCategories()]);

    $html = (string) $this->blade('<x-laravel-cookie-guard />');

    expect($html)->toMatch('/id="lcg-strictly_necessary"\s+checked disabled>/')
        ->and($html)->toMatch('/id="lcg-analytics"\s*>/')
        ->and($html)->toContain(__('cookies_consent::messages.always_active'));
});

it('opens only the strictly necessary category when categories are not collapsed by default', function (): void {
    config([
        'cookies_consent.use_separate_page' => false,
        'cookies_consent.categories_collapsed_by_default' => false,
        'cookies_consent.cookies' => twoCategories(),
    ]);

    $html = (string) $this->blade('<x-laravel-cookie-guard />');

    expect($html)->toMatch('/data-target="#collapse-strictly_necessary"\s+aria-expanded="true"/')
        ->and($html)->toContain('id="collapse-strictly_necessary"' . PHP_EOL . '                class="accordion-collapse show"')
        ->and($html)->toMatch('/data-target="#collapse-analytics"\s+aria-expanded="false"/')
        ->and($html)->toContain(__('cookies_consent::messages.read_less'));
});

it('collapses every category when categories are collapsed by default', function (): void {
    config([
        'cookies_consent.use_separate_page' => false,
        'cookies_consent.categories_collapsed_by_default' => true,
        'cookies_consent.cookies' => twoCategories(),
    ]);

    $html = (string) $this->blade('<x-laravel-cookie-guard />');

    expect($html)->not->toContain('aria-expanded="true"')
        ->and($html)->not->toContain('accordion-collapse show')
        ->and($html)->not->toContain(__('cookies_consent::messages.read_less'));
});

it('opens every category on the cookie policy page', function (): void {
    config(['cookies_consent.categories_collapsed_by_default' => true, 'cookies_consent.cookies' => twoCategories()]);

    $html = (string) $this->blade('<x-laravel-cookie-guard-page />');

    expect($html)->toMatch('/data-target="#collapse-strictly_necessary"\s+aria-expanded="true"/')
        ->and($html)->toMatch('/data-target="#collapse-analytics"\s+aria-expanded="true"/')
        ->and($html)->not->toContain('aria-expanded="false"');
});

it('renders the external policy link of a cookie only when configured', function (): void {
    config(['cookies_consent.use_separate_page' => false, 'cookies_consent.cookies' => twoCategories('https://policies.google.com/privacy')]);

    $this->blade('<x-laravel-cookie-guard />')
        ->assertSee('class="policy-link" href="https://policies.google.com/privacy"', false)
        ->assertSee('target="_blank"', false);

    config(['cookies_consent.cookies' => twoCategories(null)]);

    $this->blade('<x-laravel-cookie-guard />')
        ->assertDontSee('policy-link', false);
});

it('renders the cookie description and duration through the translator', function (): void {
    config(['cookies_consent.use_separate_page' => false, 'cookies_consent.cookies' => twoCategories()]);

    $this->blade('<x-laravel-cookie-guard />')
        ->assertSee(__('cookies_consent::messages.cookie_cookies_consent_description'), false)
        ->assertSee(trans_choice('cookies_consent::messages.years', 1), false)
        ->assertSee(trans_choice('cookies_consent::messages.years', 2), false);
});

it('defaults the duration count to one when it is not configured', function (): void {
    $cookies = twoCategories();
    unset($cookies['analytics'][0]['duration_count']);
    config(['cookies_consent.use_separate_page' => false, 'cookies_consent.cookies' => $cookies]);

    $this->blade('<x-laravel-cookie-guard />')
        ->assertSee(trans_choice('cookies_consent::messages.years', 1), false)
        ->assertDontSee(trans_choice('cookies_consent::messages.years', 2), false);
});

it('switches the dialog classes and the showModal flag with use_floating_modal', function (): void {
    config(['cookies_consent.use_floating_modal' => false]);

    $this->blade('<x-laravel-cookie-guard />')
        ->assertSee('data-use-show-modal="1"', false)
        ->assertSee('modal-base-dialog', false)
        ->assertDontSee('custom-dialog', false);

    config(['cookies_consent.use_floating_modal' => true]);

    $this->blade('<x-laravel-cookie-guard />')
        ->assertSee('data-use-show-modal=""', false)
        ->assertSee('custom-dialog', false)
        ->assertDontSee('modal-base-dialog', false);
});

it('renders the simple dialog without categories in separate page mode', function (): void {
    config(['cookies_consent.use_separate_page' => true]);

    $this->blade('<x-laravel-cookie-guard />')
        ->assertSee('separate-page-mode', false)
        ->assertSee('id="reject-optional-cookies"', false)
        ->assertSee('id="accept-all-cookies"', false)
        ->assertDontSee('cookie-categories-container', false)
        ->assertDontSee('id="customise-cookies"', false)
        ->assertDontSee('id="accept-selected-cookies"', false);
});

it('renders the categories and all four buttons in all-in-one mode', function (): void {
    config(['cookies_consent.use_separate_page' => false]);

    $html = (string) $this->blade('<x-laravel-cookie-guard />');

    expect($html)->toContain('id="cookie-categories-container" class="display-none"')
        ->and($html)->toContain('id="customise-cookies"')
        ->and($html)->toContain('id="reject-optional-cookies"')
        ->and($html)->toContain('id="accept-all-cookies"')
        ->and($html)->toMatch('/class="button-col[^"]*display-none">\s*<button[^>]*id="accept-selected-cookies"/')
        ->and($html)->not->toContain('separate-page-mode');
});

it('links to the configured custom cookie policy URL in separate page mode', function (): void {
    config([
        'cookies_consent.use_separate_page' => true,
        'cookies_consent.cookie_policy_page_custom_url' => 'https://example.org/privacy',
    ]);

    $this->blade('<x-laravel-cookie-guard />')
        ->assertSee('href="https://example.org/privacy"', false)
        ->assertDontSee('/cookie-policy/', false);
});

it('renders the request settings for the JavaScript on both components', function (): void {
    config(['cookies_consent.cookie_prefix' => 'test_', 'cookies_consent.hide_floating_button_on_mobile' => true]);
    app()->setLocale('de');

    foreach (['<x-laravel-cookie-guard />', '<x-laravel-cookie-guard-page />'] as $component) {
        $this->blade($component)
            ->assertSee('data-ajax-url="' . url('/guard-settings/save') . '"', false)
            ->assertSee('data-cookie-prefix="test_"', false)
            ->assertSee('data-hide-floating-button-on-mobile="1"', false);
    }

    $this->blade('<x-laravel-cookie-guard />')->assertSee('data-locale="de"', false);
});

it('marks the cookie policy page component for the JavaScript', function (): void {
    $this->blade('<x-laravel-cookie-guard-page />')
        ->assertSee('data-on-cookies-page="true"', false)
        ->assertSee('data-show-floating-button="false"', false)
        ->assertDontSee('<dialog', false);
});
