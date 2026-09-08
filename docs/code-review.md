# Code Review — TODO-10: Persist Tasks in LocalStorage

## Review Summary

- **Files reviewed:**
  - `script.js` (persistence layer additions)
  - `tests/dom-mock-helper.js` (localStorage mock infrastructure)
  - `tests/test-persistence.js` (new, 25 test cases)
  - `tests/test-edge-cases.js` (updated: removed obsolete localStorage-absence check, added new one)
- **Reference documents:** `docs/requirements.md`, `docs/architecture.md`, `docs/design-review.md`
- **Test run:** All 11 test suites pass — 0 regressions. 25 new persistence tests all PASS.
- **Verdict:** APPROVED WITH CHANGES

---

## Findings

### CRITICAL — Must fix before merge

_None._

---

### HIGH — Should fix before merge

_None._

---

### MEDIUM — Fix or explicitly accept

| # | File | Line | Issue | Recommendation |
|---|------|------|-------|----------------|
| M-01 | `tests/test-persistence.js` | 230–238 | **Missing storage-content assertion after load + add.** The H-02 accumulation test verifies the rendered list has 2 items after loading `['Existing']` and calling `addTask('New task')`, but does not assert that `mockLocalStorage.getItem('todos')` now contains both tasks. This leaves a gap in FR-01 + FR-04 integration coverage: the test confirms the in-memory list accumulated correctly but does not confirm `saveTasks()` persisted the merged result. | Add `check('H-02: storage contains both loaded and newly added tasks', JSON.parse(mockLocalStorage.getItem('todos')).length === 2)` immediately after the length assertion at line 237. |
| M-02 | `docs/impl-plan.md` | — | **TODO-10 implementation plan not written to `docs/impl-plan.md`.** `docs/impl-plan.md` still contains the TODO-4 plan. `CLAUDE.md` requires all SDLC phase documents to live in `docs/`. The TODO-10 tasks (T-01 through T-07) are described only in the ticket log's Step 4 notes, not in the canonical plan file. This makes it harder to verify implementation completeness from the plan document alone. | Update `docs/impl-plan.md` to prepend the TODO-10 plan (T-01 through T-07, all marked Done), following the cumulative-append pattern used in `docs/requirements.md`. |

---

### LOW / Suggestions

| # | File | Line | Issue | Recommendation |
|---|------|------|-------|----------------|
| L-01 | `script.js` | 48–57 | **`var`/`function()` style in `loadTasks()` inconsistent with surrounding ES6+ code.** `loadTasks()` uses `var` declarations and a `function(item)` callback while every other function in `script.js` uses `const`/`let` and arrow functions. The architecture table describes the target as "ES5-compatible" but the existing codebase already uses `const`, arrow functions, and template literals throughout. | **Auto-fixed:** `var raw/parsed/filtered` changed to `let`; the filter callback changed to an arrow function; `tasks.push.apply(tasks, filtered)` changed to `tasks.push(...filtered)`. (See Auto-Fixed Issues below.) |
| L-02 | `tests/dom-mock-helper.js` | 83–92 | **`makeQuotaExceededStorage` throws `Error` instead of `DOMException`.** The architecture spec (Open Risks section) shows `Object.assign(new DOMException('QuotaExceededError'), { name: 'QuotaExceededError' })`. The implementation uses `new Error(...)`. Because `saveTasks()`'s catch block is unconditional (`catch (_e)`), this has no functional impact today, but the mock is less faithful to the real browser exception type. | Replace `new Error('QuotaExceededError')` with `new DOMException('QuotaExceededError', 'QuotaExceededError')` in `makeQuotaExceededStorage`. Note: `DOMException` is available in Node.js v17+ as a global; for compatibility with older Node, keep `new Error` and accept the deviation. |
| L-03 | `tests/test-persistence.js` | 24–25 | **`console.assert` alongside `failures` counter is redundant and produces unexpected stderr output.** In Node.js v10+, `console.assert(false, label)` prints `Assertion failed: [label]` to stderr but does not throw. The `failures` counter in `check()` is the real tracking mechanism. On a test failure, both the `[FAIL]` line and a stderr assertion message appear, which can confuse CI log readers expecting a single output line per failure. This pattern is shared with other test files in the project, so changing it now would be inconsistent. | No change required now. Log a follow-up to standardize the test harness (e.g., replace `console.assert` calls with a `throw` or remove them) in a future test-infrastructure ticket. |
| L-04 | `tests/test-persistence.js` | — | **No explicit NFR-06 test (no new `console.error` on corrupted-data path).** NFR-06 prohibits new `console.error` events during normal operation and the graceful-degradation path. The FR-07 test confirms an empty list is rendered, but does not intercept `console.error` to assert it was never called. | Add a test that replaces `console.error` with a spy before loading the app with corrupted data, then asserts the spy was never called. This would provide direct coverage of NFR-06. |

---

## Auto-Fixed Issues

The following LOW-severity, mechanical issues were fixed directly before this review was written. All tests pass after the fix.

1. **`var` → `let` in `loadTasks()` (`script.js`, lines 49–54):** Three `var` declarations (`raw`, `parsed`, `filtered`) changed to `let` to match the ES6+ style used throughout `script.js`.
2. **`tasks.push.apply(tasks, filtered)` → `tasks.push(...filtered)` (`script.js`, line 57):** ES5-style `.apply()` call replaced with the spread operator, consistent with the rest of the codebase.
3. **`function(item)` → arrow function (`script.js`, line 53):** The filter callback updated to `(item) =>` for style consistency.

---

## Test Coverage Assessment

- **Happy path (add tasks, persist, reload):** COVERED — FR-01, FR-04, FR-05, H-02 tests all verify the read-write cycle. The load + add accumulation test is present but has a missing storage-content assertion (M-01 above).
- **Error paths (quota exceeded, storage unavailable):** COVERED — NFR-01 (undefined localStorage) and NFR-02 (quota-exceeded `setItem`) both have dedicated tests that verify in-memory state survives storage failure.
- **Edge cases (corrupted JSON, null JSON, object JSON, string JSON, non-string array elements):** COVERED — FR-07, H-01, M-03 tests cover all specified corruption scenarios.
- **Regression (pre-existing tests):** COVERED — All 9 pre-existing test suites pass with no regressions.

---

## Dependency Safety

No new packages or dependencies were introduced in this change. The implementation uses only native Node.js `vm` (test harness, already present) and native browser `localStorage` (Web API, no library). No known CVEs to report.

---

## Spec Alignment

| Requirement | Coverage | Notes |
|-------------|----------|-------|
| FR-01 save on add | Full | Tests + saveTasks() called from addTask() |
| FR-02 save on delete | Scoped out | deleteTask() not yet implemented; saveTasks() is defined and ready to wire |
| FR-03 save on toggle | Scoped out | toggleTask() not yet implemented; saveTasks() is defined and ready to wire |
| FR-04 load on DOMContentLoaded | Full | loadTasks() called before DOM guard in initTaskForm(); renderTaskList() called after guard |
| FR-05 key = 'todos', value = JSON array | Full | Hardcoded key; JSON.stringify/parse used |
| FR-06 empty storage → no crash | Full | null-check guard returns early; tested |
| FR-07 corrupted storage → empty list, no crash | Full | try/catch on JSON.parse; tested |
| NFR-01 read wrapped in try/catch | Full | Entire loadTasks() body is in try/catch |
| NFR-02 write wrapped in try/catch | Full | Entire saveTasks() body is in try/catch; quota-exceeded test confirms silent swallow |
| NFR-03 synchronous write | Full | setItem called synchronously in same call stack as mutation |
| NFR-04 native localStorage only | Full | No third-party library introduced |
| NFR-05 full array written each time | Full | JSON.stringify(tasks) serializes the complete array |
| NFR-06 no new console.error | Full (by inspection) | All catch blocks are empty; no console.error calls added; direct test coverage absent (see L-04) |
