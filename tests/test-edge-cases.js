const { loadTaskApp, submitForm } = require('./dom-mock-helper');

let failures = 0;

function check(label, condition) {
    const result = condition ? 'PASS' : 'FAIL';
    if (!condition) failures++;
    console.log(`[${result}] ${label}`);
    console.assert(condition, label);
}

// Edge case: very long task text is accepted and rendered verbatim
{
    const { elements } = loadTaskApp();
    const longText = 'a'.repeat(10000);
    submitForm(elements, longText);
    check('Edge case: very long task (10000 chars) is accepted', elements['task-list'].children.length === 1);
    check('Edge case: very long task text is stored/rendered verbatim', elements['task-list'].children[0].textContent === longText);
    check('Edge case: no error shown for a valid long task', elements['task-error'].hidden === true);
}

// Edge case: special characters (quotes, ampersand, angle brackets) stored/rendered verbatim via textContent
{
    const { elements } = loadTaskApp();
    const specialText = `Buy "milk" & eggs <script>alert(1)</script>`;
    submitForm(elements, specialText);
    check('Edge case: special-character task is accepted', elements['task-list'].children.length === 1);
    check('Edge case: special-character task text is rendered verbatim (no HTML escaping/execution)', elements['task-list'].children[0].textContent === specialText);
    check('Edge case: rendered <li> has no child nodes (textContent used, not innerHTML)', elements['task-list'].children[0].children.length === 0);
}

// Edge case: whitespace-only input using tabs/newlines is rejected, matching plain-space whitespace behavior
{
    const { elements } = loadTaskApp();
    submitForm(elements, '\t\n   \t');
    check('Edge case: tab/newline-only input is rejected', elements['task-list'].children.length === 0);
    check('Edge case: tab/newline-only input shows the inline error', elements['task-error'].hidden === false);
}

// Edge case: localStorage unavailable — app must still load and accept tasks
// gracefully when localStorage is missing (e.g. SecurityError in private
// browsing).  Since TODO-10, saveTasks / loadTasks wrap all storage access in
// try/catch so the app degrades silently rather than crashing.
{
    const { elements } = loadTaskApp({ localStorage: undefined });
    submitForm(elements, 'Buy milk');
    check('Edge case: app functions normally when localStorage is unavailable', elements['task-list'].children.length === 1);
}

console.log(`\n${failures === 0 ? 'ALL EDGE CASE TESTS PASSED' : failures + ' EDGE CASE TEST(S) FAILED'}`);
process.exitCode = failures === 0 ? 0 : 1;
