const fs = require('fs');
const path = require('path');
const vm = require('vm');

const scriptSrc = fs.readFileSync(path.join(__dirname, '..', 'script.js'), 'utf8');
let failures = 0;

function check(label, condition) {
    const result = condition ? 'PASS' : 'FAIL';
    if (!condition) failures++;
    console.log(`[${result}] ${label}`);
    console.assert(condition, label);
}

function runScriptAgainstMockDom() {
    const listeners = {};
    const logs = [];
    const errors = [];
    const warnings = [];

    const mockDocument = {
        addEventListener(event, handler) {
            listeners[event] = listeners[event] || [];
            listeners[event].push(handler);
        },
        getElementById() {
            return null;
        },
        createElement(tag) {
            return { tagName: tag, listeners: {}, children: [], addEventListener() {}, appendChild() {} };
        }
    };

    const mockConsole = {
        log: (...args) => logs.push(args.join(' ')),
        error: (...args) => errors.push(args.join(' ')),
        warn: (...args) => warnings.push(args.join(' ')),
    };

    const sandbox = { document: mockDocument, console: mockConsole, window: {} };
    vm.createContext(sandbox);

    let thrown = null;
    try {
        vm.runInContext(scriptSrc, sandbox, { filename: 'script.js' });
    } catch (e) {
        thrown = e;
    }

    // Simulate the DOMContentLoaded event firing, as a browser would.
    (listeners['DOMContentLoaded'] || []).forEach(handler => {
        try {
            handler();
        } catch (e) {
            errors.push(String(e));
        }
    });

    return { logs, errors, warnings, thrown, listenerCount: (listeners['DOMContentLoaded'] || []).length };
}

const result = runScriptAgainstMockDom();

// Happy path: FR-7 — logs "TODO App loaded" on DOMContentLoaded
check('FR-7: script.js loads without throwing', result.thrown === null);
check('FR-7: registers exactly one DOMContentLoaded listener', result.listenerCount === 1);
check('FR-7: logs "TODO App loaded" on DOMContentLoaded', result.logs.includes('TODO App loaded'));
check('FR-7: logs exactly one message', result.logs.length === 1);

// NFR-2: no console errors or warnings on page load
check('NFR-2: no console.error calls', result.errors.length === 0);
check('NFR-2: no console.warn calls', result.warnings.length === 0);

// Edge case: DOMContentLoaded firing more than once (browser guarantees single fire,
// but a defensive re-run should not throw or duplicate unexpected state)
const secondRun = runScriptAgainstMockDom();
check('Edge case: re-evaluating script.js from scratch is idempotent (no throw)', secondRun.thrown === null);
check('Edge case: re-evaluating script.js from scratch logs message again cleanly', secondRun.logs.length === 1 && secondRun.logs[0] === 'TODO App loaded');

console.log(`\n${failures === 0 ? 'ALL SCRIPT BEHAVIOR TESTS PASSED' : failures + ' SCRIPT BEHAVIOR TEST(S) FAILED'}`);
process.exitCode = failures === 0 ? 0 : 1;
