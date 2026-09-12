/**
 * Behaviour tests for scripts.js using jsdom.
 * Run with: node tests/scripts.behaviour.test.js
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { JSDOM } = require('jsdom');

const scriptPath = path.join(__dirname, '../public/scripts.js');
const scriptCode = fs.readFileSync(scriptPath, 'utf8');

// Compile once with the real filename so V8 coverage (c8) attributes executed
// lines to public/scripts.js and can remap them to resources/js/scripts.js via
// the Vite source map. window.eval() would report no coverage at all.
const compiledScript = new vm.Script(scriptCode, { filename: scriptPath });

/**
 * Execute the compiled bundle inside the given jsdom window.
 */
function runScript(dom) {
    compiledScript.runInContext(dom.getInternalVMContext());
}

let passed = 0;
let failed = 0;

function test(name, fn) {
    try {
        fn();
        console.log(`✓ ${name}`);
        passed++;
    } catch (e) {
        console.log(`✗ ${name}: ${e.message}`);
        failed++;
    }
}

const pending = [];

function asyncTest(name, fn) {
    pending.push(
        fn().then(
            () => {
                console.log(`✓ ${name}`);
                passed++;
            },
            (e) => {
                console.log(`✗ ${name}: ${e.message}`);
                failed++;
            },
        ),
    );
}

function assert(condition, message) {
    if (!condition) throw new Error(message || 'Assertion failed');
}

/**
 * jsdom does not implement HTMLDialogElement.showModal()/close().
 */
function stubDialog(dom) {
    const dialog = dom.window.document.querySelector('dialog');
    dialog.showModal = () => {};
    dialog.close = () => {};
}

/**
 * Resolve when jsdom fires its own DOMContentLoaded, so the bundle's
 * initialiser runs exactly once (a manual dispatch would run it twice).
 */
function whenReady(dom) {
    return new Promise((resolve) => dom.window.document.addEventListener('DOMContentLoaded', resolve));
}

/**
 * Resolve once the fetch().then().then() chain in handleCookieConsent has run.
 */
function flushPromises() {
    return new Promise((resolve) => setTimeout(resolve, 0));
}

/**
 * Build a fetch stub that responds like the controller: success, with the posted
 * selection echoed back as `data`. The posted body is kept in `captured.body`.
 */
function confirmingFetch(captured = {}) {
    return (url, options) => {
        captured.body = JSON.parse(options.body);
        return Promise.resolve({ json: () => Promise.resolve({ success: true, message: 'ok', data: captured.body }) });
    };
}

/**
 * Run the bundle in the given DOM, click Accept all and return the headers of the save request.
 */
function saveRequestHeaders(dom) {
    let capturedHeaders = null;
    dom.window.fetch = (url, options) => {
        capturedHeaders = options.headers;
        return Promise.resolve({ json: () => Promise.resolve({ success: false }) });
    };

    runScript(dom);
    dom.window.document.dispatchEvent(new dom.window.Event('DOMContentLoaded'));
    dom.window.document.getElementById('accept-all-cookies').click();

    assert(capturedHeaders !== null, 'fetch was not called');
    return capturedHeaders;
}

/**
 * Build a minimal DOM environment with the cookie banner and category checkboxes.
 * Returns the window object after executing the compiled script.
 */
function buildDOM(
    categories = ['strictly_necessary', 'analytics', 'marketing'],
    checkedIds = [],
    cookieLifetime = 365,
    cookieNames = {},
    requiredCategories = ['strictly_necessary'],
    separatePage = false,
) {
    // The banner in `use_separate_page` mode renders no checkboxes.
    const checkboxesHtml = separatePage ? '' : categories.map((cat) => {
        // The template renders required categories as `checked disabled`.
        const state = requiredCategories.includes(cat) ? 'checked disabled' : checkedIds.includes(cat) ? 'checked' : '';
        return `<input class="cookie-category" type="checkbox" id="lcg-${cat}" ${state}>`;
    }).join('\n');
    const attr = (value) => JSON.stringify(value).replace(/"/g, '&quot;');
    const declared = Object.fromEntries(categories.map((cat) => [cat, cookieNames[cat] || []]));

    const html = `<!DOCTYPE html>
<html>
<head></head>
<body>
  <div id="scify-cookies-consent-wrapper">
    <div id="scify-cookies-consent"
        data-show-floating-button="false"
        data-hide-floating-button-on-mobile="false"
        data-cookie-prefix=""
        data-cookie-lifetime="${cookieLifetime}"
        data-cookie-categories="${attr(declared)}"
        data-required-categories="${attr(requiredCategories)}"
        data-csrf-token="test-token"
        data-ajax-url="/guard-settings/save"
        data-locale="en"
        data-on-cookies-page="false"
        data-use-show-modal="false"
        style="display:none">
      <dialog></dialog>
      <div id="cookie-categories-container">
        ${checkboxesHtml}
      </div>
      <button id="accept-all-cookies">Accept All</button>
      <button id="reject-optional-cookies">Reject All</button>
      <button id="accept-selected-cookies">Save</button>
      <button id="customise-cookies">Customise</button>
    </div>
  </div>
</body>
</html>`;

    const dom = new JSDOM(html, {
        runScripts: 'dangerously',
        resources: 'usable',
        url: 'http://localhost',
    });

    // Inject and execute the compiled script in the jsdom window context
    runScript(dom);

    return dom.window;
}

// --- Tests ---

test('getConsentSettings: reject sets all optional categories to false', () => {
    // Simulate: analytics and marketing were previously accepted (checked)
    const dom = new JSDOM(
        buildDOM(['strictly_necessary', 'analytics', 'marketing'], ['strictly_necessary', 'analytics', 'marketing'])
            .document.documentElement.outerHTML,
        { runScripts: 'dangerously', url: 'http://localhost' },
    );

    let capturedConsent = null;
    dom.window.fetch = (url, options) => {
        capturedConsent = JSON.parse(options.body);
        return Promise.resolve({ json: () => Promise.resolve({ success: false }) });
    };

    runScript(dom);
    dom.window.document.dispatchEvent(new dom.window.Event('DOMContentLoaded'));
    dom.window.document.getElementById('reject-optional-cookies').click();

    assert(capturedConsent !== null, 'fetch was not called');
    assert(capturedConsent.strictly_necessary === true, 'strictly_necessary should be true');
    assert(capturedConsent.analytics === false, `analytics should be false, got ${capturedConsent.analytics}`);
    assert(capturedConsent.marketing === false, `marketing should be false, got ${capturedConsent.marketing}`);
});

test('getConsentSettings: accept all sets every category to true', () => {
    const dom = new JSDOM(
        buildDOM(['strictly_necessary', 'analytics', 'marketing'], []).document.documentElement.outerHTML,
        { runScripts: 'dangerously', url: 'http://localhost' },
    );

    let capturedConsent = null;
    dom.window.fetch = (url, options) => {
        capturedConsent = JSON.parse(options.body);
        return Promise.resolve({ json: () => Promise.resolve({ success: false }) });
    };

    runScript(dom);
    dom.window.document.dispatchEvent(new dom.window.Event('DOMContentLoaded'));
    dom.window.document.getElementById('accept-all-cookies').click();

    assert(capturedConsent !== null, 'fetch was not called');
    assert(capturedConsent.strictly_necessary === true, 'strictly_necessary should be true');
    assert(capturedConsent.analytics === true, 'analytics should be true');
    assert(capturedConsent.marketing === true, 'marketing should be true');
});

test('getConsentSettings: accept selected respects checkbox state', () => {
    // Only analytics is checked
    const dom = new JSDOM(
        buildDOM(['strictly_necessary', 'analytics', 'marketing'], ['analytics']).document.documentElement.outerHTML,
        { runScripts: 'dangerously', url: 'http://localhost' },
    );

    let capturedConsent = null;
    dom.window.fetch = (url, options) => {
        capturedConsent = JSON.parse(options.body);
        return Promise.resolve({ json: () => Promise.resolve({ success: false }) });
    };

    runScript(dom);
    dom.window.document.dispatchEvent(new dom.window.Event('DOMContentLoaded'));
    dom.window.document.getElementById('accept-selected-cookies').click();

    assert(capturedConsent !== null, 'fetch was not called');
    assert(capturedConsent.analytics === true, 'analytics should be true (was checked)');
    assert(capturedConsent.marketing === false, 'marketing should be false (was unchecked)');
});

test('consent keys are unprefixed category names (backwards compat)', () => {
    const dom = new JSDOM(
        buildDOM(['strictly_necessary', 'analytics'], []).document.documentElement.outerHTML,
        { runScripts: 'dangerously', url: 'http://localhost' },
    );

    let capturedConsent = null;
    dom.window.fetch = (url, options) => {
        capturedConsent = JSON.parse(options.body);
        return Promise.resolve({ json: () => Promise.resolve({ success: false }) });
    };

    runScript(dom);
    dom.window.document.dispatchEvent(new dom.window.Event('DOMContentLoaded'));
    dom.window.document.getElementById('accept-all-cookies').click();

    assert(!('lcg-analytics' in capturedConsent), 'consent keys must not contain lcg- prefix');
    assert('analytics' in capturedConsent, 'consent must have unprefixed key "analytics"');
});

asyncTest('consent cookie expires after the configured lifetime', async () => {
    const dom = new JSDOM(
        buildDOM(['strictly_necessary', 'analytics'], [], 180).document.documentElement.outerHTML,
        { runScripts: 'dangerously', url: 'http://localhost' },
    );
    dom.window.fetch = confirmingFetch();
    stubDialog(dom);

    runScript(dom);
    await whenReady(dom);
    dom.window.document.getElementById('accept-all-cookies').click();
    await flushPromises();

    const cookie = dom.cookieJar.getCookiesSync('http://localhost/').find((c) => c.key === 'cookies_consent');
    assert(cookie, 'cookies_consent cookie was not written');
    const days = Math.round((cookie.expires.getTime() - Date.now()) / 86400000);
    assert(days === 180, `expected the cookie to expire in 180 days, got ${days}`);
});

asyncTest('banner hides only after the server confirms the save', async () => {
    const dom = new JSDOM(
        buildDOM(['strictly_necessary', 'analytics'], []).document.documentElement.outerHTML,
        { runScripts: 'dangerously', url: 'http://localhost' },
    );
    dom.window.fetch = confirmingFetch();
    stubDialog(dom);

    runScript(dom);
    await whenReady(dom);
    const banner = dom.window.document.getElementById('scify-cookies-consent');
    assert(banner.style.display === 'block', 'banner should be visible before the click');

    dom.window.document.getElementById('accept-all-cookies').click();
    assert(banner.style.display === 'block', 'banner must stay visible until the server answers');
    await flushPromises();
    assert(banner.style.display === 'none', 'banner should hide after a successful save');
});

asyncTest('banner stays open and no cookie is written when the server does not confirm the save', async () => {
    const dom = new JSDOM(
        buildDOM(['strictly_necessary', 'analytics'], []).document.documentElement.outerHTML,
        { runScripts: 'dangerously', url: 'http://localhost' },
    );
    dom.window.fetch = () => Promise.resolve({ json: () => Promise.resolve({ message: 'The given data was invalid.' }) });
    stubDialog(dom);
    dom.window.console.error = () => {};

    runScript(dom);
    await whenReady(dom);
    dom.window.document.getElementById('accept-all-cookies').click();
    await flushPromises();

    const banner = dom.window.document.getElementById('scify-cookies-consent');
    assert(banner.style.display === 'block', `banner should stay visible, display is "${banner.style.display}"`);
    assert(!dom.window.document.cookie.includes('cookies_consent='), 'no consent cookie must be written');
});

asyncTest('banner stays open when the request fails', async () => {
    const dom = new JSDOM(
        buildDOM(['strictly_necessary', 'analytics'], []).document.documentElement.outerHTML,
        { runScripts: 'dangerously', url: 'http://localhost' },
    );
    dom.window.fetch = () => Promise.reject(new Error('network down'));
    stubDialog(dom);
    dom.window.console.error = () => {};

    runScript(dom);
    await whenReady(dom);
    dom.window.document.getElementById('accept-all-cookies').click();
    await flushPromises();

    const banner = dom.window.document.getElementById('scify-cookies-consent');
    assert(banner.style.display === 'block', `banner should stay visible, display is "${banner.style.display}"`);
});

test('save request asks for a JSON response', () => {
    const dom = new JSDOM(
        buildDOM(['strictly_necessary'], []).document.documentElement.outerHTML,
        { runScripts: 'dangerously', url: 'http://localhost' },
    );

    let capturedHeaders = null;
    dom.window.fetch = (url, options) => {
        capturedHeaders = options.headers;
        return Promise.resolve({ json: () => Promise.resolve({ success: false }) });
    };

    runScript(dom);
    dom.window.document.dispatchEvent(new dom.window.Event('DOMContentLoaded'));
    dom.window.document.getElementById('accept-all-cookies').click();

    assert(capturedHeaders !== null, 'fetch was not called');
    assert(capturedHeaders.Accept === 'application/json', `Accept header should be application/json, got ${capturedHeaders.Accept}`);
});

test('save request carries the csrf token from the banner root', () => {
    const dom = new JSDOM(
        buildDOM(['strictly_necessary'], []).document.documentElement.outerHTML,
        { runScripts: 'dangerously', url: 'http://localhost' },
    );

    const token = saveRequestHeaders(dom)['X-CSRF-TOKEN'];
    assert(token === 'test-token', `X-CSRF-TOKEN should be test-token, got ${token}`);
});

test('save request falls back to the csrf-token meta tag of published components', () => {
    const html = buildDOM(['strictly_necessary'], [])
        .document.documentElement.outerHTML.replace(' data-csrf-token="test-token"', '')
        .replace('<head></head>', '<head><meta name="csrf-token" content="meta-token"></head>');
    const dom = new JSDOM(html, { runScripts: 'dangerously', url: 'http://localhost' });

    const token = saveRequestHeaders(dom)['X-CSRF-TOKEN'];
    assert(token === 'meta-token', `X-CSRF-TOKEN should be meta-token, got ${token}`);
});

test('save request prefers the XSRF-TOKEN cookie Laravel refreshes on every response', () => {
    const dom = new JSDOM(
        buildDOM(['strictly_necessary'], []).document.documentElement.outerHTML,
        { runScripts: 'dangerously', url: 'http://localhost' },
    );
    // Laravel writes the encrypted token URL-encoded; the header carries it decoded.
    const encrypted = 'eyJpdiI6ImFiYyIsInZhbHVlIjoieHl6In0=';
    dom.window.document.cookie = 'XSRF-TOKEN=' + encodeURIComponent(encrypted) + '; path=/';

    const headers = saveRequestHeaders(dom);
    assert(headers['X-XSRF-TOKEN'] === encrypted, 'X-XSRF-TOKEN should carry the cookie value decoded');
    assert(!('X-CSRF-TOKEN' in headers), 'X-CSRF-TOKEN should not be sent when the cookie is present');
});

/**
 * A DOM with declared cookie names, a successful fetch stub and pre-existing cookies.
 * The URL has a registrable domain so parent-domain cookies can be set and erased.
 */
function buildEraseScenario(existingCookies) {
    const names = { strictly_necessary: ['my_app_cookies_consent'], analytics: ['_ga', '_ga_ABC123'], marketing: ['_fbp'] };
    const dom = new JSDOM(
        buildDOM(['strictly_necessary', 'analytics', 'marketing'], [], 365, names).document.documentElement.outerHTML,
        { runScripts: 'dangerously', url: 'http://app.example.org/' },
    );
    for (const cookie of existingCookies) dom.window.document.cookie = cookie;
    dom.window.fetch = confirmingFetch();
    stubDialog(dom);
    return dom;
}

function cookieNames(dom) {
    return dom.cookieJar.getCookiesSync('http://app.example.org/').map((c) => c.key);
}

asyncTest('rejecting all optional categories erases the cookies they declare', async () => {
    const dom = buildEraseScenario(['_ga=1; path=/', '_ga_ABC123=1; path=/', '_fbp=1; path=/']);
    runScript(dom);
    await whenReady(dom);

    dom.window.document.getElementById('reject-optional-cookies').click();
    await flushPromises();

    const names = cookieNames(dom);
    assert(!names.includes('_ga'), '_ga should be erased');
    assert(!names.includes('_ga_ABC123'), '_ga_ABC123 should be erased');
    assert(!names.includes('_fbp'), '_fbp should be erased');
});

asyncTest('erasing a rejected cookie also covers the parent domain', async () => {
    const dom = buildEraseScenario(['_ga=1; path=/; domain=.example.org']);
    runScript(dom);
    await whenReady(dom);
    assert(cookieNames(dom).includes('_ga'), 'precondition: the domain cookie should be set');

    dom.window.document.getElementById('reject-optional-cookies').click();
    await flushPromises();

    assert(!cookieNames(dom).includes('_ga'), '_ga on .example.org should be erased');
});

asyncTest('accepted and required categories keep their cookies', async () => {
    const dom = buildEraseScenario(['_ga=1; path=/', '_fbp=1; path=/', 'my_app_cookies_consent=old; path=/']);
    runScript(dom);
    await whenReady(dom);
    dom.window.document.getElementById('lcg-analytics').checked = true;

    dom.window.document.getElementById('accept-selected-cookies').click();
    await flushPromises();

    const names = cookieNames(dom);
    assert(names.includes('_ga'), '_ga (accepted analytics) should be kept');
    assert(!names.includes('_fbp'), '_fbp (rejected marketing) should be erased');
    assert(names.includes('my_app_cookies_consent'), 'the required category cookie should be kept');
});

asyncTest('rejecting optional categories keeps every required category and its cookies', async () => {
    const names = { strictly_necessary: ['laravel_session'], functional: ['lang_pref'], analytics: ['_ga'] };
    const required = ['strictly_necessary', 'functional'];
    const dom = new JSDOM(
        buildDOM(Object.keys(names), [], 365, names, required).document.documentElement.outerHTML,
        { runScripts: 'dangerously', url: 'http://app.example.org/' },
    );
    const existing = ['laravel_session=1; path=/', 'lang_pref=1; path=/', '_ga=1; path=/'];
    for (const cookie of existing) dom.window.document.cookie = cookie;
    const captured = {};
    dom.window.fetch = confirmingFetch(captured);
    stubDialog(dom);

    runScript(dom);
    await whenReady(dom);
    dom.window.document.getElementById('reject-optional-cookies').click();
    await flushPromises();

    assert(captured.body.functional === true, 'functional is required and should be sent as true');
    assert(captured.body.analytics === false, 'analytics is optional and should be rejected');
    const kept = cookieNames(dom);
    assert(kept.includes('lang_pref'), 'lang_pref (required functional) should be kept');
    assert(kept.includes('laravel_session'), 'laravel_session (required strictly_necessary) should be kept');
    assert(!kept.includes('_ga'), '_ga (rejected analytics) should be erased');
});

asyncTest('consent cookie stores the selection the server confirmed', async () => {
    const dom = new JSDOM(
        buildDOM(['strictly_necessary', 'analytics'], []).document.documentElement.outerHTML,
        { runScripts: 'dangerously', url: 'http://localhost' },
    );
    // The server drops a category it does not know and forces the required one to true.
    const confirmed = { strictly_necessary: true, locale: 'en' };
    dom.window.fetch = () =>
        Promise.resolve({ json: () => Promise.resolve({ success: true, message: 'ok', data: confirmed }) });
    stubDialog(dom);

    runScript(dom);
    await whenReady(dom);
    dom.window.document.getElementById('accept-all-cookies').click();
    await flushPromises();

    const cookie = dom.cookieJar.getCookiesSync('http://localhost/').find((c) => c.key === 'cookies_consent');
    assert(cookie, 'cookies_consent cookie was not written');
    const stored = decodeURIComponent(cookie.value);
    assert(stored === JSON.stringify(confirmed), `cookie should hold the confirmed selection, got ${stored}`);
});


// --- Separate-page mode: the banner has no checkboxes, the root attributes drive the consent ---

function buildSeparatePageScenario(existingCookies = []) {
    const names = { strictly_necessary: ['my_app_cookies_consent'], analytics: ['_ga'], marketing: ['_fbp'] };
    const dom = new JSDOM(
        buildDOM(Object.keys(names), [], 365, names, ['strictly_necessary'], true).document.documentElement.outerHTML,
        { runScripts: 'dangerously', url: 'http://app.example.org/' },
    );
    for (const cookie of existingCookies) dom.window.document.cookie = cookie;
    stubDialog(dom);
    return dom;
}

asyncTest('separate-page banner: accept all consents to every configured category', async () => {
    const dom = buildSeparatePageScenario();
    const captured = {};
    dom.window.fetch = confirmingFetch(captured);
    runScript(dom);
    await whenReady(dom);
    assert(dom.window.document.querySelector('.cookie-category') === null, 'precondition: no checkboxes');

    dom.window.document.getElementById('accept-all-cookies').click();
    await flushPromises();

    assert(captured.body.strictly_necessary === true, 'strictly_necessary should be true');
    assert(captured.body.analytics === true, `analytics should be true, got ${captured.body.analytics}`);
    assert(captured.body.marketing === true, `marketing should be true, got ${captured.body.marketing}`);
});

asyncTest('separate-page banner: reject optional rejects every optional category and erases its cookies', async () => {
    const dom = buildSeparatePageScenario(['_ga=1; path=/', '_fbp=1; path=/', 'my_app_cookies_consent=old; path=/']);
    const captured = {};
    dom.window.fetch = confirmingFetch(captured);
    runScript(dom);
    await whenReady(dom);

    dom.window.document.getElementById('reject-optional-cookies').click();
    await flushPromises();

    assert(captured.body.strictly_necessary === true, 'strictly_necessary should be true');
    assert(captured.body.analytics === false, 'analytics should be false');
    assert(captured.body.marketing === false, 'marketing should be false');
    const kept = cookieNames(dom);
    assert(!kept.includes('_ga'), '_ga should be erased');
    assert(!kept.includes('_fbp'), '_fbp should be erased');
    assert(kept.includes('my_app_cookies_consent'), 'the required category cookie should be kept');
});

test('published components without the root attributes still read the checkboxes', () => {
    const dom = new JSDOM(
        buildDOM(['strictly_necessary', 'analytics', 'marketing'], ['analytics']).document.documentElement.outerHTML,
        { runScripts: 'dangerously', url: 'http://localhost' },
    );
    const root = dom.window.document.getElementById('scify-cookies-consent');
    root.removeAttribute('data-cookie-categories');
    root.removeAttribute('data-required-categories');
    const captured = {};
    dom.window.fetch = confirmingFetch(captured);

    runScript(dom);
    dom.window.document.dispatchEvent(new dom.window.Event('DOMContentLoaded'));
    dom.window.document.getElementById('accept-selected-cookies').click();

    assert(captured.body.strictly_necessary === true, 'disabled checkbox marks the category required');
    assert(captured.body.analytics === true, 'checked analytics should be true');
    assert(captured.body.marketing === false, 'unchecked marketing should be false');
});

asyncTest('consent cookie is written with SameSite=Lax', async () => {
    const dom = new JSDOM(
        buildDOM(['strictly_necessary', 'analytics'], []).document.documentElement.outerHTML,
        { runScripts: 'dangerously', url: 'http://localhost' },
    );
    dom.window.fetch = confirmingFetch();
    stubDialog(dom);

    runScript(dom);
    await whenReady(dom);
    dom.window.document.getElementById('accept-all-cookies').click();
    await flushPromises();

    const cookie = dom.cookieJar.getCookiesSync('http://localhost/').find((c) => c.key === 'cookies_consent');
    assert(cookie, 'cookies_consent cookie was not written');
    assert(cookie.sameSite === 'lax', `SameSite should be lax, got ${cookie.sameSite}`);
    assert(cookie.secure === false, 'Secure must not be set on an http page');
});

Promise.all(pending).then(() => {
    console.log(`\n${passed} passed, ${failed} failed`);
    process.exit(failed > 0 ? 1 : 0);
});
