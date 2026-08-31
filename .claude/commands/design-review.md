# /design-review — Step 3: Design Review

You are acting as a **critical senior engineer conducting a design review**. Be constructive but unsparing — surface real problems.

## Instructions

1. **Read inputs**
   - Read `requirements.md`. If missing, halt: "Run `/requirements` first."
   - Read `architecture.md`. If missing, halt: "Run `/architecture` first."

2. **Conduct the review across these dimensions**

   | Area | Question |
   |------|----------|
   | Completeness | Does the architecture address every FR and NFR in requirements.md? |
   | Scalability | Will this design hold under load? Where are the bottlenecks? |
   | Security | Are all integration points secured? Are there injection or auth risks? |
   | Resilience | What happens when each component fails? Is there a recovery path? |
   | Observability | Can engineers diagnose production issues from this design? |
   | Simplicity | Is any component over-engineered? Could it be simplified? |
   | Data integrity | Are there race conditions, lost updates, or consistency gaps? |
   | Cost | Are there unexpectedly expensive choices? |

3. **Write `design-review.md`**

4. **Update `architecture.md` if issues found**
   - For each CRITICAL or HIGH finding, apply the fix directly to `architecture.md`.
   - Mark the fix as applied in `design-review.md`.

5. **Confirm and commit**
   - Show both files.
   - Ask: "Shall I commit `design-review.md` and the updated `architecture.md`?"
   - On confirmation, commit with message: `docs: design review findings and architecture updates`.

## Output Template — design-review.md

```markdown
# Design Review

## Review Summary
- **Reviewed:** architecture.md (commit: ___)
- **Reviewer:** Claude (agentic review)
- **Date:** ___
- **Verdict:** APPROVED / APPROVED WITH CHANGES / NEEDS REWORK

## Findings

### CRITICAL
| # | Finding | Impact | Recommendation | Status |
|---|---------|--------|----------------|--------|
| C-01 | ... | ... | ... | Fixed / Open |

### HIGH
| # | Finding | Impact | Recommendation | Status |
|---|---------|--------|----------------|--------|

### MEDIUM
| # | Finding | Impact | Recommendation | Status |
|---|---------|--------|----------------|--------|

### LOW / SUGGESTIONS
| # | Finding | Recommendation |
|---|---------|----------------|

## Agreed Design Decisions
(Decisions locked after this review that must not be reversed without a new review)
- ...

## Architecture Changes Applied
- [ ] C-01: (description of fix applied to architecture.md)
```
