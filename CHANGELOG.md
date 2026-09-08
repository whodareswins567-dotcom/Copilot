# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [Unreleased]

### Added
- `saveTasks()` function in `script.js`: serialises the full in-memory `tasks` array to `localStorage` under the key `todos` on every task addition; write wrapped in `try/catch` so quota-exceeded and security errors are silently ignored (closes TODO-10).
- `loadTasks()` function in `script.js`: reads and parses `localStorage.todos` on `DOMContentLoaded`; guards against null, corrupted JSON, non-array values, and non-string elements; in-place mutation of the shared `tasks` array preserves existing references (closes TODO-10).
- `tests/test-persistence.js`: 25 new test cases covering FR-01, FR-04, FR-05, FR-06, FR-07, NFR-01, NFR-02, and edge cases (null/object/string JSON, per-element type filter, quota-exceeded, missing localStorage) (closes TODO-10).
- localStorage mock infrastructure (`makeFreshLocalStorage`, `makeQuotaExceededStorage`, `clearMockStorage`) added to `tests/dom-mock-helper.js` to support persistence tests in the Node.js/vm test harness.
- `docs/verification-report.md`: verification report for TODO-10 (101/101 tests passing across 12 suites).
- `docs/code-review.md`: code-review findings for TODO-10 (0 CRITICAL, 0 HIGH, 2 MEDIUM, 4 LOW; all LOW auto-fixed).
- `docs/impl-plan.md`: implementation plan for TODO-10 (T-01 through T-07, all completed).
- `docs/architecture.md`: updated with persistence layer design (loadTasks / saveTasks, error-resilience strategy, schema evolution risk note).
- `docs/design-review.md`: design review findings for TODO-10 (APPROVED WITH CHANGES; all HIGH findings resolved in architecture).
- `docs/requirements.md`: requirements for TODO-10 captured from Jira.
- `logs/TODO-10_persist-tasks-localstorage.md`: per-ticket SDLC step log.
- `.claude/agents/`: full set of SDLC phase agent definitions for the agentic pipeline.
- `CLAUDE.md`: project-level instructions for the agentic SDLC pipeline.

### Changed
- `script.js`: `addTask()` now calls `saveTasks()` after every successful task push; `initTaskForm()` calls `loadTasks()` then `renderTaskList()` on `DOMContentLoaded` so previously persisted tasks are rendered immediately on page load.
- `tests/dom-mock-helper.js`: `loadTaskApp(overrides)` extended to inject a fresh `localStorage` mock into the vm sandbox by default; existing callers with no arguments are unaffected.
- `tests/test-edge-cases.js`: stale "no localStorage reference" assertion removed; replaced with graceful-degradation check confirming the app functions when `localStorage` is undefined.
