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

function assert(condition, message) {
    if (!condition) throw new Error(message || 'Assertion failed');
}

/**
 * Build a minimal DOM environment with the cookie banner and category checkboxes.
 * Returns the window object after executing the compiled script.
 */
function buildDOM(categories = ['strictly_necessary', 'analytics', 'marketing'], checkedIds = []) {
    const checkboxesHtml = categories.map((cat) => {
        const checked = checkedIds.includes(cat) ? 'checked' : '';
        return `<input class="cookie-category" type="checkbox" id="lcg-${cat}" ${checked}>`;
    }).join('\n');

    const html = `<!DOCTYPE html>
<html>
<head><meta name="csrf-token" content="test-token"></head>
<body>
  <div id="scify-cookies-consent-wrapper">
    <div id="scify-cookies-consent"
        data-show-floating-button="false"
        data-hide-floating-button-on-mobile="false"
        data-cookie-prefix=""
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

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
