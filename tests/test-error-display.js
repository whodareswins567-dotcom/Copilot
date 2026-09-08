const { loadTaskApp, submitForm } = require('./dom-mock-helper');
let failures = 0;

function check(label, condition) {
    const result = condition ? 'PASS' : 'FAIL';
    if (!condition) failures++;
    console.log(`[${result}] ${label}`);
    console.assert(condition, label);
}

// FR-4: invalid submission shows the inline error
let { elements } = loadTaskApp();
submitForm(elements, '');
check('FR-4: empty submission shows the error element (hidden=false)', elements['task-error'].hidden === false);

({ elements } = loadTaskApp());
submitForm(elements, '   ');
check('FR-4: whitespace-only submission shows the error element (hidden=false)', elements['task-error'].hidden === false);

// Error stays hidden on a valid submission
({ elements } = loadTaskApp());
submitForm(elements, 'Buy milk');
check('FR-2: valid submission keeps the error element hidden', elements['task-error'].hidden === true);

// Architecture Event Flow step 4: a valid submission clears a previously shown error
({ elements } = loadTaskApp());
submitForm(elements, '');
check('Precondition: error is shown after invalid submission', elements['task-error'].hidden === false);
submitForm(elements, 'Buy milk');
check('Error clears on the next successful submission', elements['task-error'].hidden === true);

console.log(`\n${failures === 0 ? 'ALL ERROR DISPLAY TESTS PASSED' : failures + ' ERROR DISPLAY TEST(S) FAILED'}`);
process.exitCode = failures === 0 ? 0 : 1;
