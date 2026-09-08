const { loadTaskApp, submitForm } = require('./dom-mock-helper');
let failures = 0;

function check(label, condition) {
    const result = condition ? 'PASS' : 'FAIL';
    if (!condition) failures++;
    console.log(`[${result}] ${label}`);
    console.assert(condition, label);
}

// Full flow: type a task, submit via Add-button click (form submit), task appears, input clears
let { elements } = loadTaskApp();
elements['task-input'].value = 'Buy milk';
const { defaultPrevented } = submitForm(elements, 'Buy milk');

check('FR-2: default form submission (page reload) is prevented', defaultPrevented === true);
check('FR-2: task appears in the rendered list', elements['task-list'].children.length === 1 && elements['task-list'].children[0].textContent === 'Buy milk');
check('FR-3: input clears after a successful add', elements['task-input'].value === '');
check('FR-4: no error shown for a valid submission', elements['task-error'].hidden === true);

console.log(`\n${failures === 0 ? 'ALL ADD-TASK INTEGRATION TESTS PASSED' : failures + ' ADD-TASK INTEGRATION TEST(S) FAILED'}`);
process.exitCode = failures === 0 ? 0 : 1;
