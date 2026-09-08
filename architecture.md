# System Architecture

## Overview

This document describes the architecture for TODO-10: adding `localStorage` persistence to the existing vanilla JavaScript TODO app. The app is a single-page, no-framework application. Currently all tasks are held only in an in-memory array and are lost on page reload. This change introduces two thin helper functions — `loadTasks()` and `saveTasks()` — directly inside the existing `script.js`, giving the app read/write access to `localStorage` without adding any new files or dependencies.

---

## Technology Stack

| Layer | Choice | Justification |
|-------|--------|---------------|
| Language | Vanilla JavaScript (ES5-compatible) | Matches the existing codebase; no transpilation toolchain present |
| Persistence API | `window.localStorage` (native Web API) | Mandated by NFR-04; no third-party library permitted |
| Serialisation | `JSON.stringify` / `JSON.parse` (native) | Mandated by FR-05; zero-dependency, universally available |
| HTML/CSS | Unchanged — `index.html` + `style.css` | No UI changes required by this ticket |
| Test harness | Node.js `vm` + custom DOM mock (`dom-mock-helper.js`) | Existing pattern; new persistence tests extend it with a `localStorage` mock |

---

## Component Diagram

```
┌─────────────────────────────────────────────────────────┐
│                        index.html                        │
│  ┌──────────────────────────────────────────────────┐   │
│  │                    script.js                      │   │
│  │                                                   │   │
│  │  ┌──────────────┐    ┌──────────────────────┐   │   │
│  │  │  Task State  │    │  Persistence Layer   │   │   │
│  │  │              │    │                      │   │   │
│  │  │  const tasks │◀───│  loadTasks()         │   │   │
│  │  │  (array)     │───▶│  saveTasks()         │   │   │
│  │  └──────────────┘    └──────────┬───────────┘   │   │
│  │         │                       │               │   │
│  │  ┌──────▼──────┐                │               │   │
│  │  │   UI Layer  │                │               │   │
│  │  │             │                │               │   │
│  │  │  addTask()  │                │               │   │
│  │  │  renderTask │                │               │   │
│  │  │  List()     │                │               │   │
│  │  │  initTask   │                │               │   │
│  │  │  Form()     │                │               │   │
│  │  └─────────────┘                │               │   │
│  └──────────────────────────────── │ ──────────────┘   │
└──────────────────────────────────── │ ─────────────────┘
                                      │
                              ┌───────▼────────┐
                              │  localStorage  │
                              │  key: "todos"  │
                              │  val: JSON arr │
                              └────────────────┘
```

---

## Components

### Task State (`const tasks`)

- **Responsibility:** Single authoritative source of truth for the current task list at runtime. All reads and writes to the list go through this array.
- **Inputs:** Mutations from `addTask()` (and future `deleteTask()` / `toggleTask()`).
- **Outputs:** Read by `renderTaskList()` and `saveTasks()`.
- **Dependencies:** None — plain JavaScript array declared at module scope.

---

### Persistence Layer — `loadTasks()` and `saveTasks()`

These two functions are added to `script.js`. They form the only interface between the in-memory state and `localStorage`.

#### `loadTasks()`

- **Responsibility:** Read and deserialise the task list from `localStorage` on page load. Populate the `tasks` array. Leave `tasks` as `[]` silently on any error or unexpected shape.
- **Inputs:** `localStorage.getItem('todos')` — may be `null`, a valid JSON string, or corrupted data.
- **Outputs:** Fills the `tasks` array in place using `tasks.length = 0; tasks.push(...filtered)`; returns nothing.
- **Dependencies:** `localStorage` Web API, `JSON.parse`.
- **In-place mutation pattern (required):** `tasks` is declared `const`. It **must not** be reassigned. The only valid way to populate it from loaded data is:
  ```js
  tasks.length = 0;
  tasks.push(...filtered);
  ```
  Any attempt to write `tasks = parsed` will throw `TypeError: Assignment to constant variable`.
- **Validation pipeline (all three steps are required):**
  1. If `raw` is `null` (key absent), skip — `tasks` stays `[]` (FR-06).
  2. `JSON.parse(raw)` — on failure, the catch block leaves `tasks` as `[]` (FR-07, NFR-01).
  3. After a successful parse, verify `Array.isArray(parsed)`. `JSON.parse` can succeed and return `null`, a number, an object, or a string — none of these are iterable as a task list. If the result is not an array, treat it identically to a parse failure: leave `tasks` as `[]`.
  4. Filter elements: `parsed.filter(item => typeof item === 'string')`. Non-string elements (nulls, numbers, objects from a future schema) are silently dropped rather than allowing them to propagate to `renderTaskList()` and render as `"[object Object]"`.
- **Error handling:** Entire body wrapped in `try/catch`. All failure modes leave `tasks` as `[]` and suppress the error (NFR-01, FR-06, FR-07).

#### `saveTasks()`

- **Responsibility:** Serialise the current `tasks` array to JSON and write it to `localStorage` synchronously after every mutation.
- **Inputs:** The current state of the `tasks` array.
- **Outputs:** `localStorage.setItem('todos', jsonString)`.
- **Dependencies:** `localStorage` Web API, `JSON.stringify`.
- **Error handling:** Entire body wrapped in `try/catch`. On quota-exceeded or security errors the write is silently ignored; in-memory state remains intact and authoritative (NFR-02, NFR-05).

---

### UI Layer (`addTask`, `renderTaskList`, `initTaskForm`, `showTaskError`, `hideTaskError`)

- **Responsibility:** Handle form submission, validate input, update the `tasks` array via `addTask()`, and re-render the `<ul>` list on every change. Call `saveTasks()` after each successful mutation.
- **Inputs:** DOM events (form `submit`).
- **Outputs:** Updated DOM, updated `tasks` array, triggered `saveTasks()` call.
- **Dependencies:** Task State, Persistence Layer, DOM elements `#task-form`, `#task-input`, `#task-error`, `#task-list`.

---

## Data Flow

### Page Load (Read Path)

```
Browser fires DOMContentLoaded
  │
  ▼
initTaskForm() is called
  │
  ├─▶ loadTasks()   ← called BEFORE the DOM element guard
  │       │
  │       ├─▶ localStorage.getItem('todos')
  │       │       ├── null / absent    → tasks stays []  (FR-06)
  │       │       ├── not-null string  → JSON.parse(raw)
  │       │       │       ├── parse fails  → catch → tasks stays []  (FR-07)
  │       │       │       └── parse succeeds
  │       │       │               ├── !Array.isArray → tasks stays []  (H-01)
  │       │       │               └── is array  → filter(typeof === 'string')
  │       │       │                              → tasks.length=0; tasks.push(...filtered)
  │       │       └─▶ returns (tasks array now populated or empty)
  │
  ├─▶ DOM guard: if (!form || !input || !errorElement || !list) return
  │       └── if any element absent: tasks are loaded but nothing renders (acceptable)
  │
  ├─▶ renderTaskList(list)   ← renders whatever is in tasks[]
  └─▶ attach form 'submit' handler
```

### Add Task (Write Path)

```
User types text + submits form
  │
  ▼
form 'submit' event handler fires
  │
  ├─▶ addTask(input.value)
  │       │
  │       ├── invalid input → { success: false } → showTaskError()
  │       │
  │       └── valid input
  │               │
  │               ├─▶ tasks.push(trimmedText)
  │               ├─▶ saveTasks()
  │               │       │
  │               │       ├─▶ JSON.stringify(tasks)
  │               │       ├─▶ localStorage.setItem('todos', json)
  │               │       └─▶ on error: silently caught, tasks unchanged
  │               └── returns { success: true }
  │
  ├─▶ hideTaskError()
  ├─▶ renderTaskList(list)
  └─▶ input.value = ''
```

### Future Delete / Toggle Task (Write Path — not in scope for TODO-10)

```
User triggers delete or status toggle
  │
  ▼
deleteTask(index) or toggleTask(index)
  │
  ├─▶ mutate tasks[] (splice or property update)
  └─▶ saveTasks()   ← same function, no changes needed
```

---

## External Integrations

| Integration | Purpose | Auth Method |
|-------------|---------|-------------|
| `window.localStorage` | Persist task list across page reloads | None — same-origin browser API |

No external network APIs, auth providers, or message queues are required.

---

## Security Notes

- **XSS — `textContent` is mandatory for task rendering.** `renderTaskList()` sets `item.textContent = taskText`, which does not parse HTML. This is the only safe rendering path for user-supplied text loaded from `localStorage`. Any future change that replaces `textContent` with `innerHTML` would introduce stored-XSS, because `localStorage` data is under user control (the user can write to it via DevTools). This constraint must be preserved in all future rendering changes; a switch to `innerHTML` requires explicit sanitisation.
- **localStorage is same-origin only.** No cross-origin access to the stored data is possible.

---

## Known Limitations

- **Multi-tab clobber (accepted trade-off).** Two browser tabs at the same origin each maintain an independent in-memory `tasks` array. A save in Tab A will overwrite Tab B's data in localStorage; Tab B will not detect the change because no `storage` event listener is registered. On the next Tab B mutation, Tab A's data is permanently lost. Multi-tab synchronisation is explicitly out of scope for this ticket. This limitation should be noted in user documentation if the app is ever deployed.

---

## Key Design Decisions

| Decision | Rationale | Alternatives Considered |
|----------|-----------|------------------------|
| Inline `loadTasks()` / `saveTasks()` in `script.js` rather than a separate `storage.js` module | The test harness loads `script.js` as a single unit via Node.js `vm.runInContext`. A second file would require a module system (ES modules or CommonJS `require`) not currently present, plus `index.html` load-order management. Keeping all logic in one file matches the established codebase pattern and requires zero new infrastructure. | New `storage.js` loaded via a second `<script>` tag — rejected because it adds file-load order risk and breaks the existing test harness without significant rework. |
| Write the full `tasks` array on every mutation, synchronously | Matches NFR-03 (same event-loop tick) and NFR-05 (complete list, no incremental writes). Task lists of < 1 000 items as stated in requirements make synchronous whole-array writes negligible in cost. | Debounced/batched writes — rejected because NFR-03 explicitly forbids debouncing for this ticket's scale. |
| In-memory `tasks` array remains the single authoritative runtime source | Guarantees UI consistency even when a `localStorage` write fails (quota exceeded, private-browsing restriction). The store is treated as a best-effort persistence cache. | Read from `localStorage` on every render — rejected because it adds latency, complicates error handling, and is unnecessary given a single tab. |
| `loadTasks()` called at the *start* of `initTaskForm()`, before the DOM element guard | Task state must be populated regardless of whether form elements are present. Placing the call after the guard (`if (!form || !input …) return`) would silently skip persistence loading whenever any element is absent — this is especially problematic in test environments where not all elements are mocked. `loadTasks()` has no DOM dependency and must not be gated on DOM availability. `renderTaskList()` (which does require the list element) is called after the guard, once the DOM is confirmed present. | Calling `loadTasks()` at the top level of the script (outside any function) — rejected because it runs before the DOM is parsed and would require reordering existing code. |
| Silent recovery on `JSON.parse` failure (catch returns empty array, no `console.error`) | Satisfies FR-07 and NFR-06 — no unhandled exceptions, no console noise on the corrupted-data path. | Logging a warning on corruption — rejected by NFR-06 which prohibits new `console.error` calls during the graceful-degradation path. |

---

## Open Risks

- **No delete or toggle UI exists yet.** FR-02 and FR-03 specify persistence on delete and status change, but neither operation is implemented in the current codebase. The `saveTasks()` function will be called from those operations when they are built in subsequent tickets. If those tickets are delayed, FR-02 and FR-03 acceptance criteria cannot be verified against this ticket's implementation alone.
- **Schema evolution risk (HIGH — action required in the toggle/delete ticket).** The current data model is `string[]`. FR-03 requires persisting task completion status (done/not-done), which will require changing the model to `{text: string, done: boolean}[]`. Any user who has tasks saved by this ticket will have plain strings in localStorage. When the future ticket reads these with a new `loadTasks()` that expects objects, the per-element `typeof === 'string'` filter introduced here (M-03) will *drop* those entries, losing the user's data. The ticket implementing toggle **must** include a migration coercion before the type filter: `typeof item === 'string' ? { text: item, done: false } : item`. This is documented here so it is not overlooked.
- **localStorage quota.** Browsers enforce a per-origin storage quota (typically 5–10 MB). For task lists well under 1 000 items this is not a practical concern, but quota-exceeded errors are silently swallowed per NFR-02. There is no user-facing feedback when a write fails — this is explicitly out of scope per the requirements.
- **Private-browsing / restricted environments.** Some browsers throw a `SecurityError` when accessing `localStorage` in private mode with strict settings. The `try/catch` wrappers on both read and write guard against this, but the app will behave as if localStorage is unavailable (tasks not persisted between loads).
- **Test harness localStorage mock (required before verify step).** The existing test harness sets `window: {}` in the `vm` sandbox — `localStorage` is absent. Because `loadTasks()` and `saveTasks()` wrap all access in `try/catch`, a missing `localStorage` is silently caught and the functions become no-ops. This means tests that omit the mock will *pass* even though no persistence code ran — a false positive. The mock **must** be added to `dom-mock-helper.js` (or a new persistence test helper) before any persistence tests are written. Required interface:
  ```js
  const store = {};
  const mockLocalStorage = {
    getItem(key)         { return Object.prototype.hasOwnProperty.call(store, key) ? store[key] : null; },
    setItem(key, value)  { store[key] = String(value); },
    removeItem(key)      { delete store[key]; },
    clear()              { Object.keys(store).forEach(k => delete store[k]); },
  };
  // For quota-exceeded testing, replace setItem with a throwing version:
  mockLocalStorage.setItem = () => { throw Object.assign(new DOMException('QuotaExceededError'), { name: 'QuotaExceededError' }); };
  ```
  The sandbox passed to `vm.createContext` must include `localStorage: mockLocalStorage` (not nested under `window`) since `script.js` accesses `localStorage` as a bare global.
