# Implementation Plan: Persist Tasks in LocalStorage (TODO-10)

## Tasks (dependency order)

| # | Task ID | Task | Component | Depends On | Priority | Status |
|---|---------|------|-----------|------------|----------|--------|
| 1 | T-01 | Add `saveTasks()` to `script.js`: wrap `localStorage.setItem('todos', JSON.stringify(tasks))` in a `try/catch` that silently swallows quota-exceeded and SecurityError (NFR-02) | Persistence Layer | — | High | Done |
| 2 | T-02 | Add `loadTasks()` to `script.js`: read `localStorage.getItem('todos')`, null-guard (FR-06), `JSON.parse` inside try/catch (FR-07, NFR-01), `Array.isArray` guard (H-01), per-element `typeof === 'string'` filter (M-03), in-place mutation `tasks.length = 0; tasks.push(...filtered)` (H-02) | Persistence Layer | T-01 | High | Done |
| 3 | T-03 | Call `loadTasks()` at the top of `initTaskForm()`, before the DOM element guard (M-01) | UI Layer — init | T-02 | High | Done |
| 4 | T-04 | Call `renderTaskList(list)` in `initTaskForm()` immediately after the DOM guard passes, so persisted tasks are rendered on page load (FR-04) | UI Layer — init | T-02, T-03 | High | Done |
| 5 | T-05 | Call `saveTasks()` from `addTask()` after `tasks.push(rawInput.trim())` (FR-01) | UI Layer — mutation | T-01 | High | Done |
| 6 | T-06 | Add localStorage mock infrastructure to `tests/dom-mock-helper.js`: `makeFreshLocalStorage()`, shared `mockLocalStorage` + `clearMockStorage()`, `makeQuotaExceededStorage()`, inject localStorage as a bare sandbox global in `loadTaskApp(overrides)` (M-02 from design-review) | Test Harness | T-01, T-02 | High | Done |
| 7 | T-07 | Write `tests/test-persistence.js`: test cases for FR-01, FR-04, FR-05, FR-06, FR-07, H-01, H-02, M-03, NFR-01, NFR-02; update `tests/test-edge-cases.js` to remove the stale "no localStorage reference" assertion and replace it with a graceful-degradation check | Tests | T-06 | High | Done |

## Blocked Tasks

None. All tasks were completed in order.

## Notes

- FR-02 (save on delete) and FR-03 (save on toggle) are out of scope for this ticket. `deleteTask()` and `toggleTask()` are not yet implemented in the codebase. `saveTasks()` is defined and ready to wire in from those future operations without modification.
- T-05 places the `saveTasks()` call inside `addTask()` (after the `tasks.push`) rather than in the form submit handler. This keeps persistence logic close to the state mutation and ensures any future direct caller of `addTask()` (e.g. from tests) also persists automatically.
- The `loadTaskApp(overrides)` signature in the test harness is a non-breaking extension: existing test files that call `loadTaskApp()` with no arguments continue to receive a fresh, isolated localStorage instance by default.
- Schema evolution risk: the current data model is `string[]`. When the future toggle ticket changes the model to `{text, done}[]`, a migration coercion must be added to `loadTasks()` before the type filter (see Open Risks in `docs/architecture.md`).
- All 11 test suites pass after this change (25 new persistence tests; 0 regressions in the 9 pre-existing suites).

---

# Previous: Add a Task (TODO-4, archived)

## Tasks (dependency order)
| # | Task | Component | Depends On | Priority | Blocked? | Status |
|---|---|---|---|---|---|---|
| 1 | Update `index.html`: add `<form id="task-form">` inside `#app` wrapping a text `<input>` and `<button type="submit">Add</button>`, an inline error element with `role="alert"` (initially hidden), and an empty `<ul id="task-list"></ul>` | UI Layer | — | High | No | Done |
| 2 | Define Task Manager data model in `script.js`: in-memory task array and the validate/add function signatures (trim input, reject empty/whitespace-only) | Task Manager | #1 | High | No | Done |
| 3 | Implement Event Handlers in `script.js`: single `submit` listener on `#task-form` calling `event.preventDefault()`, reading the input value, and delegating to the Task Manager | Event Handlers | #1, #2 | High | No | Done |
| 4 | Implement Task Manager logic: append valid trimmed task to the in-memory array, or signal invalid input; clear any previously shown error on success | Task Manager | #2 | High | No | Done |
| 5 | Write unit tests for Task Manager validation (empty input rejected, whitespace-only rejected, valid task appended, duplicates allowed) | Task Manager | #4 | High | No | Done |
| 6 | Implement Error Display in `script.js`: show/hide the inline `role="alert"` error element based on the Task Manager's validation outcome | Error Display | #1, #4 | High | No | Done |
| 7 | Write tests for Error Display show/hide behavior on invalid and valid submissions | Error Display | #6 | High | No | Done |
| 8 | Implement Renderer in `script.js`: rebuild `#task-list` DOM from the in-memory task array on every change, assigning task text via `textContent` (never `innerHTML`) | Renderer | #1, #4 | High | No | Done |
| 9 | Write tests for Renderer (list rebuilds with correct task text, `<script>`/HTML-like task text is rendered as inert text, not executed) | Renderer | #8 | High | No | Done |
| 10 | Wire Event Handler success path: clear the input field after a successful add (FR-3), leave input untouched on invalid submission | Event Handlers | #3, #4, #6 | High | No | Done |
| 11 | Write integration test covering full flow: type a task, submit via Add-button click, task appears in list and input clears | Event Handlers, Task Manager, Renderer | #10 | High | No | Done |
| 12 | Write integration test covering Enter-key submission producing identical behavior to Add-button click (FR-5) | Event Handlers | #10 | Medium | No | Done |
| 13 | Manual verification: submit empty/whitespace input and confirm the `role="alert"` error is announced and no task is added; confirm error clears on next valid submission | Error Display, Task Manager | #6, #10 | Medium | No | Done (substituted with automated equivalent — see Notes) |

## Blocked Tasks
| Task # | Blocked By | Reason |
|---|---|---|
| — | — | No blocked tasks; all dependencies are satisfied in sequence within this plan |

## Notes
- No LocalStorage/persistence tasks are included — explicitly out of scope per `docs/architecture.md` ("LocalStorage Schema: Not applicable for this ticket").
- No GitHub Actions/CI workflow task is included — none is described in `docs/architecture.md` for this feature.
- Task 1 assumes the TODO-2 base structure (`index.html`/`style.css`/`script.js`, `#app` container) already exists and is being extended, not recreated.
- Tasks 5, 7, 9, 11, and 12 are the automated-test tasks required to close the risks called out in `docs/design-review.md` (form `preventDefault`, `textContent`-only rendering, accessible error announcement).
- Task 13 substitutes manual verification for the accessibility announcement behavior, since no automated accessibility-tooling requirement is stated for this ticket. Verified via `tests/test-error-display.js`: the `role="alert"` error element (declared in `index.html` under task 1) toggles `hidden` correctly on invalid submission and clears on the next valid submission; a real-browser screen-reader check was not performed since this environment has no browser available.
- **Known pre-existing conflict (out of scope for tasks 3-13):** `tests/test-html-structure.js` (FR-4 check) and `tests/test-nfr1-blank-page.js` (all checks) still assert `#app` is empty per TODO-2's NFR-1 ("blank page with no visible content"). This assertion has been superseded by TODO-4's FR-1 ("a text input and Add button must be visible"), and started failing once task 1 added visible markup inside `#app`. Updating those TODO-2 tests is not a task in this plan, so they were left as-is; flagging for a follow-up ticket/plan update to retire or rewrite the obsolete NFR-1 blank-page assertions.
