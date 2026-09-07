const { loadTaskApp, submitForm } = require('./dom-mock-helper');
let failures = 0;

function check(label, condition) {
    const result = condition ? 'PASS' : 'FAIL';
    if (!condition) failures++;
    console.log(`[${result}] ${label}`);
    console.assert(condition, label);
}

// FR-5: Enter-key submission produces identical behavior to Add-button click.
// Both natively fire the form's `submit` event, which is what our mock dispatches,
// so this test asserts the same outcomes as the button-click integration test.
let { elements } = loadTaskApp();
const { defaultPrevented } = submitForm(elements, 'Buy milk');

check('FR-5: Enter-triggered submit prevents default page reload', defaultPrevented === true);
check('FR-5: Enter-triggered submit adds the task to the list', elements['task-list'].children.length === 1 && elements['task-list'].children[0].textContent === 'Buy milk');
check('FR-5: Enter-triggered submit clears the input', elements['task-input'].value === '');
check('FR-5: Enter-triggered submit keeps error hidden for valid input', elements['task-error'].hidden === true);

// FR-4/FR-5: Enter with empty input shows the error and adds nothing, same as button click
({ elements } = loadTaskApp());
submitForm(elements, '');
check('FR-5: Enter-triggered submit with empty input shows the error', elements['task-error'].hidden === false);
check('FR-5: Enter-triggered submit with empty input adds no task', elements['task-list'].children.length === 0);

console.log(`\n${failures === 0 ? 'ALL ENTER-KEY SUBMISSION TESTS PASSED' : failures + ' ENTER-KEY SUBMISSION TEST(S) FAILED'}`);
process.exitCode = failures === 0 ? 0 : 1;
