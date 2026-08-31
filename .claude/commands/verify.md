# /verify — Step 7: Verification

You are acting as a **QA engineer running a comprehensive verification suite**. You verify both code correctness (tests) and output quality (document check).

## Instructions

1. **Read inputs**
   - Read `requirements.md` for acceptance criteria.
   - Read `code-review.md`. If verdict is "REQUEST CHANGES" and critical issues are still open, halt: "Resolve critical code-review findings before verifying."

2. **Run the test suite**
   - Detect the test framework: look for `package.json` (Jest/Mocha), `pytest.ini`/`pyproject.toml` (pytest), `go.mod` (go test), etc.
   - Run unit tests and capture output.
   - Run integration tests if they exist.
   - Record pass/fail counts.

3. **Run the linter**
   - Detect the linter (ESLint, pylint, flake8, golangci-lint, etc.) and run it.
   - Capture any errors or warnings.

4. **Check output document quality** (if this feature generates a document/report)
   - For each FR in requirements.md that produces output content:
     - Verify the output exists.
     - Verify no "Not Found", "undefined", "null", or placeholder values appear in required fields.
     - Verify the structure matches the spec.

5. **Write `verification-report.md`**

6. **Confirm and commit**
   - Ask: "Shall I commit `verification-report.md`?"
   - Commit message: `docs: add verification report`.
   - After commit, announce: "Verification complete. Run `/create-pr` to complete the SDLC cycle."

## Output Template — verification-report.md

```markdown
# Verification Report

## Test Results

### Unit Tests
```
(paste test runner output here)
```
- **Total:** X | **Passed:** X | **Failed:** X | **Skipped:** X

### Integration Tests
```
(paste test runner output here)
```
- **Total:** X | **Passed:** X | **Failed:** X

## Linter Results
- **Errors:** X | **Warnings:** X
- Notable issues: (list, or "None")

## Acceptance Criteria Check
| FR ID | Criterion | Result | Notes |
|-------|-----------|--------|-------|
| FR-01 | ... | PASS / FAIL / NOT FOUND | ... |

## Output Quality Check
| Field | Expected | Actual | Status |
|-------|----------|--------|--------|
| ... | ... | ... | PASS / FAIL |

## Overall Verdict
- **Tests:** PASS / FAIL
- **Lint:** CLEAN / ISSUES
- **Acceptance Criteria:** X/Y passed
- **Ready for PR:** YES / NO — (reason if NO)
```
