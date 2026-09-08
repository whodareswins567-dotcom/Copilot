# Design Review

## Review Summary

- **Reviewed:** `architecture.md`
- **Reviewer:** Claude (agentic review — senior engineer perspective)
- **Date:** 2026-09-08
- **Verdict:** APPROVED WITH CHANGES

---

## Findings

### CRITICAL

No critical findings.

---

### HIGH

| # | Finding | Impact | Recommendation | Status |
|---|---------|--------|----------------|--------|
| H-01 | `loadTasks()` has no `Array.isArray()` guard after `JSON.parse`. `JSON.parse('null')` returns `null`; `JSON.parse('{}')` returns an object; `JSON.parse('"x"')` returns a string. None of these throw, so they slip past the `try/catch`. When the code then tries to spread or iterate the result into `tasks`, it will throw a `TypeError` (`null` is not iterable). The architecture states "on `JSON.parse` failure the catch block leaves tasks as `[]`" — but these are *parse successes* that produce a non-array, so the catch never fires. | Silent `TypeError` at load time; the app partially loads with no tasks and a broken state with no user feedback. | After `JSON.parse`, add `if (!Array.isArray(parsed)) { return; }` before populating `tasks`. Applied to `architecture.md`. | Fixed |
| H-02 | `const tasks` in-place mutation strategy is unspecified. The architecture says `loadTasks()` will "populate the tasks array in place", but `const tasks = []` forbids reassignment. If the implementer writes `tasks = parsed`, they get an immediate `TypeError: Assignment to constant variable`. The correct approach (`tasks.length = 0; tasks.push(...loaded)` or `tasks.splice(0, tasks.length, ...loaded)`) is not stated anywhere. | High probability of a runtime error in implementation — this is the most natural mistake to make. | Explicitly document the in-place mutation pattern in the `loadTasks()` component description. Applied to `architecture.md`. | Fixed |
| H-03 | Schema evolution path is undefined. FR-03 requires persisting task completion status, but the current data model is `string[]`. Completion status (done/not-done) requires changing the model to `{text: string, done: boolean}[]`. When a future ticket makes this change, any existing `localStorage` entry containing plain strings will be loaded by the new `loadTasks()`. If that new loader expects objects, it will silently produce broken task objects or throw. The architecture notes delete/toggle as "not in scope" but does not describe how the schema change will be handled. | Silent data corruption on upgrade from the current string model to any richer object model. Affects every user who has existing tasks persisted by this ticket. | Document the schema evolution risk as an open risk in `architecture.md`. Recommend that the ticket implementing toggle defines a migration path (e.g., detect `typeof element === 'string'` and coerce to `{text: element, done: false}`). Applied to `architecture.md`. | Fixed |

---

### MEDIUM

| # | Finding | Impact | Recommendation | Status |
|---|---------|--------|----------------|--------|
| M-01 | `loadTasks()` is called inside `initTaskForm()`, which has a DOM guard (`if (!form || !input || !errorElement || !list) return`). If any DOM element is absent, `initTaskForm()` returns early and `loadTasks()` is never called. This means: (a) in test environments where elements are not mocked, stored tasks will never be loaded; (b) in a future where the DOM is rendered dynamically after `DOMContentLoaded`, the call will silently do nothing. The coupling of persistence logic to DOM availability is an architectural smell. | Tasks silently fail to restore in any context where a DOM element is absent or renamed. Debugging is difficult because there is no log output (NFR-06 forbids it). | Move `loadTasks()` call to *before* the DOM guard, or call it unconditionally at the `DOMContentLoaded` level. The task state should be populated regardless of whether the form UI is available. Applied to `architecture.md`. | Fixed |
| M-02 | The `localStorage` mock design is unspecified. The architecture says "new tests will need a localStorage stub" but provides no specification. The existing test harness at line 61 of `dom-mock-helper.js` sets `window: {}` with no `localStorage` property. Since `loadTasks()` and `saveTasks()` wrap access in `try/catch`, accessing `undefined.getItem` will be caught silently — meaning tests that omit the mock will *pass* even though the persistence path was never exercised. The happy path (storing and reloading tasks) cannot be verified without a proper mock. | False-positive tests: the test suite can show all green while the actual `loadTasks()` / `saveTasks()` code paths are never exercised. FR-01, FR-04, FR-06, and FR-07 acceptance criteria cannot be verified without a working mock. | Specify the required localStorage mock interface in `architecture.md`: must implement `getItem(key)`, `setItem(key, value)`, and a mechanism to simulate `DOMException` with `QuotaExceededError`. Applied to `architecture.md`. | Fixed |
| M-03 | No per-element type validation after loading. Even after `Array.isArray()` passes, individual elements could be `null`, numbers, or objects (e.g., written by a different system or a future ticket). `renderTaskList()` calls `item.textContent = taskText` — non-string values will not throw, but will render as `"[object Object]"` or `"null"`, silently corrupting the displayed list without any error. | Silent visual corruption; invalid data propagates to the rendered list and could be re-saved in corrupted form by a subsequent `saveTasks()` call. | After `Array.isArray` check, filter or validate elements: `parsed.filter(item => typeof item === 'string')` before populating tasks. Documented in `architecture.md`. | Fixed |

---

### LOW / SUGGESTIONS

| # | Finding | Recommendation |
|---|---------|----------------|
| L-01 | XSS safety is incidental, not documented. The current `renderTaskList()` uses `item.textContent = taskText`, which is XSS-safe. However, the architecture does not call this out as a security constraint. A future PR that changes to `innerHTML` (e.g., to support bold or emoji rendering) would silently introduce stored-XSS from localStorage data. | Add an explicit note in the architecture under Security that `textContent` must be used for task rendering, and that switching to `innerHTML` would require sanitisation of stored data. |
| L-02 | Multi-tab clobber is not documented. Two browser tabs at the same origin will each maintain their own in-memory `tasks` array. A save in Tab A overwrites Tab B's pending save, and Tab B will not detect the change. This is explicitly out of scope (requirements exclude multi-tab sync), but the consequences of the current design (last-write-wins, no `storage` event listener) should be documented as a known limitation. | Add a Known Limitations section to `architecture.md` listing multi-tab clobber as an accepted trade-off. |
| L-03 | `console.log('TODO App loaded')` is already present in the existing `DOMContentLoaded` handler. NFR-06 prohibits new `console.error` calls, but this existing `console.log` remains. Not a violation, but during the graceful-degradation (corrupted data) path, the app is silent — engineers debugging persistence failures in a browser console will see the startup log but nothing else. Consider allowing `console.warn` (not `console.error`) for the corruption path under a future ticket. | No change required now. Log in the ticket that silent failure is an accepted trade-off that makes production debugging difficult. |
| L-04 | The `initTaskForm()` function is currently the only caller of `renderTaskList()` at startup — but only via the submit event handler. The data flow diagram adds a `renderTaskList(list)` call after `loadTasks()` in `initTaskForm()`. This is a correct and necessary change (persisted tasks must render on load), but it is an **implicit behavioral change** to an existing function. It should be called out explicitly in the implementation notes so the implementer does not miss it. | The `impl-plan` agent should create an explicit task: "Add `renderTaskList(list)` call after `loadTasks()` within `initTaskForm()`." |

---

## Agreed Design Decisions

The following decisions from the architecture are confirmed as sound and require no changes:

- **Inline in `script.js`** — Adding a separate `storage.js` would require a module system not present in the codebase and would break the existing `vm`-based test harness. Correct call.
- **Synchronous full-array writes** — NFR-03 mandates same-tick writes and < 1 000 items makes this negligible. Debouncing would add complexity for no benefit at this scale.
- **In-memory array as authoritative source** — Avoids round-tripping through `localStorage` on every render, which would add latency and complicate the read path.
- **Silent failure on quota exceeded** — User-facing error messages are explicitly out of scope per requirements; in-memory state remains authoritative.
- **`todos` as the storage key** — Fixed key, consistent with FR-05.
- **`loadTasks()` reads once at startup, `saveTasks()` writes after every mutation** — Correct and simple pattern for single-tab, client-only persistence.

---

## Architecture Changes Applied

- [x] H-01: Added `Array.isArray(parsed)` guard to `loadTasks()` description. After a successful `JSON.parse`, validate `Array.isArray(parsed)` and treat a non-array result identically to a parse failure (leave `tasks` as `[]`).
- [x] H-02: Documented the required in-place mutation pattern in `loadTasks()`: `tasks.length = 0; tasks.push(...filtered)` — the only valid way to populate a `const`-declared array without reassignment.
- [x] H-03: Added schema evolution as an explicit Open Risk. Recommends that the toggle/delete ticket includes a coercion guard (`typeof element === 'string'` → `{text: element, done: false}`).
- [x] M-01: Updated the `loadTasks()` call site in the data flow and component description: `loadTasks()` must be called before the DOM guard check, so task state is populated even if form elements are absent.
- [x] M-02: Specified the required `localStorage` mock interface in the Test Harness section: must implement `getItem`, `setItem`, and a mechanism to throw `DOMException` on `setItem` for quota testing.
- [x] M-03: Added per-element string filter to `loadTasks()`: `parsed.filter(item => typeof item === 'string')` applied before populating `tasks`.
