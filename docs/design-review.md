# Design Review: Add a Task (TODO-4)

## Risks Identified
| Risk | Severity | Mitigation |
|---|---|---|
| `<form>` submit not prevented would cause a full page reload on Enter/click, wiping the in-memory task array and silently breaking FR-2, FR-3, and FR-5 | High | Architecture updated: single `submit` event listener on a `<form>` wrapping input+button, with `event.preventDefault()` called immediately, handling both the Add-button click and Enter keypress identically |
| Renderer inserting task text via `innerHTML` would let a task string like `<img src=x onerror=alert(1)>` execute as script (DOM-based XSS) | High | Architecture updated: Renderer responsibility now explicitly specifies `textContent` (never `innerHTML`) when writing task text into the DOM |
| No maximum input length — a very large pasted string is accepted as a "valid" task, adding an oversized DOM node and degrading render/scroll performance | Low | Not addressed for this ticket; acceptable given no NFR sets a limit. Recommend a future ticket define a max task length if abuse is observed |
| Renderer fully rebuilds the task list DOM on every add; for large task counts this is O(n) work per add | Low | Acceptable at expected scale (a manual single-user task list); no requirement anticipates thousands of tasks in one session |

## Gaps Identified
| Gap | Requirement | Resolution |
|---|---|---|
| Error message element had no accessible-announcement mechanism — a screen reader user submitting an empty task would not hear the inline error appear | FR-4 | Architecture updated: inline error element now specifies `role="alert"` so assistive tech announces it when shown |
| "Error Display" component's owning file was listed ambiguously as `script.js / index.html`, leaving unclear which file is responsible for show/hide logic vs. markup | FR-4 | Architecture updated: markup (`index.html`) declares the element; behavior (show/hide) is owned solely by `script.js` |
| No behavior specified for what happens to the error message on the *next* successful submission after a failed one | FR-2, FR-4 | Already covered in Event Flow step 4 ("valid" branch clears any previously shown error message) — confirmed no change needed |

## Open Questions
| Question | Decision |
|---|---|
| Should duplicate task text be rejected or silently allowed? | Not specified in requirements.md — treat as allowed (no dedup) for TODO-4; revisit only if a future ticket requires it |
| Should the task list container announce additions to assistive tech (e.g. `aria-live`)? | Out of scope for TODO-4 since no accessibility NFR is stated beyond the error message; flagged here for awareness, not blocking |

## Requirement Coverage Check
FR-1 (input + button visible) → UI Layer. FR-2 (Add adds task) → Event Handlers, Task Manager, Renderer. FR-3 (input clears) → Event Handlers. FR-4 (empty/whitespace error) → Task Manager, Error Display. FR-5 (Enter submits) → Event Handlers, now unified with FR-2 via the single form `submit` listener. All FR-1 through FR-5 map to at least one architecture component after the updates above; no orphaned requirements found. No NFRs are stated for TODO-4.

## Architecture Updates Made
- Event Handlers / UI Layer: Replaced separate click + keypress listeners with a single `<form>` `submit` listener plus `event.preventDefault()`, closing the risk of an unhandled default form submission reloading the page.
- Renderer: Added explicit requirement to use `textContent` instead of `innerHTML` when writing task text to the DOM, closing a DOM-based XSS risk.
- UI Layer / Error Display: Added `role="alert"` to the inline error element and clarified that `script.js` alone owns show/hide behavior.
- Trade-offs Considered: Replaced the deferred "form + preventDefault" trade-off entry with a resolved decision, since it is now a settled architectural choice rather than an implementation-stage detail.

## Sign-off
Review complete. Architecture is approved for implementation planning.

---

# Design Review: Project Setup & Base Structure (TODO-2)

## Risks Identified
| Risk | Severity | Mitigation |
|---|---|---|
| Asset links (`style.css`, `script.js`) using absolute or incorrect relative paths would 404 in DevTools, violating NFR-2 ("no console errors or warnings") | Medium | Architecture updated: UI Shell component now specifies relative paths (`href="style.css"`, `src="script.js"`) with no leading `/`, since the file is opened directly with no server. |
| No `<!DOCTYPE html>` or `<html lang>` declaration called out explicitly — omission risks quirks-mode rendering, which could break the flexbox centering (NFR-1) and is a general HTML5 best practice gap | Low | Architecture updated: UI Shell responsibility now explicitly requires `<!DOCTYPE html>` and `<html lang="en">`. |
| NFR-2 ("no console errors or warnings") had no corresponding verification step anywhere in the design — a functional requirement with no way to confirm it's met before sign-off | Medium | Architecture updated: Event Flow now includes a step 6 requiring a manual DevTools check for a clean console before the ticket is considered done. |

## Gaps Identified
| Gap | Requirement | Resolution |
|---|---|---|
| Components table said `index.html` defines "title" without stating the literal text, leaving room for an implementer to use the wrong string | FR-1 | Architecture updated: UI Shell responsibility now states `<title>TODO App</title>` explicitly. |
| No explicit design element enforcing NFR-2 (no console errors) | NFR-2 | Covered by the same Event Flow verification step and relative-path note added above. |

## Open Questions
| Question | Decision |
|---|---|
| Should `index.html` declare `lang="en"` even though no requirement mandates it? | Yes — standard HTML5 practice, zero cost, no conflict with any FR/NFR; added to architecture. |

## Requirement Coverage Check
All FR-1 through FR-7 and NFR-1 through NFR-3 map to at least one architecture component (UI Shell, Stylesheet, or Bootstrap Script) after the updates above. No orphaned requirements found.

## Architecture Updates Made
- **UI Shell (index.html)**: Added explicit `<!DOCTYPE html>`, `<html lang="en">`, literal `<title>TODO App</title>`, and relative-path requirement for `style.css`/`script.js` links.
- **Event Flow**: Added step 6 — a manual DevTools verification step confirming a clean console (no 404s, syntax errors, or warnings) before the feature is considered complete.

## Sign-off
Review complete. Architecture is approved for implementation planning.
