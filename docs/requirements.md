# Requirements: Add a Task

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
