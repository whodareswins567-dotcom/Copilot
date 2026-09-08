# Agentic SDLC Pipeline — Claude Code

This project implements a full **8-step Agentic Software Delivery Lifecycle (SDLC)** powered entirely by Claude Code. Every phase — from requirements to PR — is driven through Claude agents, skills, and hooks.

## How It Works

| Component | Location | Purpose |
|---|---|---|
| Project instructions | `CLAUDE.md` (this file) | Global rules and context for all agents |
| SDLC agents | `.claude/agents/*.md` | One agent per SDLC phase |
| Ticket logs | `logs/<ticket-id>_<slug>.md` | Per-ticket step log — state, results, resume point |
| Log template | `logs/_template.md` | Blank log file copied for each new ticket |
| Resume skill | `.claude/skills/resume.md` | `/resume` — picks up any ticket from its last completed step |
| Permissions + hooks | `.claude/settings.json` | Auto-allowed git/test commands + commit guard |
| Atlassian MCP | `.mcp.json` | Jira and Confluence integration |

## SDLC Phases

Invoke these agents in order to drive the complete lifecycle:

| Step | Agent | Output |
|---|---|---|
| 1 | `requirements` | `docs/requirements.md` |
| 2 | `architecture` | `docs/architecture.md` |
| 3 | `design-review` | `docs/design-review.md` (updates `docs/architecture.md`) |
| 4 | `impl-plan` | `docs/impl-plan.md` |
| 5 | `implement` | Source code + tests |
| 6 | `code-review` | `docs/code-review.md` |
| 7 | `verify` | Test output + `docs/verification-report.md` |
| 8 | `create-pr` | PR description, changelog, review checklist |

All agents live in `.claude/agents/`. An additional `sdlc-reviewer` agent is available at any step for independent adversarial review.

## General Behaviour Rules

- Always read the previous phase's output document before starting the next phase.
- Never skip a phase; if a document is missing, halt and prompt the user to run the prior agent.
- All generated SDLC phase documents (`requirements.md`, `architecture.md`, `design-review.md`, `impl-plan.md`, `code-review.md`, `verification-report.md`) live in the `docs/` directory. Never write them to the project root.
- When clarifying requirements or architecture, ask questions one at a time and wait for a response before asking the next.
- The human is the final approver at every gate. Never auto-merge or auto-push without explicit user confirmation.
- When acting as a reviewer (steps 3 and 6), be critical — surface real risks, not just praise.

## Ticket Logging Rules

- Every agent **must** read the ticket log at startup and write to it on completion — this is not optional.
- Log files live in `logs/` and are named `<ticket-id>_<slug>.md` (e.g. `TODO-123_add-user-auth.md`). When no Jira key exists, use `no-ticket_<slug>.md`.
- The `## State` block at the top of each log is the single source of truth for which step to resume from. Always keep it current.
- The `implement` agent updates the log **after every individual task**, not just at step completion — this enables mid-step resume.
- To resume any in-progress ticket, run `/resume` (invokes `.claude/skills/resume.md`).
- Log files are committed alongside their corresponding phase document.

## Project Context

- Source user stories may come from Jira, Confluence, or a local Word/text document.
- Commit each phase document before moving to the next step.
- Changelog lives in `CHANGELOG.md` at the project root.
- All tests go under `tests/`.

## Atlassian Integration

This project has the Atlassian MCP server connected. Use it to:
- Fetch user stories and acceptance criteria from Jira (`search` / `getJiraIssue`)
- Read technical specs from Confluence (`getConfluencePage` / `searchConfluenceUsingCql`)
- Create and link issues back after implementation

## Security Rules

- Never hard-code secrets, tokens, or credentials in any generated file.
- Validate all user input at system boundaries.
- Flag any dependency with a known CVE during the `code-review` agent step.
