/**
 * Behaviour tests for scripts.js using jsdom.
 * Run with: node --test tests/
 */

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { JSDOM } = require('jsdom');

const scriptPath = path.join(__dirname, '../public/scripts.js');
const scriptCode = fs.readFileSync(scriptPath, 'utf8');

// Compile once with the real filename so V8 coverage (c8) attributes executed
// lines to public/scripts.js and can remap them to resources/js/scripts.js via
// the Vite source map. window.eval() would report no coverage at all.
const compiledScript = new vm.Script(scriptCode, { filename: scriptPath });

const SAVE_URL = '/guard-settings/save';

/**
 * Execute the compiled bundle inside the given jsdom window.
 */
function runScript(dom) {
    compiledScript.runInContext(dom.getInternalVMContext());
}

/**
 * Resolve when jsdom fires its own DOMContentLoaded, so the bundle's
 * initialiser runs exactly once (a manual dispatch would run it twice).
 */
function whenReady(dom) {
    return new Promise((resolve) => dom.window.document.addEventListener('DOMContentLoaded', resolve));
}

/**
 * Run the bundle in the DOM and wait for its DOMContentLoaded initialiser.
 */
async function boot(dom) {
    runScript(dom);
    await whenReady(dom);
    return dom;
}

/**
 * Resolve once the fetch().then().then() chain in handleCookieConsent has run.
 */
function flushPromises() {
    return new Promise((resolve) => setTimeout(resolve, 0));
}

/**
 * jsdom does not implement HTMLDialogElement.showModal()/close().
 * Returns the list of calls made to either method.
 */
function stubDialog(dom) {
    const calls = [];
    const dialog = dom.window.document.querySelector('dialog');
    if (dialog) {
        dialog.showModal = () => calls.push('showModal');
        dialog.close = () => calls.push('close');
    }
    return calls;
}

/**
 * Replace the window's setTimeout with a manual clock, so timer-driven
 * behaviour can be asserted without waiting.
 */
function fakeTimers(dom) {
    let now = 0;
    const queue = [];
    dom.window.setTimeout = (fn, ms = 0) => {
        queue.push({ fn, at: now + ms, done: false });
        return queue.length;
    };
    return {
        advance(ms) {
            now += ms;
            queue
                .filter((timer) => !timer.done && timer.at <= now)
                .sort((a, b) => a.at - b.at)
                .forEach((timer) => {
                    timer.done = true;
                    timer.fn();
                });
        },
    };
}

/**
 * Build a fetch stub that responds like the controller: success, with the posted
 * selection echoed back as `data`. The request is kept in `captured`.
 */
function confirmingFetch(captured = {}) {
    return (url, options) => {
        captured.url = url;
        captured.options = options;
        captured.body = JSON.parse(options.body);
        return Promise.resolve({ json: () => Promise.resolve({ success: true, message: 'ok', data: captured.body }) });
    };
}

/**
 * Build a fetch stub that never confirms the save. The request is kept in `captured`.
 */
function rejectingFetch(captured = {}) {
    return (url, options) => {
        captured.url = url;
        captured.options = options;
        captured.body = JSON.parse(options.body);
        return Promise.resolve({ json: () => Promise.resolve({ success: false }) });
    };
}

function cookieNames(dom, url = 'http://localhost/') {
    return dom.cookieJar.getCookiesSync(url).map((c) => c.key);
}

function consentCookie(dom, url = 'http://localhost/') {
    return dom.cookieJar.getCookiesSync(url).find((c) => c.key === 'cookies_consent');
}

function banner(dom) {
    return dom.window.document.getElementById('scify-cookies-consent');
}

function floatingButton(dom) {
    return dom.window.document.getElementById('scify-cookie-consent-floating-button');
}

function click(dom, id) {
    dom.window.document.getElementById(id).click();
}

/**
 * Build a jsdom document that mirrors the markup of the Blade components.
 * The bundle is not executed; call boot(dom) after stubbing fetch, timers, etc.
 *
 * @param {object} options
 * @param {string[]} options.categories       category keys rendered as checkboxes
 * @param {string[]} options.checked          optional categories rendered checked
 * @param {string[]} options.required         categories rendered `checked disabled`
 * @param {object}   options.names            category -> declared cookie names (data-cookie-categories)
 * @param {number}   options.lifetime         data-cookie-lifetime
 * @param {boolean}  options.separatePage     use_separate_page banner: no checkboxes, no customise button
 * @param {boolean}  options.floatingButton   render the floating button and data-show-floating-button="true"
 * @param {boolean}  options.hideOnMobile     data-hide-floating-button-on-mobile
 * @param {boolean}  options.useShowModal     data-use-show-modal
 * @param {boolean}  options.onCookiesPage    the policy page component: no dialog, data-on-cookies-page="true"
 * @param {boolean}  options.accordion        render the accordion markup for each category
 * @param {string|null} options.csrfToken     data-csrf-token, null to omit the attribute
 * @param {string}   options.head             extra markup for <head>
 * @param {string}   options.extraHtml        extra markup after the banner
 * @param {string}   options.url              document URL
 */
function buildDOM({
    categories = ['strictly_necessary', 'analytics', 'marketing'],
    checked = [],
    required = ['strictly_necessary'],
    names = {},
    lifetime = 365,
    separatePage = false,
    floatingButton = false,
    hideOnMobile = false,
    useShowModal = false,
    onCookiesPage = false,
    accordion = false,
    csrfToken = 'test-token',
    head = '',
    extraHtml = '',
    url = 'http://localhost',
} = {}) {
    const attr = (value) => JSON.stringify(value).replace(/"/g, '&quot;');
    const declared = Object.fromEntries(categories.map((cat) => [cat, names[cat] || []]));

    const categoriesHtml = separatePage
        ? ''
        : categories
              .map((cat) => {
                  // The template renders required categories as `checked disabled`.
                  const state = required.includes(cat) ? 'checked disabled' : checked.includes(cat) ? 'checked' : '';
                  const accordionHtml = accordion
                      ? `<div class="accordion-item">
                <h5 class="accordion-header"><button class="accordion-button collapsed" type="button"
                    data-target="#collapse-${cat}" aria-controls="collapse-${cat}">Read more</button></h5>
                <div id="collapse-${cat}" class="accordion-collapse"></div>
              </div>`
                      : '';
                  return `<input class="cookie-category" type="checkbox" id="lcg-${cat}" ${state}>${accordionHtml}`;
              })
              .join('\n');

    const buttonsHtml = separatePage
        ? `<div class="button-col"><button id="reject-optional-cookies">Reject</button></div>
           <div class="button-col"><button id="accept-all-cookies">Accept All</button></div>`
        : `<div class="button-col"><button id="customise-cookies">Customise</button></div>
           <div class="button-col display-none"><button id="accept-selected-cookies">Save</button></div>
           <div class="button-col"><button id="reject-optional-cookies">Reject</button></div>
           <div class="button-col"><button id="accept-all-cookies">Accept All</button></div>`;

    const html = `<!DOCTYPE html>
<html>
<head>${head}</head>
<body>
  <div id="scify-cookies-consent-wrapper">
    <div id="scify-cookies-consent"
        data-ajax-url="${SAVE_URL}"
        data-show-floating-button="${floatingButton}"
        data-hide-floating-button-on-mobile="${hideOnMobile}"
        data-cookie-prefix=""
        data-cookie-lifetime="${lifetime}"
        data-cookie-categories="${attr(declared)}"
        data-required-categories="${attr(required)}"
        ${csrfToken === null ? '' : `data-csrf-token="${csrfToken}"`}
        data-locale="en"
        data-on-cookies-page="${onCookiesPage}"
        data-use-show-modal="${useShowModal}"
        style="display:none">
      ${onCookiesPage ? '' : '<dialog>'}
      <div id="cookie-categories-container" class="${separatePage ? '' : 'display-none'}">
        ${categoriesHtml}
      </div>
      ${buttonsHtml}
      ${onCookiesPage ? '' : '</dialog>'}
    </div>
  </div>
  ${floatingButton ? '<button id="scify-cookie-consent-floating-button" style="display: none;" onclick="toggleCookieBanner()">Cookies</button>' : ''}
  ${extraHtml}
</body>
</html>`;

    return new JSDOM(html, { runScripts: 'dangerously', url });
}

/**
 * A stored consent for the default categories: analytics accepted, marketing rejected.
 */
function storedConsent(dom, consent = { strictly_necessary: true, analytics: true, marketing: false, locale: 'en' }) {
    dom.window.document.cookie = 'cookies_consent=' + encodeURIComponent(JSON.stringify(consent)) + '; path=/';
    return consent;
}

// --- Building the consent selection ---

test('reject optional sends false for every optional category and true for the required one', async () => {
    const dom = buildDOM({ checked: ['analytics', 'marketing'] });
    const captured = {};
    dom.window.fetch = rejectingFetch(captured);
    await boot(dom);

    click(dom, 'reject-optional-cookies');

    assert.equal(captured.body.strictly_necessary, true);
    assert.equal(captured.body.analytics, false);
    assert.equal(captured.body.marketing, false);
});

test('accept all sends true for every category', async () => {
    const dom = buildDOM();
    const captured = {};
    dom.window.fetch = rejectingFetch(captured);
    await boot(dom);

    click(dom, 'accept-all-cookies');

    assert.deepEqual(captured.body, { strictly_necessary: true, analytics: true, marketing: true, locale: 'en' });
});

test('accept selected sends the checkbox state of each optional category', async () => {
    const dom = buildDOM({ checked: ['analytics'] });
    const captured = {};
    dom.window.fetch = rejectingFetch(captured);
    await boot(dom);

    click(dom, 'accept-selected-cookies');

    assert.equal(captured.body.strictly_necessary, true);
    assert.equal(captured.body.analytics, true, 'checked analytics should be true');
    assert.equal(captured.body.marketing, false, 'unchecked marketing should be false');
});

test('consent keys are the unprefixed category names (backwards compatible cookie shape)', async () => {
    const dom = buildDOM({ categories: ['strictly_necessary', 'analytics'] });
    const captured = {};
    dom.window.fetch = rejectingFetch(captured);
    await boot(dom);

    click(dom, 'accept-all-cookies');

    assert.ok(!('lcg-analytics' in captured.body), 'consent keys must not contain the lcg- prefix');
    assert.ok('analytics' in captured.body);
});

test('published components without the root attributes still read the checkboxes', async () => {
    const dom = buildDOM({ checked: ['analytics'] });
    banner(dom).removeAttribute('data-cookie-categories');
    banner(dom).removeAttribute('data-required-categories');
    const captured = {};
    dom.window.fetch = confirmingFetch(captured);
    await boot(dom);

    click(dom, 'accept-selected-cookies');

    assert.equal(captured.body.strictly_necessary, true, 'a disabled checkbox marks the category required');
    assert.equal(captured.body.analytics, true);
    assert.equal(captured.body.marketing, false);
});

test('a malformed data-cookie-categories attribute is reported and the checkboxes are used instead', async () => {
    const dom = buildDOM({ checked: ['analytics'] });
    banner(dom).setAttribute('data-cookie-categories', '{not json');
    const warnings = [];
    dom.window.console.warn = (...args) => warnings.push(args);
    const captured = {};
    dom.window.fetch = confirmingFetch(captured);
    await boot(dom);

    click(dom, 'accept-selected-cookies');

    assert.equal(warnings.length, 1, 'one warning should be logged');
    assert.equal(captured.body.analytics, true);
    assert.equal(captured.body.marketing, false);
});

// --- Separate-page mode: the banner has no checkboxes, the root attributes drive the consent ---

const SEPARATE_PAGE_NAMES = { strictly_necessary: ['my_app_cookies_consent'], analytics: ['_ga'], marketing: ['_fbp'] };

function buildSeparatePage(existingCookies = []) {
    const dom = buildDOM({ names: SEPARATE_PAGE_NAMES, separatePage: true, url: 'http://app.example.org/' });
    for (const cookie of existingCookies) dom.window.document.cookie = cookie;
    stubDialog(dom);
    return dom;
}

test('separate-page banner: accept all consents to every configured category', async () => {
    const dom = buildSeparatePage();
    const captured = {};
    dom.window.fetch = confirmingFetch(captured);
    await boot(dom);
    assert.equal(dom.window.document.querySelector('.cookie-category'), null, 'precondition: no checkboxes');

    click(dom, 'accept-all-cookies');
    await flushPromises();

    assert.deepEqual(captured.body, { strictly_necessary: true, analytics: true, marketing: true, locale: 'en' });
});

test('separate-page banner: reject optional rejects every optional category and erases its cookies', async () => {
    const dom = buildSeparatePage(['_ga=1; path=/', '_fbp=1; path=/', 'my_app_cookies_consent=old; path=/']);
    const captured = {};
    dom.window.fetch = confirmingFetch(captured);
    await boot(dom);

    click(dom, 'reject-optional-cookies');
    await flushPromises();

    assert.equal(captured.body.strictly_necessary, true);
    assert.equal(captured.body.analytics, false);
    assert.equal(captured.body.marketing, false);
    const kept = cookieNames(dom, 'http://app.example.org/');
    assert.ok(!kept.includes('_ga'), '_ga should be erased');
    assert.ok(!kept.includes('_fbp'), '_fbp should be erased');
    assert.ok(kept.includes('my_app_cookies_consent'), 'the required category cookie should be kept');
});

// --- The save request ---

test('save request posts JSON with the locale to the configured URL', async () => {
    const dom = buildDOM({ categories: ['strictly_necessary'] });
    const captured = {};
    dom.window.fetch = rejectingFetch(captured);
    await boot(dom);

    click(dom, 'accept-all-cookies');

    assert.equal(captured.url, SAVE_URL);
    assert.equal(captured.options.method, 'POST');
    assert.equal(captured.options.headers.Accept, 'application/json');
    assert.equal(captured.options.headers['Content-Type'], 'application/json');
    assert.equal(captured.body.locale, 'en');
});

test('save request carries the csrf token from the banner root', async () => {
    const dom = buildDOM({ categories: ['strictly_necessary'] });
    const captured = {};
    dom.window.fetch = rejectingFetch(captured);
    await boot(dom);

    click(dom, 'accept-all-cookies');

    assert.equal(captured.options.headers['X-CSRF-TOKEN'], 'test-token');
});

test('save request falls back to the csrf-token meta tag of published components', async () => {
    const dom = buildDOM({
        categories: ['strictly_necessary'],
        csrfToken: null,
        head: '<meta name="csrf-token" content="meta-token">',
    });
    const captured = {};
    dom.window.fetch = rejectingFetch(captured);
    await boot(dom);

    click(dom, 'accept-all-cookies');

    assert.equal(captured.options.headers['X-CSRF-TOKEN'], 'meta-token');
});

test('save request prefers the XSRF-TOKEN cookie Laravel refreshes on every response', async () => {
    const dom = buildDOM({ categories: ['strictly_necessary'] });
    // Laravel writes the encrypted token URL-encoded; the header carries it decoded.
    const encrypted = 'eyJpdiI6ImFiYyIsInZhbHVlIjoieHl6In0=';
    dom.window.document.cookie = 'XSRF-TOKEN=' + encodeURIComponent(encrypted) + '; path=/';
    const captured = {};
    dom.window.fetch = rejectingFetch(captured);
    await boot(dom);

    click(dom, 'accept-all-cookies');

    assert.equal(captured.options.headers['X-XSRF-TOKEN'], encrypted);
    assert.ok(!('X-CSRF-TOKEN' in captured.options.headers), 'X-CSRF-TOKEN should not be sent when the cookie is present');
});

test('save request sends an empty X-CSRF-TOKEN when no token source exists', async () => {
    const dom = buildDOM({ categories: ['strictly_necessary'], csrfToken: null });
    const captured = {};
    dom.window.fetch = rejectingFetch(captured);
    await boot(dom);

    click(dom, 'accept-all-cookies');

    assert.equal(captured.options.headers['X-CSRF-TOKEN'], '');
});

// --- The consent cookie ---

test('consent cookie expires after the configured lifetime', async () => {
    const dom = buildDOM({ categories: ['strictly_necessary', 'analytics'], lifetime: 180 });
    dom.window.fetch = confirmingFetch();
    stubDialog(dom);
    await boot(dom);

    click(dom, 'accept-all-cookies');
    await flushPromises();

    const cookie = consentCookie(dom);
    assert.ok(cookie, 'cookies_consent cookie was not written');
    const days = Math.round((cookie.expires.getTime() - Date.now()) / 86400000);
    assert.equal(days, 180);
});

test('a missing data-cookie-lifetime attribute means 365 days', async () => {
    const dom = buildDOM({ categories: ['strictly_necessary'] });
    banner(dom).removeAttribute('data-cookie-lifetime');
    dom.window.fetch = confirmingFetch();
    stubDialog(dom);
    await boot(dom);

    click(dom, 'accept-all-cookies');
    await flushPromises();

    const days = Math.round((consentCookie(dom).expires.getTime() - Date.now()) / 86400000);
    assert.equal(days, 365);
});

test('cookie_lifetime 0 writes a session cookie without an expiry', async () => {
    const dom = buildDOM({ categories: ['strictly_necessary', 'analytics'], lifetime: 0 });
    dom.window.fetch = confirmingFetch();
    stubDialog(dom);
    await boot(dom);

    click(dom, 'accept-all-cookies');
    await flushPromises();

    const cookie = consentCookie(dom);
    assert.ok(cookie, 'cookies_consent cookie was not written');
    assert.equal(String(cookie.expires), 'Infinity', 'a session cookie has no expiry');
});

test('consent cookie is written with SameSite=Lax and without Secure on an http page', async () => {
    const dom = buildDOM({ categories: ['strictly_necessary', 'analytics'] });
    dom.window.fetch = confirmingFetch();
    stubDialog(dom);
    await boot(dom);

    click(dom, 'accept-all-cookies');
    await flushPromises();

    const cookie = consentCookie(dom);
    assert.equal(cookie.sameSite, 'lax');
    assert.equal(cookie.secure, false);
});

test('consent cookie is written with Secure on an https page', async () => {
    const dom = buildDOM({ categories: ['strictly_necessary'], url: 'https://localhost' });
    dom.window.fetch = confirmingFetch();
    stubDialog(dom);
    await boot(dom);

    click(dom, 'accept-all-cookies');
    await flushPromises();

    const cookie = consentCookie(dom, 'https://localhost/');
    assert.ok(cookie, 'cookies_consent cookie was not written');
    assert.equal(cookie.secure, true);
});

test('consent cookie stores the selection the server confirmed', async () => {
    const dom = buildDOM({ categories: ['strictly_necessary', 'analytics'] });
    // The server drops a category it does not know and forces the required one to true.
    const confirmed = { strictly_necessary: true, locale: 'en' };
    dom.window.fetch = () =>
        Promise.resolve({ json: () => Promise.resolve({ success: true, message: 'ok', data: confirmed }) });
    stubDialog(dom);
    await boot(dom);

    click(dom, 'accept-all-cookies');
    await flushPromises();

    const cookie = consentCookie(dom);
    assert.ok(cookie, 'cookies_consent cookie was not written');
    assert.equal(decodeURIComponent(cookie.value), JSON.stringify(confirmed));
});

// --- The success path in the banner ---

test('banner hides only after the server confirms the save', async () => {
    const dom = buildDOM({ categories: ['strictly_necessary', 'analytics'] });
    dom.window.fetch = confirmingFetch();
    const dialogCalls = stubDialog(dom);
    await boot(dom);
    assert.equal(banner(dom).style.display, 'block', 'banner should be visible before the click');

    click(dom, 'accept-all-cookies');
    assert.equal(banner(dom).style.display, 'block', 'banner must stay visible until the server answers');
    await flushPromises();

    assert.equal(banner(dom).style.display, 'none', 'banner should hide after a successful save');
    assert.deepEqual(dialogCalls, ['close']);
});

test('the floating button appears once the banner hides after a save', async () => {
    const dom = buildDOM({ categories: ['strictly_necessary'], floatingButton: true });
    dom.window.fetch = confirmingFetch();
    stubDialog(dom);
    await boot(dom);
    assert.equal(floatingButton(dom).style.display, 'none', 'no button while the banner is open');

    click(dom, 'accept-all-cookies');
    await flushPromises();

    assert.equal(floatingButton(dom).style.display, 'block');
});

test('a save re-syncs the checkboxes from the confirmed selection', async () => {
    const dom = buildDOM({ checked: ['analytics'] });
    // The server rejects marketing and, unlike the browser, accepts analytics.
    const confirmed = { strictly_necessary: true, analytics: true, marketing: false, locale: 'en' };
    dom.window.fetch = () =>
        Promise.resolve({ json: () => Promise.resolve({ success: true, message: 'ok', data: confirmed }) });
    stubDialog(dom);
    await boot(dom);
    dom.window.document.getElementById('lcg-marketing').checked = true;

    click(dom, 'accept-selected-cookies');
    await flushPromises();

    assert.equal(dom.window.document.getElementById('lcg-analytics').checked, true);
    assert.equal(dom.window.document.getElementById('lcg-marketing').checked, false);
});

test('a success toast shows the server message, fades after four seconds and is removed a second later', async () => {
    const dom = buildDOM({ categories: ['strictly_necessary'] });
    dom.window.fetch = () =>
        Promise.resolve({ json: () => Promise.resolve({ success: true, message: 'Saved!', data: { strictly_necessary: true } }) });
    stubDialog(dom);
    await boot(dom);
    const clock = fakeTimers(dom);

    click(dom, 'accept-all-cookies');
    await flushPromises();

    const toast = dom.window.document.querySelector('#scify-cookies-consent-wrapper .cookie-success-message');
    assert.ok(toast, 'the toast should be added to the wrapper');
    assert.equal(toast.textContent, 'Saved!');
    assert.ok(!toast.classList.contains('show'), 'the toast starts hidden');
    clock.advance(100);
    assert.ok(toast.classList.contains('show'), 'the toast shows after 100 ms');
    clock.advance(4000);
    assert.ok(!toast.classList.contains('show'), 'the toast fades after 4 s');
    assert.ok(toast.isConnected, 'the toast is still in the DOM while it fades');
    clock.advance(1000);
    assert.ok(!toast.isConnected, 'the toast is removed 1 s after fading');
});

test('banner stays open and no cookie is written when the server does not confirm the save', async () => {
    const dom = buildDOM({ categories: ['strictly_necessary', 'analytics'] });
    dom.window.fetch = () => Promise.resolve({ json: () => Promise.resolve({ message: 'The given data was invalid.' }) });
    stubDialog(dom);
    dom.window.console.error = () => {};
    await boot(dom);

    click(dom, 'accept-all-cookies');
    await flushPromises();

    assert.equal(banner(dom).style.display, 'block');
    assert.ok(!dom.window.document.cookie.includes('cookies_consent='), 'no consent cookie must be written');
});

test('banner stays open when the request fails', async () => {
    const dom = buildDOM({ categories: ['strictly_necessary', 'analytics'] });
    dom.window.fetch = () => Promise.reject(new Error('network down'));
    stubDialog(dom);
    dom.window.console.error = () => {};
    await boot(dom);

    click(dom, 'accept-all-cookies');
    await flushPromises();

    assert.equal(banner(dom).style.display, 'block');
});

// --- Erasing the cookies of rejected categories ---

const ERASE_URL = 'http://app.example.org/';

function buildEraseScenario(existingCookies) {
    const names = { strictly_necessary: ['my_app_cookies_consent'], analytics: ['_ga', '_ga_ABC123'], marketing: ['_fbp'] };
    const dom = buildDOM({ names, url: ERASE_URL });
    for (const cookie of existingCookies) dom.window.document.cookie = cookie;
    dom.window.fetch = confirmingFetch();
    stubDialog(dom);
    return dom;
}

test('rejecting all optional categories erases the cookies they declare', async () => {
    const dom = buildEraseScenario(['_ga=1; path=/', '_ga_ABC123=1; path=/', '_fbp=1; path=/']);
    await boot(dom);

    click(dom, 'reject-optional-cookies');
    await flushPromises();

    const names = cookieNames(dom, ERASE_URL);
    assert.ok(!names.includes('_ga'), '_ga should be erased');
    assert.ok(!names.includes('_ga_ABC123'), '_ga_ABC123 should be erased');
    assert.ok(!names.includes('_fbp'), '_fbp should be erased');
});

test('erasing a rejected cookie also covers the parent domain', async () => {
    const dom = buildEraseScenario(['_ga=1; path=/; domain=.example.org']);
    await boot(dom);
    assert.ok(cookieNames(dom, ERASE_URL).includes('_ga'), 'precondition: the domain cookie should be set');

    click(dom, 'reject-optional-cookies');
    await flushPromises();

    assert.ok(!cookieNames(dom, ERASE_URL).includes('_ga'), '_ga on .example.org should be erased');
});

test('accepted and required categories keep their cookies', async () => {
    const dom = buildEraseScenario(['_ga=1; path=/', '_fbp=1; path=/', 'my_app_cookies_consent=old; path=/']);
    await boot(dom);
    dom.window.document.getElementById('lcg-analytics').checked = true;

    click(dom, 'accept-selected-cookies');
    await flushPromises();

    const names = cookieNames(dom, ERASE_URL);
    assert.ok(names.includes('_ga'), '_ga (accepted analytics) should be kept');
    assert.ok(!names.includes('_fbp'), '_fbp (rejected marketing) should be erased');
    assert.ok(names.includes('my_app_cookies_consent'), 'the required category cookie should be kept');
});

test('rejecting optional categories keeps every required category and its cookies', async () => {
    const names = { strictly_necessary: ['laravel_session'], functional: ['lang_pref'], analytics: ['_ga'] };
    const dom = buildDOM({
        categories: Object.keys(names),
        names,
        required: ['strictly_necessary', 'functional'],
        url: ERASE_URL,
    });
    for (const cookie of ['laravel_session=1; path=/', 'lang_pref=1; path=/', '_ga=1; path=/']) {
        dom.window.document.cookie = cookie;
    }
    const captured = {};
    dom.window.fetch = confirmingFetch(captured);
    stubDialog(dom);
    await boot(dom);

    click(dom, 'reject-optional-cookies');
    await flushPromises();

    assert.equal(captured.body.functional, true, 'functional is required and should be sent as true');
    assert.equal(captured.body.analytics, false);
    const kept = cookieNames(dom, ERASE_URL);
    assert.ok(kept.includes('lang_pref'), 'lang_pref (required functional) should be kept');
    assert.ok(kept.includes('laravel_session'), 'laravel_session (required strictly_necessary) should be kept');
    assert.ok(!kept.includes('_ga'), '_ga (rejected analytics) should be erased');
});

// --- Page load with an existing consent ---

test('an existing consent hides the banner and shows the floating button', async () => {
    const dom = buildDOM({ floatingButton: true });
    storedConsent(dom);
    const dialogCalls = stubDialog(dom);
    await boot(dom);

    assert.equal(banner(dom).style.display, 'none');
    assert.equal(floatingButton(dom).style.display, 'block');
    assert.deepEqual(dialogCalls, [], 'the dialog is not opened for a visitor who already decided');
});

test('an existing consent restores the checkbox state', async () => {
    const dom = buildDOM();
    storedConsent(dom, { strictly_necessary: true, analytics: true, marketing: false, locale: 'en' });
    await boot(dom);

    assert.equal(dom.window.document.getElementById('lcg-analytics').checked, true);
    assert.equal(dom.window.document.getElementById('lcg-marketing').checked, false);
    assert.equal(dom.window.document.getElementById('lcg-strictly_necessary').checked, true);
});

test('a malformed consent cookie is reported and does not break the page', async () => {
    const dom = buildDOM();
    dom.window.document.cookie = 'cookies_consent=not-json; path=/';
    const warnings = [];
    dom.window.console.warn = (...args) => warnings.push(args);
    await boot(dom);

    assert.equal(warnings.length, 1, 'one warning should be logged');
    assert.equal(dom.window.document.getElementById('lcg-analytics').checked, false, 'checkboxes keep their default');
});

test('the floating button is hidden on narrow screens when hide_floating_button_on_mobile is set', async () => {
    const narrow = buildDOM({ floatingButton: true, hideOnMobile: true });
    storedConsent(narrow);
    narrow.window.innerWidth = 500;
    await boot(narrow);
    assert.equal(floatingButton(narrow).style.display, 'none');

    const wide = buildDOM({ floatingButton: true, hideOnMobile: true });
    storedConsent(wide);
    wide.window.innerWidth = 1024;
    await boot(wide);
    assert.equal(floatingButton(wide).style.display, 'block');
});

test('the data attributes also accept "1" as true', async () => {
    const dom = buildDOM({ floatingButton: true });
    banner(dom).setAttribute('data-show-floating-button', '1');
    storedConsent(dom);
    await boot(dom);

    assert.equal(floatingButton(dom).style.display, 'block');
});

test('without a consent the banner opens as a modal dialog when use_show_modal is set', async () => {
    const dom = buildDOM({ useShowModal: true });
    const dialogCalls = stubDialog(dom);
    await boot(dom);

    assert.equal(banner(dom).style.display, 'block');
    assert.deepEqual(dialogCalls, ['showModal']);
});

// --- Opening the banner again: window.toggleCookieBanner, the hash and the settings links ---

test('window.toggleCookieBanner opens and closes the banner and swaps the floating button', async () => {
    const dom = buildDOM({ floatingButton: true, useShowModal: true });
    storedConsent(dom);
    const dialogCalls = stubDialog(dom);
    await boot(dom);

    dom.window.toggleCookieBanner();
    assert.equal(banner(dom).style.display, 'block');
    assert.equal(floatingButton(dom).style.display, 'none');
    assert.deepEqual(dialogCalls, ['showModal']);

    dom.window.toggleCookieBanner();
    assert.equal(banner(dom).style.display, 'none');
    assert.equal(floatingButton(dom).style.display, 'block');
    assert.deepEqual(dialogCalls, ['showModal', 'close']);
});

test('the floating button opens the banner through its inline onclick handler', async () => {
    const dom = buildDOM({ floatingButton: true });
    storedConsent(dom);
    stubDialog(dom);
    await boot(dom);

    floatingButton(dom).click();

    assert.equal(banner(dom).style.display, 'block');
});

test('the #consent-settings hash on page load opens the banner of a visitor who already decided', async () => {
    const dom = buildDOM({ floatingButton: true, url: 'http://localhost/#consent-settings' });
    storedConsent(dom);
    stubDialog(dom);
    await boot(dom);

    assert.equal(banner(dom).style.display, 'block');
    assert.equal(floatingButton(dom).style.display, 'none');
});

test('the #consent-settings hash on page load keeps the banner open for a first-time visitor', async () => {
    const dom = buildDOM({ url: 'http://localhost/#consent-settings' });
    stubDialog(dom);
    await boot(dom);

    assert.equal(banner(dom).style.display, 'block', 'the hash must not toggle an already open banner closed');
});

test('changing the hash to #consent-settings after page load opens the banner', async () => {
    const dom = buildDOM();
    storedConsent(dom);
    stubDialog(dom);
    await boot(dom);
    assert.equal(banner(dom).style.display, 'none', 'precondition: hidden');

    const changed = new Promise((resolve) => dom.window.addEventListener('hashchange', resolve));
    dom.window.location.hash = '#consent-settings';
    await changed;

    assert.equal(banner(dom).style.display, 'block');
});

test('a link to #consent-settings opens the banner and does not close an open one', async () => {
    const dom = buildDOM({
        floatingButton: true,
        extraHtml: '<a id="settings-link" href="#consent-settings">Cookie settings</a>',
    });
    storedConsent(dom);
    stubDialog(dom);
    await boot(dom);

    const changed = new Promise((resolve) => dom.window.addEventListener('hashchange', resolve));
    click(dom, 'settings-link');
    await changed;
    assert.equal(banner(dom).style.display, 'block');
    assert.equal(dom.window.location.hash, '#consent-settings');

    click(dom, 'settings-link');
    assert.equal(banner(dom).style.display, 'block', 'a second click keeps the banner open');
});

// --- The customise button and the accordion ---

test('customise reveals the categories and swaps the customise button for the save button', async () => {
    const dom = buildDOM();
    await boot(dom);
    const container = dom.window.document.getElementById('cookie-categories-container');
    const customiseCol = dom.window.document.getElementById('customise-cookies').closest('.button-col');
    const saveCol = dom.window.document.getElementById('accept-selected-cookies').closest('.button-col');
    assert.ok(container.classList.contains('display-none'), 'precondition: categories hidden');

    click(dom, 'customise-cookies');

    assert.ok(!container.classList.contains('display-none'), 'categories should be visible');
    assert.ok(customiseCol.classList.contains('display-none'), 'customise button should be hidden');
    assert.ok(!saveCol.classList.contains('display-none'), 'save button should be visible');
});

test('opening an accordion item closes the others and relabels their buttons', async () => {
    const dom = buildDOM({ accordion: true });
    dom.window.cookies_consent_translations = { read_more: 'Read more', read_less: 'Read less' };
    await boot(dom);
    const doc = dom.window.document;
    const button = (cat) => doc.querySelector(`[data-target="#collapse-${cat}"]`);
    const panel = (cat) => doc.getElementById(`collapse-${cat}`);

    button('analytics').click();
    assert.ok(panel('analytics').classList.contains('show'));
    assert.ok(!button('analytics').classList.contains('collapsed'));
    assert.equal(button('analytics').textContent, 'Read less');

    button('marketing').click();
    assert.ok(panel('marketing').classList.contains('show'));
    assert.ok(!panel('analytics').classList.contains('show'), 'the other item closes');
    assert.ok(button('analytics').classList.contains('collapsed'));
    assert.equal(button('analytics').textContent, 'Read more');

    button('marketing').click();
    assert.ok(!panel('marketing').classList.contains('show'), 'clicking the open item closes it');
    assert.ok(button('marketing').classList.contains('collapsed'));
    assert.equal(button('marketing').textContent, 'Read more');
});

test('the accordion keeps the button labels when no translations are on the page', async () => {
    const dom = buildDOM({ accordion: true });
    await boot(dom);
    const button = dom.window.document.querySelector('[data-target="#collapse-analytics"]');

    button.click();

    assert.ok(dom.window.document.getElementById('collapse-analytics').classList.contains('show'));
    assert.equal(button.textContent, 'Read more', 'the label stays as rendered');
});

// --- The cookie policy page ---

test('on the cookie policy page the banner is always shown and a save goes back in history', async () => {
    const dom = buildDOM({ onCookiesPage: true });
    storedConsent(dom);
    dom.window.fetch = confirmingFetch();
    let backCalls = 0;
    dom.window.history.back = () => backCalls++;
    await boot(dom);
    assert.equal(banner(dom).style.display, 'block', 'the page shows the categories even with a consent');

    click(dom, 'accept-all-cookies');
    await flushPromises();

    assert.equal(banner(dom).style.display, 'block', 'the page does not hide its content');
    assert.equal(backCalls, 1);
    assert.ok(consentCookie(dom), 'the consent is stored');
});

test('on the cookie policy page toggleCookieBanner does nothing', async () => {
    const dom = buildDOM({ onCookiesPage: true, url: 'http://localhost/#consent-settings' });
    await boot(dom);

    dom.window.toggleCookieBanner();

    assert.equal(banner(dom).style.display, 'block');
});

test('the close button of a custom policy page saves the current selection', async () => {
    const dom = buildDOM({
        onCookiesPage: true,
        checked: ['analytics'],
        extraHtml: '<button id="close-cookie-policy-page">Close</button>',
    });
    const captured = {};
    dom.window.fetch = confirmingFetch(captured);
    dom.window.history.back = () => {};
    await boot(dom);

    click(dom, 'close-cookie-policy-page');

    assert.equal(captured.body.analytics, true);
    assert.equal(captured.body.marketing, false);
});
