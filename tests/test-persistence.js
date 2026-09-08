// tests/test-persistence.js
// Covers all FR/NFR acceptance criteria for TODO-10 (localStorage persistence).
//
// Pattern: same check(label, condition) + failures counter used throughout
// this project.  Each test block uses its own isolated localStorage instance
// (returned as app.localStorage) so there is no state leakage.  Tests that
// must PRE-SEED data before loading the app use the shared mockLocalStorage —
// call clearMockStorage() first so prior test runs cannot interfere.

const {
    loadTaskApp,
    submitForm,
    clearMockStorage,
    makeQuotaExceededStorage,
    mockLocalStorage,
} = require('./dom-mock-helper');

let failures = 0;

function check(label, condition) {
    const result = condition ? 'PASS' : 'FAIL';
    if (!condition) { failures++; }
    console.log(`[${result}] ${label}`);
    console.assert(condition, label);
}

// ---------------------------------------------------------------------------
// FR-01 — save on add
// After addTask(), the per-call localStorage must hold the new task as JSON.
// ---------------------------------------------------------------------------
let app = loadTaskApp();
submitForm(app.elements, 'Buy milk');
check(
    'FR-01: localStorage is written after addTask',
    app.localStorage.getItem('todos') !== null
);
check(
    'FR-01: stored value contains the newly added task',
    JSON.parse(app.localStorage.getItem('todos')).indexOf('Buy milk') !== -1
);

// Two tasks → stored array length is 2
app = loadTaskApp();
submitForm(app.elements, 'Task one');
submitForm(app.elements, 'Task two');
check(
    'FR-01: two addTask calls produce a stored array of length 2',
    JSON.parse(app.localStorage.getItem('todos')).length === 2
);

// ---------------------------------------------------------------------------
// FR-05 — key is 'todos', value is a JSON array
// ---------------------------------------------------------------------------
app = loadTaskApp();
submitForm(app.elements, 'Verify key');
const storedValue = app.localStorage.getItem('todos');
check(
    'FR-05: localStorage key is "todos"',
    storedValue !== null
);
check(
    'FR-05: stored value parses as an Array',
    Array.isArray(JSON.parse(storedValue))
);

// ---------------------------------------------------------------------------
// FR-02 / FR-03 note — saveTasks is defined and callable
// deleteTask / toggleTask are out of scope for this ticket; confirm that the
// saveTasks function exists so the wiring is straightforward when those
// features are implemented.
// ---------------------------------------------------------------------------
app = loadTaskApp();
check(
    'FR-02/FR-03: saveTasks is defined in the script sandbox',
    typeof app.sandbox.saveTasks === 'function'
);

// ---------------------------------------------------------------------------
// FR-04 — load on init
// Pre-seed the shared mockLocalStorage, then load the app with that store.
// Tasks must appear after DOMContentLoaded without any user interaction.
// ---------------------------------------------------------------------------
clearMockStorage();
mockLocalStorage.setItem('todos', JSON.stringify(['Loaded Task', 'Another Task']));
app = loadTaskApp({ localStorage: mockLocalStorage });
check(
    'FR-04: pre-seeded tasks are rendered on page load',
    app.elements['task-list'].children.length === 2
);
check(
    'FR-04: first rendered task text matches stored value',
    app.elements['task-list'].children[0].textContent === 'Loaded Task'
);
check(
    'FR-04: second rendered task text matches stored value',
    app.elements['task-list'].children[1].textContent === 'Another Task'
);

// ---------------------------------------------------------------------------
// FR-06 — empty localStorage → empty list, no crash
// ---------------------------------------------------------------------------
app = loadTaskApp();
check(
    'FR-06: empty localStorage renders an empty task list',
    app.elements['task-list'].children.length === 0
);

// ---------------------------------------------------------------------------
// FR-07 — corrupted data → empty list, no crash
// ---------------------------------------------------------------------------
clearMockStorage();
mockLocalStorage.setItem('todos', 'NOT_JSON');
app = loadTaskApp({ localStorage: mockLocalStorage });
check(
    'FR-07: corrupted JSON in localStorage renders an empty task list',
    app.elements['task-list'].children.length === 0
);

// ---------------------------------------------------------------------------
// H-01 — JSON.parse returning null → empty list (Array.isArray guard)
// JSON.parse('null') succeeds but returns null; must not be treated as a list.
// ---------------------------------------------------------------------------
clearMockStorage();
mockLocalStorage.setItem('todos', 'null');
app = loadTaskApp({ localStorage: mockLocalStorage });
check(
    'H-01: null JSON value yields an empty task list',
    app.elements['task-list'].children.length === 0
);

// JSON.parse('{}') returns an object, not an array.
clearMockStorage();
mockLocalStorage.setItem('todos', '{}');
app = loadTaskApp({ localStorage: mockLocalStorage });
check(
    'H-01: object JSON value yields an empty task list',
    app.elements['task-list'].children.length === 0
);

// JSON.parse('"hello"') returns a string, not an array.
clearMockStorage();
mockLocalStorage.setItem('todos', '"hello"');
app = loadTaskApp({ localStorage: mockLocalStorage });
check(
    'H-01: string JSON value yields an empty task list',
    app.elements['task-list'].children.length === 0
);

// ---------------------------------------------------------------------------
// M-03 — non-string elements in a stored array are filtered out
// [42, null, "valid"] → only "valid" is kept
// ---------------------------------------------------------------------------
clearMockStorage();
mockLocalStorage.setItem('todos', JSON.stringify([42, null, 'valid']));
app = loadTaskApp({ localStorage: mockLocalStorage });
check(
    'M-03: non-string elements in stored array are filtered out',
    app.elements['task-list'].children.length === 1
);
check(
    'M-03: the surviving element is the string task',
    app.elements['task-list'].children[0].textContent === 'valid'
);

// All non-strings → empty list
clearMockStorage();
mockLocalStorage.setItem('todos', JSON.stringify([1, 2, { text: 'object' }]));
app = loadTaskApp({ localStorage: mockLocalStorage });
check(
    'M-03: array of all non-strings yields an empty task list',
    app.elements['task-list'].children.length === 0
);

// ---------------------------------------------------------------------------
// NFR-01 — absent localStorage (simulate SecurityError environment)
// When localStorage is undefined, the try/catch in loadTasks and saveTasks
// must prevent any crash.
// ---------------------------------------------------------------------------
app = loadTaskApp({ localStorage: undefined });
check(
    'NFR-01: app loads cleanly when localStorage is unavailable',
    app.elements['task-list'].children.length === 0
);
// Submitting a task must also work — saveTasks() swallows the error silently.
submitForm(app.elements, 'Task with no storage');
check(
    'NFR-01: addTask succeeds when localStorage is unavailable',
    app.elements['task-list'].children.length === 1
);

// ---------------------------------------------------------------------------
// NFR-02 — quota-exceeded on setItem must not crash addTask
// In-memory state (and thus the rendered list) must be intact even though
// the localStorage write failed.
// ---------------------------------------------------------------------------
const quotaStorage = makeQuotaExceededStorage();
app = loadTaskApp({ localStorage: quotaStorage });
submitForm(app.elements, 'Quota task');
check(
    'NFR-02: addTask succeeds (task rendered) despite quota-exceeded error',
    app.elements['task-list'].children.length === 1
);
check(
    'NFR-02: localStorage was not written when setItem threw',
    quotaStorage.getItem('todos') === null
);

// Verify via addTask return value in the sandbox
const quotaStorage2 = makeQuotaExceededStorage();
app = loadTaskApp({ localStorage: quotaStorage2 });
const addResult = app.sandbox.addTask('Direct call');
check(
    'NFR-02: addTask returns { success: true } even when saveTasks throws',
    addResult && addResult.success === true
);

// ---------------------------------------------------------------------------
// H-02 — const tasks never reassigned
// Verify loadTasks populates the array in-place by checking that pre-seeded
// tasks are present and that subsequent addTask calls accumulate correctly.
// ---------------------------------------------------------------------------
clearMockStorage();
mockLocalStorage.setItem('todos', JSON.stringify(['A', 'B', 'C']));
app = loadTaskApp({ localStorage: mockLocalStorage });
check(
    'H-02: in-place mutation loads all three pre-seeded tasks',
    app.elements['task-list'].children.length === 3
);

// After loading persisted tasks, adding another task must extend the list.
clearMockStorage();
mockLocalStorage.setItem('todos', JSON.stringify(['Existing']));
app = loadTaskApp({ localStorage: mockLocalStorage });
submitForm(app.elements, 'New task');
check(
    'H-02: in-memory tasks accumulate correctly after load + addTask',
    app.elements['task-list'].children.length === 2
);

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------
console.log(
    `\n${failures === 0
        ? 'ALL PERSISTENCE TESTS PASSED'
        : failures + ' PERSISTENCE TEST(S) FAILED'}`
);
process.exitCode = failures === 0 ? 0 : 1;
