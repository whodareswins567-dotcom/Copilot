# Implementation Plan: Add a Task (TODO-4)

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

---

# Previous: Project Setup & Base Structure (TODO-2, archived)

## Tasks (dependency order)
| # | Task | Component | Depends On | Priority | Blocked? | Status |
|---|---|---|---|---|---|---|
| 1 | Set up repository root file structure — create empty `index.html`, `style.css`, `script.js` at repo root (no build tools/dependencies per NFR-3) | All | — | High | No | Done |
| 2 | Define `index.html` skeleton: `<!DOCTYPE html>`, `<html lang="en">`, `<head>` with UTF-8 charset meta, viewport meta, `<title>TODO App</title>` | UI Shell | #1 | High | No | Done |
| 3 | Add relative `<link href="style.css">` in `<head>` | UI Shell | #2 | High | No | Done |
| 4 | Add empty `<div id="app"></div>` placeholder in `<body>` | UI Shell | #2 | High | No | Done |
| 5 | Add relative `<script src="script.js"></script>` tag at end of `<body>` (not `defer` in `<head>`) | UI Shell | #2 | High | No | Done |
| 6 | Implement `style.css` minimal reset: `margin: 0`, `padding: 0`, `box-sizing: border-box` | Stylesheet | #1 | High | No | Done |
| 7 | Implement `style.css` flexbox centering on `body` (vertical + horizontal) | Stylesheet | #6 | High | No | Done |
| 8 | Implement `script.js` `DOMContentLoaded` listener logging `"TODO App loaded"` | Bootstrap Script | #1 | High | No | Done |
| 9 | Manual verification: open `index.html` directly in a browser, confirm blank page with only `#app` visible (NFR-1), console shows only the load log with no 404s/errors/warnings (NFR-2), and both asset links resolve via relative paths | UI Shell, Stylesheet, Bootstrap Script | #3, #4, #5, #7, #8 | High | No | Done (static validation — see Notes) |

## Blocked Tasks
| Task # | Blocked By | Reason |
|---|---|---|
| — | — | No blocked tasks; all dependencies are satisfied in sequence within this plan |

## Notes
- No component data model/interface tasks are needed — this ticket introduces no data, storage, or rendering logic (per architecture "LocalStorage Schema: Not applicable").
- Task 9 substitutes for automated tests since NFR-2 verification is explicitly manual (Event Flow step 6 in `docs/architecture.md`); no test framework is introduced (NFR-3).
- No GitHub Actions / CI workflow task is included — none is described in `docs/architecture.md` for this ticket.
- All file/asset paths must remain relative (no leading `/`) per the architecture's path-resolution rule for static, serverless file access.
