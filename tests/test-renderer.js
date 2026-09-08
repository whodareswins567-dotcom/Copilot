const { loadTaskApp, submitForm } = require('./dom-mock-helper');
let failures = 0;

function check(label, condition) {
    const result = condition ? 'PASS' : 'FAIL';
    if (!condition) failures++;
    console.log(`[${result}] ${label}`);
    console.assert(condition, label);
}

// FR-2: list rebuilds with the correct task text
let { elements } = loadTaskApp();
submitForm(elements, 'Buy milk');
submitForm(elements, 'Walk the dog');
const list = elements['task-list'];
check('Renderer: task list has one <li> per added task', list.children.length === 2);
check('Renderer: first <li> text matches first task', list.children[0].textContent === 'Buy milk');
check('Renderer: second <li> text matches second task', list.children[1].textContent === 'Walk the dog');

// Security: script/HTML-like task text must render as inert text via textContent, not innerHTML
({ elements } = loadTaskApp());
const maliciousInput = '<img src=x onerror=alert(1)>';
submitForm(elements, maliciousInput);
check('Renderer: HTML-like task text is stored verbatim as textContent (not executed)', elements['task-list'].children[0].textContent === maliciousInput);
check('Renderer: rendered <li> has no innerHTML/children other than its text', elements['task-list'].children[0].children.length === 0);

console.log(`\n${failures === 0 ? 'ALL RENDERER TESTS PASSED' : failures + ' RENDERER TEST(S) FAILED'}`);
process.exitCode = failures === 0 ? 0 : 1;
