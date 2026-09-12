/**
 * Output format tests for the compiled bundle.
 * Run with: node --test tests/
 */

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const code = fs.readFileSync(path.join(__dirname, '../public/scripts.js'), 'utf8');

test('the bundle is wrapped in an IIFE, so it declares nothing in the global scope', () => {
    assert.ok(code.startsWith('(function()'));
});

test('the bundle declares no global _ (lodash conflict)', () => {
    assert.ok(!/^function _\(/.test(code));
    assert.ok(!/^var _=/.test(code));
});

test('the bundle exposes window.toggleCookieBanner', () => {
    assert.ok(code.includes('window.toggleCookieBanner='));
});

test('the bundle uses strict mode', () => {
    assert.ok(code.includes('"use strict"'));
});
