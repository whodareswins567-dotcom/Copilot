# Agentic SDLC Pipeline — Claude Code

This project implements a full **8-step Agentic Software Delivery Lifecycle (SDLC)** powered entirely by Claude Code. Every phase — from requirements to PR — is driven through Claude agents, skills, and hooks.

## How This Maps from GitHub Copilot

| Copilot Feature | Claude Code Equivalent |
|---|---|
| Copilot Chat / CLI | Claude Code CLI + chat |
| Copilot Agent Mode | Claude agent mode (default) |
| `.github/copilot-instructions.md` | `CLAUDE.md` (this file) |
| Copilot custom instructions | `.claude/agents/*.md` subagents |
| Copilot prompt files | `.claude/agents/*.md` subagents |
| Copilot skills | Skills via `Skill` tool |
| Copilot hooks | `.claude/settings.json` hooks |

## SDLC Phases

Invoke these agents in order to drive the complete lifecycle:

| Step | Agent | Output |
|---|---|---|
| 1 | `requirements` | `requirements.md` |
| 2 | `architecture` | `architecture.md` |
| 3 | `design-review` | `design-review.md` (updates `architecture.md`) |
| 4 | `impl-plan` | `impl-plan.md` |
| 5 | `implement` | Source code + tests |
| 6 | `code-review` | `code-review.md` |
| 7 | `verify` | Test output + `verification-report.md` |
| 8 | `create-pr` | PR description, changelog, review checklist |

All agents live in `.claude/agents/`. An additional `sdlc-reviewer` agent is available at any step for independent adversarial review.

## General Behaviour Rules

- Always read the previous phase's output document before starting the next phase.
- Never skip a phase; if a document is missing, halt and prompt the user to run the prior agent.
- All generated documents live at the project root unless told otherwise.
- When clarifying requirements or architecture, ask questions one at a time and wait for a response before asking the next.
- The human is the final approver at every gate. Never auto-merge or auto-push without explicit user confirmation.
- When acting as a reviewer (steps 3 and 6), be critical — surface real risks, not just praise.

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
