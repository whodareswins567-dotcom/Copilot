const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { loadTaskApp, submitForm } = require('./dom-mock-helper');

const scriptSrc = fs.readFileSync(path.join(__dirname, '..', 'script.js'), 'utf8');
let failures = 0;

function check(label, condition) {
    const result = condition ? 'PASS' : 'FAIL';
    if (!condition) failures++;
    console.log(`[${result}] ${label}`);
    console.assert(condition, label);
}

// addTask's validation outcome (success flag) is exercised directly against a
// minimal sandbox; the resulting task list is observed through the full app
// harness, since the in-memory task array is not exposed outside script.js.
function loadTaskManager() {
    const mockDocument = {
        addEventListener() {},
        getElementById() { return null; },
        createElement(tag) { return { tagName: tag, listeners: {}, children: [], addEventListener() {}, appendChild() {} }; },
    };
    const sandbox = { document: mockDocument, console, window: {} };
    vm.createContext(sandbox);
    vm.runInContext(scriptSrc, sandbox, { filename: 'script.js' });
    return sandbox;
}

// FR-4: empty input rejected
let sandbox = loadTaskManager();
check('FR-4: addTask("") is rejected', sandbox.addTask('').success === false);

// FR-4: whitespace-only input rejected
sandbox = loadTaskManager();
check('FR-4: addTask("   ") is rejected', sandbox.addTask('   ').success === false);

// FR-2: valid task accepted
sandbox = loadTaskManager();
check('FR-2: addTask("Buy milk") succeeds', sandbox.addTask('Buy milk').success === true);

// FR-2: valid task is actually appended to the in-memory list, observed via the rendered list
let { elements } = loadTaskApp();
submitForm(elements, 'Buy milk');
check('FR-2: valid task is appended to the in-memory task list', elements['task-list'].children.length === 1);

// Trimming: leading/trailing whitespace around valid text is trimmed before being stored
({ elements } = loadTaskApp());
submitForm(elements, '  Walk the dog  ');
check('Valid task text is trimmed before being stored', elements['task-list'].children[0].textContent === 'Walk the dog');

// Duplicates allowed per design review Open Questions decision
({ elements } = loadTaskApp());
submitForm(elements, 'Buy milk');
submitForm(elements, 'Buy milk');
check('Duplicate task text is allowed (no dedup)', elements['task-list'].children.length === 2);

console.log(`\n${failures === 0 ? 'ALL TASK MANAGER TESTS PASSED' : failures + ' TASK MANAGER TEST(S) FAILED'}`);
process.exitCode = failures === 0 ? 0 : 1;
