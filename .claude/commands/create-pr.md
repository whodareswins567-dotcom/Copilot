# /create-pr — Step 8: Create Pull Request

You are acting as a **release engineer completing the agentic SDLC cycle**. Your job is to create the PR with a complete, structured description.

## Instructions

1. **Pre-flight checks**
   - Verify `verification-report.md` exists and "Ready for PR" is YES. If not, halt: "Run `/verify` first and resolve any failures."
   - Run `git status` — confirm there are no uncommitted changes. If there are, ask the user whether to commit or stash them first.
   - Check the current branch is not `main`/`master`. If it is, ask the user to create a feature branch first.

2. **Gather PR content**
   - Read `requirements.md` → Summary and story reference.
   - Run `git diff main..HEAD --name-status` → list of changed files.
   - Read `verification-report.md` → test evidence.
   - Read `code-review.md` → known limitations.
   - Read `impl-plan.md` → scope confirmation.

3. **Write changelog entry**
   - Append an entry to `CHANGELOG.md` (create if missing, following Keep a Changelog format).
   - Commit with message: `chore: update changelog for <story title>`.

4. **Create the PR**
   - Push the current branch: confirm with user before pushing.
   - Create the PR using `gh pr create` with the full description below.
   - Output the PR URL to the user.

5. **Link PR back to Jira** (if a Jira issue key was used in `/requirements`)
   - Use the Atlassian MCP `addTeamworkGraphContext` tool to link the PR URL to the Jira issue.

## Required PR Description Sections

```markdown
## Summary
(2-3 sentences: what was built, why it was built, and what user story it fulfils)

## Changes Made
| File | Change Type | Reason |
|------|-------------|--------|
| requirements.md | Added | Captured and agreed requirements |
| architecture.md | Added | System design |
| design-review.md | Added | Design review findings |
| impl-plan.md | Added | Implementation task breakdown |
| ... | ... | ... |

## Test Evidence
\```
(paste the unit + integration test output summary from verification-report.md)
\```
CI: (link to CI run, or "running locally — see attached output")

## Known Limitations
- (anything marked "Not Found", deferred, or explicitly out of scope)
- (any open MEDIUM/LOW findings from code-review.md that were accepted)

## Reviewer Checklist
- [ ] Requirements in `requirements.md` are fully addressed by the implementation
- [ ] Architecture in `architecture.md` matches the code structure
- [ ] All CRITICAL and HIGH findings in `code-review.md` are resolved
- [ ] All tests pass (unit + integration)
- [ ] No secrets or credentials are committed
- [ ] `CHANGELOG.md` entry is accurate
- [ ] Branch is up to date with `main`
```

## CHANGELOG Entry Format

```markdown
## [Unreleased]

### Added
- <description of new capability> (closes <JIRA-key>)

### Changed
- ...

### Fixed
- ...
```
