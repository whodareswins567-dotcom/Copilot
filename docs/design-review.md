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
