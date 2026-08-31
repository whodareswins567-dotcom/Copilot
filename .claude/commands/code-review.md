# /code-review — Step 6: Code Review

You are acting as a **critical peer reviewer**. Your job is to find real problems in the implementation before the PR is created.

## Instructions

1. **Read inputs**
   - Read `requirements.md` and `architecture.md` for the spec.
   - Read `impl-plan.md` to know what was supposed to be built.
   - Use `git diff main` (or the base branch) to see all changed files.
   - Read each changed file in full before commenting on it.

2. **Evaluate every review dimension**

   | Review Area | Review Question |
   |-------------|-----------------|
   | Correctness | Does each component behave exactly as specified in requirements.md? |
   | Security | Are secrets excluded from output? Is all user input validated? Are there injection risks? |
   | Error Handling | Are all API failures, missing files, and empty/null responses handled gracefully? |
   | Test Coverage | Do tests cover the happy path AND the "Not Found" / missing-field / error edge cases? |
   | Code Clarity | Are function names self-explanatory? Is logic easy to follow without inline comments? |
   | DRY Principle | Is there duplicated logic that should be extracted into a shared function? |
   | Dependency Safety | Are there any packages with known CVEs or that are pinned to unsafe versions? |
   | Spec Alignment | Does every FR and NFR from requirements.md have corresponding code coverage? |

3. **Write `code-review.md`**

4. **Apply auto-fixable issues**
   - For LOW-severity findings that are clearly mechanical (typos, formatting, obvious DRY violations): fix them directly and note the fix.
   - For MEDIUM/HIGH/CRITICAL findings: document them and ask the user which to fix now vs. defer.

5. **Confirm and commit**
   - Ask: "Shall I commit `code-review.md`?"
   - Commit message: `docs: code review findings`.

## Output Template — code-review.md

```markdown
# Code Review

## Review Summary
- **Base branch diff:** main..HEAD
- **Files reviewed:** (list)
- **Verdict:** APPROVED / APPROVED WITH CHANGES / REQUEST CHANGES

## Findings

### CRITICAL — Must fix before merge
| # | File | Line | Issue | Recommendation |
|---|------|------|-------|----------------|

### HIGH — Should fix before merge
| # | File | Line | Issue | Recommendation |
|---|------|------|-------|----------------|

### MEDIUM — Fix or explicitly accept
| # | File | Line | Issue | Recommendation |
|---|------|------|-------|----------------|

### LOW / Suggestions
| # | File | Line | Issue | Recommendation |
|---|------|------|-------|----------------|

## Auto-Fixed Issues
- (list of fixes applied automatically)

## Test Coverage Assessment
- Happy path: COVERED / PARTIAL / MISSING
- Error paths: COVERED / PARTIAL / MISSING
- Edge cases: COVERED / PARTIAL / MISSING

## Dependency Safety
- (list any flagged packages, or "No vulnerable dependencies found")
```
