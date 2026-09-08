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

- **Responsibility:** Read and deserialise the task list from `localStorage` on page load. Populate the `tasks` array. Return an empty array silently on any error.
- **Inputs:** `localStorage.getItem('todos')` — may be `null`, a valid JSON string, or corrupted data.
- **Outputs:** Fills the `tasks` array in place; returns nothing.
- **Dependencies:** `localStorage` Web API, `JSON.parse`.
- **Error handling:** Entire body wrapped in `try/catch`. On `null` (key absent), `JSON.parse` is skipped and `tasks` stays `[]`. On `JSON.parse` failure (corrupted data), the catch block leaves `tasks` as `[]` and suppresses the error (NFR-01, FR-06, FR-07).

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
  ├─▶ loadTasks()
  │       │
  │       ├─▶ localStorage.getItem('todos')
  │       │       ├── null / absent  → tasks stays []
  │       │       ├── valid JSON arr → JSON.parse → tasks populated
  │       │       └── invalid JSON  → catch block → tasks stays []
  │       └─▶ returns (tasks array now populated)
  │
  └─▶ renderTaskList(list)   ← renders whatever is in tasks[]
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

## Key Design Decisions

| Decision | Rationale | Alternatives Considered |
|----------|-----------|------------------------|
| Inline `loadTasks()` / `saveTasks()` in `script.js` rather than a separate `storage.js` module | The test harness loads `script.js` as a single unit via Node.js `vm.runInContext`. A second file would require a module system (ES modules or CommonJS `require`) not currently present, plus `index.html` load-order management. Keeping all logic in one file matches the established codebase pattern and requires zero new infrastructure. | New `storage.js` loaded via a second `<script>` tag — rejected because it adds file-load order risk and breaks the existing test harness without significant rework. |
| Write the full `tasks` array on every mutation, synchronously | Matches NFR-03 (same event-loop tick) and NFR-05 (complete list, no incremental writes). Task lists of < 1 000 items as stated in requirements make synchronous whole-array writes negligible in cost. | Debounced/batched writes — rejected because NFR-03 explicitly forbids debouncing for this ticket's scale. |
| In-memory `tasks` array remains the single authoritative runtime source | Guarantees UI consistency even when a `localStorage` write fails (quota exceeded, private-browsing restriction). The store is treated as a best-effort persistence cache. | Read from `localStorage` on every render — rejected because it adds latency, complicates error handling, and is unnecessary given a single tab. |
| `loadTasks()` populates `tasks[]` in place; called inside `initTaskForm()` before first render | Ensures tasks are available before the first `renderTaskList()` call. Centralises startup sequencing inside the existing `DOMContentLoaded` callback. | Calling `loadTasks()` at the top level of the script (outside any function) — rejected because it runs before the DOM is parsed and would require reordering existing code. |
| Silent recovery on `JSON.parse` failure (catch returns empty array, no `console.error`) | Satisfies FR-07 and NFR-06 — no unhandled exceptions, no console noise on the corrupted-data path. | Logging a warning on corruption — rejected by NFR-06 which prohibits new `console.error` calls during the graceful-degradation path. |

---

## Open Risks

- **No delete or toggle UI exists yet.** FR-02 and FR-03 specify persistence on delete and status change, but neither operation is implemented in the current codebase. The `saveTasks()` function will be called from those operations when they are built in subsequent tickets. If those tickets are delayed, FR-02 and FR-03 acceptance criteria cannot be verified against this ticket's implementation alone.
- **localStorage quota.** Browsers enforce a per-origin storage quota (typically 5–10 MB). For task lists well under 1 000 items this is not a practical concern, but quota-exceeded errors are silently swallowed per NFR-02. There is no user-facing feedback when a write fails — this is explicitly out of scope per the requirements.
- **Private-browsing / restricted environments.** Some browsers throw a `SecurityError` when accessing `localStorage` in private mode with strict settings. The `try/catch` wrappers on both read and write guard against this, but the app will behave as if localStorage is unavailable (tasks not persisted between loads).
- **Test harness localStorage mock.** The existing Node.js test harness (`dom-mock-helper.js`) has no `localStorage` mock. New tests for the persistence layer will need to add a `localStorage` stub to the sandbox object passed to `vm.createContext`. This is low-risk but must be done before the verify step.
