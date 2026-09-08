# Implementation Plan

## Summary

Add `localStorage` persistence to the existing vanilla JavaScript TODO app by
introducing two inline functions — `loadTasks()` and `saveTasks()` — inside
`script.js`, wiring them into the existing `initTaskForm()` and `addTask()`
call sites, extending the `vm`-based test harness with a `localStorage` mock,
and verifying every acceptance criterion with a dedicated test file.
Estimated scope: 7 tasks, ~5.5 hours total. No new files outside `script.js`
and the `tests/` directory; no new runtime dependencies.

---

## Task List

| ID | Category | Task | Depends On | Estimate | Status |
|----|----------|------|------------|----------|--------|
| T-01 | frontend | Add `saveTasks()` to `script.js`: wrap `JSON.stringify(tasks)` + `localStorage.setItem('todos', json)` in `try/catch`; silent no-op on any error | — | 30m | TODO |
| T-02 | frontend | Add `loadTasks()` to `script.js`: read `localStorage.getItem('todos')`, `JSON.parse`, `Array.isArray` guard, per-element `typeof item === 'string'` filter, then `tasks.length = 0; tasks.push(...filtered)`; entire body in `try/catch` | — | 1h | TODO |
| T-03 | frontend | Wire `loadTasks()` into `initTaskForm()`: call it as the **first line** of `initTaskForm()`, before the DOM guard `if (!form \|\| !input \|\| !errorElement \|\| !list) return` | T-02 | 15m | TODO |
| T-04 | frontend | Add `renderTaskList(list)` call in `initTaskForm()`: place it immediately after the DOM guard (after the `return` guard block) so persisted tasks render on every page load without user interaction | T-03 | 15m | TODO |
| T-05 | frontend | Wire `saveTasks()` into `addTask()`: call it immediately after `tasks.push(rawInput.trim())` in the valid-input branch | T-01 | 15m | TODO |
| T-06 | test | Add `localStorage` mock to `tests/dom-mock-helper.js`: implement `getItem`, `setItem`, `removeItem`, `clear` against a plain `store` object; expose a `clearMockStorage()` helper; add a `quotaExceededSetItem` throwing variant; inject `localStorage` as a bare global in the `vm.createContext` sandbox | — | 1h | TODO |
| T-07 | test | Write `tests/test-persistence.js`: cover FR-01, FR-04, FR-05, FR-06, FR-07; `Array.isArray` guard (null / object / string JSON); per-element string filter (M-03); quota-exceeded no-crash (NFR-02); in-place mutation correctness | T-01, T-02, T-03, T-04, T-05, T-06 | 2h | TODO |

---

## Task Detail

### T-01 — Add `saveTasks()`

**File:** `script.js`

**What to add** (new function, insert after `addTask`):

```js
function saveTasks() {
    try {
        localStorage.setItem('todos', JSON.stringify(tasks));
    } catch (_e) {
        // quota-exceeded or SecurityError — silently ignored; in-memory state
        // remains authoritative (NFR-02, NFR-05)
    }
}
```

**Acceptance criteria satisfied:** NFR-02 (write wrapped in try/catch), NFR-03
(synchronous, same event-loop tick), NFR-05 (complete list written), FR-05
(key is `todos`, value is JSON array).

---

### T-02 — Add `loadTasks()`

**File:** `script.js`

**What to add** (new function, insert after `saveTasks`):

```js
function loadTasks() {
    try {
        var raw = localStorage.getItem('todos');
        if (raw === null) { return; }          // FR-06: absent key → stay []
        var parsed = JSON.parse(raw);           // throws on bad JSON → catch
        if (!Array.isArray(parsed)) { return; } // H-01: non-array JSON → stay []
        var filtered = parsed.filter(function(item) {
            return typeof item === 'string';    // M-03: drop non-string elements
        });
        tasks.length = 0;                       // H-02: const — must NOT reassign
        tasks.push.apply(tasks, filtered);
    } catch (_e) {
        // JSON.parse failure or SecurityError — silently leave tasks as []
        // (FR-07, NFR-01, NFR-06: no console.error)
    }
}
```

**Acceptance criteria satisfied:** FR-04 (loads persisted tasks on page load),
FR-06 (null key → empty list), FR-07 (bad JSON → empty list, no crash),
NFR-01 (read in try/catch), NFR-06 (no console.error).

---

### T-03 — Wire `loadTasks()` before DOM guard in `initTaskForm()`

**File:** `script.js`

**Current `initTaskForm()` opening:**

```js
function initTaskForm() {
    const form = document.getElementById('task-form');
    const input = document.getElementById('task-input');
    const errorElement = document.getElementById('task-error');
    const list = document.getElementById('task-list');

    if (!form || !input || !errorElement || !list) {
        return;
    }
    // ...
```

**Change:** add `loadTasks();` as the very first statement, before the four
`getElementById` calls:

```js
function initTaskForm() {
    loadTasks();                                 // M-01: before DOM guard

    const form = document.getElementById('task-form');
    // ... rest unchanged
```

**Acceptance criteria satisfied:** FR-04 (state populated before DOM guard),
M-01 design finding (persistence not gated on DOM availability).

---

### T-04 — Add `renderTaskList(list)` after DOM guard in `initTaskForm()`

**File:** `script.js`

**Change:** add `renderTaskList(list);` immediately after the closing brace of
the DOM guard, before the `form.addEventListener` call:

```js
    if (!form || !input || !errorElement || !list) {
        return;
    }

    renderTaskList(list);                        // L-04: render persisted tasks

    form.addEventListener('submit', (event) => {
```

**Acceptance criteria satisfied:** FR-04 acceptance criterion ("all previously
saved tasks appear in the task list without requiring any user action").

---

### T-05 — Wire `saveTasks()` inside `addTask()`

**File:** `script.js`

**Current valid-input branch of `addTask()`:**

```js
    tasks.push(rawInput.trim());
    return { success: true };
```

**Change:** insert `saveTasks();` between push and return:

```js
    tasks.push(rawInput.trim());
    saveTasks();                                 // FR-01: persist on every add
    return { success: true };
```

**Acceptance criteria satisfied:** FR-01 (localStorage updated on every task
addition), NFR-03 (synchronous write in same tick as mutation).

---

### T-06 — Add `localStorage` mock to `tests/dom-mock-helper.js`

**File:** `tests/dom-mock-helper.js`

**What to add** (before `loadTaskApp`):

```js
// --- localStorage mock ---
let _store = {};

const mockLocalStorage = {
    getItem(key) {
        return Object.prototype.hasOwnProperty.call(_store, key)
            ? _store[key] : null;
    },
    setItem(key, value) { _store[key] = String(value); },
    removeItem(key)     { delete _store[key]; },
    clear()             { _store = {}; },
};

function clearMockStorage() { _store = {}; }

// For quota-exceeded tests: swap setItem with this before calling loadTaskApp.
function makeQuotaExceededStorage() {
    return Object.assign({}, mockLocalStorage, {
        setItem() {
            const err = new Error('QuotaExceededError');
            err.name = 'QuotaExceededError';
            throw err;
        },
    });
}
```

**Change to the sandbox line** inside `loadTaskApp`:

```js
// Before:
const sandbox = { document: mockDocument, console, window: {} };

// After (add localStorage as a bare global — script.js accesses it directly):
const sandbox = {
    document: mockDocument,
    console,
    window: {},
    localStorage: mockLocalStorage,
};
```

**Export additions:**

```js
module.exports = {
    loadTaskApp,
    submitForm,
    clearMockStorage,
    makeQuotaExceededStorage,
    mockLocalStorage,
};
```

**Acceptance criteria satisfied:** M-02 design finding (mock specified and
implemented); prerequisite for T-07 (without the mock, try/catch swallows all
localStorage access silently, producing false-positive test passes).

---

### T-07 — Write `tests/test-persistence.js`

**File:** `tests/test-persistence.js` (new file)

**Test cases to cover:**

| Test | Requirement |
|------|-------------|
| After `addTask`, `localStorage.getItem('todos')` includes the new task as a JSON string | FR-01 |
| After two `addTask` calls, JSON array has length 2 | FR-01, FR-05 |
| `JSON.parse(localStorage.getItem('todos'))` returns an `Array` | FR-05 |
| Pre-seeded storage: tasks appear in rendered list after DOMContentLoaded without any user action | FR-04 |
| Empty storage (no `todos` key): app loads with zero tasks, no error | FR-06 |
| Corrupted storage (`'NOT_JSON'`): app loads with zero tasks, no error | FR-07 |
| Non-array JSON (`null`, `{}`, `"string"`): app loads with zero tasks, no error | H-01 (Array.isArray guard) |
| Mixed-type array (`[42, null, "valid"]`): only `"valid"` is retained | M-03 (per-element filter) |
| Quota-exceeded on `setItem`: `addTask` returns `{ success: true }`, in-memory `tasks` length is 1, no unhandled error | NFR-02 |
| Absent `localStorage` in sandbox (simulate SecurityError): app loads cleanly, no crash | NFR-01 |

**Pattern to follow:** use the same `check(label, condition)` + `failures`
counter pattern from `test-task-manager.js`. Import
`{ loadTaskApp, submitForm, clearMockStorage, makeQuotaExceededStorage, mockLocalStorage }`
from `./dom-mock-helper`. Call `clearMockStorage()` in `beforeEach`-equivalent
reset at the top of each test block.

**Acceptance criteria satisfied:** All FR-01 / FR-04 / FR-05 / FR-06 / FR-07
acceptance criteria; NFR-01, NFR-02; H-01, M-03 design findings.

---

## Blocked Tasks

No tasks are blocked. T-01, T-02, and T-06 have no dependencies and can be
started immediately. T-03 and T-04 are sequentially dependent on T-02 but
unblocked once T-02 is done. T-05 is unblocked once T-01 is done. T-07 is
the only terminal task and is unblocked once all preceding tasks are complete.

---

## Out of Scope for This Sprint

- **FR-02** — persistence on task deletion: the `deleteTask()` function does
  not yet exist. When it is implemented in a future ticket, it must call
  `saveTasks()` after mutating `tasks`. The `saveTasks()` function itself
  (T-01) requires no changes at that point.
- **FR-03** — persistence on task status change: the `toggleTask()` function
  does not yet exist. The same note applies. The toggle ticket must also
  handle schema evolution (string → object migration, per the H-03 open risk
  documented in `architecture.md`).
- Multi-tab synchronisation (`storage` event listener).
- User-facing error messages when a `localStorage` write fails.
- Any changes to `index.html` or `style.css`.

---

## Definition of Done

- All TODO tasks reach DONE status.
- All tests pass (unit + integration): `node tests/test-persistence.js` exits
  with code 0; all existing test files continue to pass unchanged.
- `verification-report.md` is generated and clean.
- PR is created and passes reviewer checklist.
