# Requirements: Persist Tasks in LocalStorage

## Source
- Jira ticket: [TODO-10](https://thearchitect123.atlassian.net/browse/TODO-10) — "Persist Tasks in LocalStorage"
- Fetched: 2026-09-08
- Builds on: TODO-4 task-add functionality (`script.js` in-memory `tasks` array)

## User Story

> As a user,
> I want my tasks to still be there when I refresh the page or reopen the browser,
> So that I don't lose my list.

**Priority:** High | **Points:** 2

## Functional Requirements

| ID | Requirement | Acceptance Criterion |
|----|-------------|----------------------|
| FR-01 | On every task addition, the current task list must be serialised to JSON and written to `localStorage` under the key `todos`. | After calling `addTask()` successfully, `localStorage.getItem('todos')` returns a JSON array that includes the newly added task. |
| FR-02 | On every task deletion, the current task list must be serialised to JSON and written to `localStorage` under the key `todos`. | After a delete operation, `localStorage.getItem('todos')` returns a JSON array that no longer contains the deleted task. |
| FR-03 | On every task status change (e.g. marking complete/incomplete), the current task list must be serialised to JSON and written to `localStorage` under the key `todos`. | After toggling a task's status, `localStorage.getItem('todos')` returns a JSON array that reflects the updated status. |
| FR-04 | On page load (`DOMContentLoaded`), the app must read the `todos` key from `localStorage`, parse it, and render the stored tasks immediately — before any user interaction. | On a hard refresh, all previously saved tasks appear in the task list without requiring any user action. |
| FR-05 | The `localStorage` key used for persistence must be exactly `todos` and the stored value must be a valid JSON array. | `JSON.parse(localStorage.getItem('todos'))` returns an `Array`; each element represents one task. |
| FR-06 | If `localStorage` is empty (key absent or value is `null`), the app must start with an empty task list and must not throw an error. | When `localStorage` contains no `todos` key, the app loads cleanly with zero tasks rendered. |
| FR-07 | If the value stored under `todos` is not valid JSON (corrupted data), the app must silently recover and start with an empty task list — no crash, no unhandled exception. | Setting `localStorage.setItem('todos', 'NOT_JSON')` and loading the page results in an empty list and no JavaScript errors in the browser console. |

## Non-Functional Requirements

| ID | Category | Requirement |
|----|----------|-------------|
| NFR-01 | Error Resilience | All `localStorage` read operations must be wrapped in a `try/catch` block so that `JSON.parse` failures or browser security restrictions never cause an unhandled exception. |
| NFR-02 | Error Resilience | All `localStorage` write operations must be wrapped in a `try/catch` block so that quota-exceeded or security errors are caught and do not crash the application. A failed write may be silently ignored; the in-memory state remains authoritative. |
| NFR-03 | Performance | Persistence writes must be synchronous and complete within the same event-loop tick as the mutation. No debouncing or batching is required given the expected task-list size (< 1 000 items). |
| NFR-04 | Compatibility | The implementation must use the native `localStorage` Web API only — no third-party persistence libraries. |
| NFR-05 | Data Integrity | The JSON representation stored in `localStorage` must be the single, complete task list at the time of each write. Partial or incremental writes are not permitted. |
| NFR-06 | Observability | No new `console.error` or unhandled-rejection events must appear in the browser console during normal operation or during the graceful-degradation (corrupted data) path. |

## Constraints & Assumptions

- The app is plain vanilla JavaScript (`script.js` + `index.html`). The ticket description mentions React; this is incorrect — the actual codebase uses no framework.
- Tasks in the current codebase are stored as plain strings in an in-memory array (`const tasks = []`). The persistence layer will serialise this same array structure.
- `localStorage` is available in the target browser environments. Progressive enhancement for environments without `localStorage` is not required for this ticket.
- There is no server-side persistence; `localStorage` is the only storage target.

## Acceptance Criteria

- [ ] Tasks are saved to LocalStorage on every add, delete, or status change
- [ ] On page load, tasks are read from LocalStorage and rendered immediately
- [ ] If LocalStorage is empty or corrupted, the app starts with an empty list (no crash)
- [ ] The LocalStorage key used is `todos` and the value is a JSON array

## Out of Scope

- Server-side or database persistence
- Synchronisation of tasks across multiple browser tabs or devices
- Encryption or obfuscation of the stored task data
- Migration of stored data when the data model changes in a future ticket
- User-facing error messages when a `localStorage` write fails
- Any changes to the visual UI
- IndexedDB, sessionStorage, or cookie-based persistence
- Introducing a framework (React, Vue, etc.)

## Open Questions Resolved

None. All acceptance criteria were provided in the ticket and no ambiguities remain.

---

# Previous: Add a Task (TODO-4, archived)

## Source
- Jira ticket: [TODO-4](https://thearchitect123.atlassian.net/browse/TODO-4) — "TODO-2 — Add a Task"
- Fetched: 2026-09-07
- Builds on: [TODO-2](https://thearchitect123.atlassian.net/browse/TODO-2) base structure (`index.html`, `style.css`, `script.js`)

## User Story
As a user, I want to type a task and press a button to add it, so that I can record things I need to do.

## Functional Requirements
| ID | Requirement | Priority |
|---|---|---|
| FR-1 | A text input and an "Add" button must be visible on the page | High |
| FR-2 | Clicking "Add" with text in the input adds the task to a list below | High |
| FR-3 | The input clears after a task is successfully added | High |
| FR-4 | Submitting an empty or whitespace-only input shows an inline error message near the input and does not add a task | High |
| FR-5 | Pressing Enter in the input field also submits the task | High |

## Non-Functional Requirements
None explicitly stated in this ticket.

## Constraints & Assumptions
- Frontend only: HTML, CSS, Vanilla JavaScript — no frameworks or build tools
- Builds on the existing `index.html`/`style.css`/`script.js` structure from TODO-2 (the `<div id="app"></div>` placeholder)
- Storage: LocalStorage persistence is out of scope for this ticket unless a future ticket specifies it
- Inline error message is implemented as a simple text element shown/hidden near the input (not native browser `required` validation)
- Task list rendering and persistence beyond the current session are out of scope unless specified elsewhere

## Acceptance Criteria
- [ ] A text input and an "Add" button are visible on the page
- [ ] Clicking "Add" with text in the input adds the task to a list below
- [ ] The input clears after a task is added
- [ ] Submitting an empty or whitespace-only input shows an inline error message and does not add a task
- [ ] Pressing Enter in the input field also submits the task

## Open Questions Resolved
| Question | Answer |
|---|---|
| Q1: Jira priority field (Medium) vs. description text ("Priority: High") — which is authoritative? | High (per description text) |
| Q2: Does TODO-4 build on the TODO-2 base structure? | Yes |
| Q3: How should the inline error message be implemented? | Simple text element shown/hidden near the input |

---

# Previous: Project Setup & Base Structure (TODO-2, archived)

## Source
- Jira ticket: [TODO-2](https://thearchitect123.atlassian.net/browse/TODO-2)
- Fetched: 2026-08-31

## Functional Requirements
| ID | Requirement | Priority |
|---|---|---|
| FR-1 | Create `index.html` at the repository root with page title "TODO App" | High |
| FR-2 | `index.html` links to `style.css` (in `<head>`) and `script.js` (via `<script>` tag at end of `<body>`) | High |
| FR-3 | `index.html` `<head>` includes UTF-8 charset meta tag and viewport meta tag; no favicon required | Medium |
| FR-4 | `index.html` body contains an empty `<div id="app"></div>` placeholder container for future stories | High |
| FR-5 | Create `style.css` at the repository root with a minimal reset (margin: 0, padding: 0, box-sizing: border-box) | High |
| FR-6 | `style.css` centers page content both vertically and horizontally using flexbox on `body` | High |
| FR-7 | Create `script.js` at the repository root that logs "TODO App loaded" to the console on the `DOMContentLoaded` event | High |

## Non-Functional Requirements
| ID | Requirement | Category |
|---|---|---|
| NFR-1 | Opening `index.html` directly in a browser must show a blank page with no visible content besides the empty container | Usability |
| NFR-2 | No console errors or warnings on page load | Reliability |
| NFR-3 | No build tools, frameworks, or external dependencies required | Maintainability |

## Constraints & Assumptions
- Frontend only: HTML, CSS, Vanilla JavaScript — no frameworks
- Storage: Browser LocalStorage only — no backend or database (not used in this ticket)
- `index.html`, `style.css`, and `script.js` live at the repository root
- `script.js` is loaded via a `<script>` tag placed at the end of `<body>`, not `defer` in `<head>`

## Acceptance Criteria
- [ ] `index.html` exists with page title "TODO App" and links to `style.css` and `script.js`
- [ ] `index.html` `<head>` includes UTF-8 charset and viewport meta tags
- [ ] `index.html` body includes an empty `<div id="app"></div>`
- [ ] `style.css` exists with a minimal reset (margin/padding/box-sizing: border-box) and centers content via flexbox on `body`
- [ ] `script.js` exists and logs "TODO App loaded" to the console on `DOMContentLoaded`
- [ ] Opening `index.html` in a browser shows a blank page with no console errors

## Open Questions Resolved
| Question | Answer |
|---|---|
| Q1: Should a placeholder container be included for future stories to hook into? | Yes — an empty `<div id="app"></div>` in the body |
| Q2: What is the scope of the CSS reset? | Minimal reset only (margin/padding/box-sizing: border-box) |
| Q3: How should the layout be centered? | Flexbox on `body`, centered both vertically and horizontally |
| Q4: When should the console log fire? | On the `DOMContentLoaded` event |
| Q5: How should `script.js` be loaded? | `<script>` tag at the end of `<body>` (not `defer` in `<head>`) |
| Q6: Which meta tags are required? | UTF-8 charset and viewport; no favicon required |
| Q7: Where do the files live? | `index.html`, `style.css`, `script.js` at the repository root |
