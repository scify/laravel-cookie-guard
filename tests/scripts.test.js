/**
 * JavaScript output format tests
 * Run with: node tests/scripts.test.js
 */

const fs = require('fs');
const path = require('path');

const scriptPath = path.join(__dirname, '../public/scripts.js');
const code = fs.readFileSync(scriptPath, 'utf8');

let passed = 0;
let failed = 0;

function test(name, condition) {
    if (condition) {
        console.log(`✓ ${name}`);
        passed++;
    } else {
        console.log(`✗ ${name}`);
        failed++;
    }
}

// Test 1: Code should be wrapped in IIFE to avoid global scope pollution
test('Script is wrapped in IIFE', code.startsWith('(function()'));

// Test 2: No global function declarations that could conflict with lodash
test('No global _ function (lodash conflict)', !(/^function _\(/.test(code)));
test('No global var _ declaration', !(/^var _=/.test(code)));

// Test 3: Public API should still be exposed
test('Exposes window.toggleCookieBanner', code.includes('window.toggleCookieBanner='));

// Test 4: Uses strict mode
test('Uses strict mode', code.includes('"use strict"'));

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
