const fs = require('fs');
const path = require('path');
const vm = require('vm');

let failures = 0;

function check(label, condition) {
    const result = condition ? 'PASS' : 'FAIL';
    if (!condition) failures++;
    console.log(`[${result}] ${label}`);
    console.assert(condition, label);
}

// Simulate a full page load: parse index.html for asset references, verify
// each referenced local asset actually exists on disk (a missing file is the
// most common real-world cause of console 404 errors), then execute script.js
// in a mock DOM/console to capture any runtime errors/warnings.

const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

const cssHrefMatch = html.match(/<link[^>]*href="([^"]+)"[^>]*>/i);
const scriptSrcMatch = html.match(/<script[^>]*src="([^"]+)"[^>]*>/i);

const cssHref = cssHrefMatch ? cssHrefMatch[1] : null;
const scriptSrc = scriptSrcMatch ? scriptSrcMatch[1] : null;

check('NFR-2: linked stylesheet path resolves to an existing file (no 404)', !!cssHref && fs.existsSync(path.join(root, cssHref)));
check('NFR-2: linked script path resolves to an existing file (no 404)', !!scriptSrc && fs.existsSync(path.join(root, scriptSrc)));

// Execute the actual script.js contents in a sandboxed environment mimicking
// the browser console, and confirm no errors/warnings are ever emitted.
const scriptFileSrc = fs.readFileSync(path.join(root, 'script.js'), 'utf8');

const logs = [];
const errors = [];
const warnings = [];
const listeners = {};

const sandbox = {
    document: {
        addEventListener(event, handler) {
            listeners[event] = listeners[event] || [];
            listeners[event].push(handler);
        }
    },
    console: {
        log: (...args) => logs.push(args.join(' ')),
        error: (...args) => errors.push(args.join(' ')),
        warn: (...args) => warnings.push(args.join(' ')),
    },
    window: {},
};
vm.createContext(sandbox);

let thrown = null;
try {
    vm.runInContext(scriptFileSrc, sandbox, { filename: 'script.js' });
    (listeners['DOMContentLoaded'] || []).forEach(handler => handler());
} catch (e) {
    thrown = e;
}

check('NFR-2: script.js executes without throwing a runtime error', thrown === null);
check('NFR-2: no console.error emitted during page load simulation', errors.length === 0);
check('NFR-2: no console.warn emitted during page load simulation', warnings.length === 0);
check('NFR-2: exactly one clean log message on load ("TODO App loaded")', logs.length === 1 && logs[0] === 'TODO App loaded');

console.log(`\n${failures === 0 ? 'ALL NFR-2 (NO CONSOLE ERRORS) TESTS PASSED' : failures + ' NFR-2 TEST(S) FAILED'}`);
process.exitCode = failures === 0 ? 0 : 1;
