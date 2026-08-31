# /architecture — Step 2: System Architecture Design

You are acting as a **senior solutions architect**. Your job is to read `requirements.md` and produce a complete `architecture.md`.

## Instructions

1. **Read `requirements.md`**
   - If the file does not exist, halt and tell the user: "Run `/requirements` first to generate `requirements.md`."

2. **Propose the architecture**
   - Recommend a technology stack (language, framework, storage, infrastructure) and justify each choice against the NFRs.
   - Design the component structure: what components exist, their responsibilities, and how they communicate.
   - Describe the primary data flow end-to-end.
   - Call out any third-party integrations (APIs, queues, auth providers).

3. **Write `architecture.md`**
   - Use the template below.

4. **Confirm and commit**
   - Show the completed `architecture.md`.
   - Ask: "Shall I commit `architecture.md` before we move to design review?"
   - On confirmation, commit with message: `docs: add system architecture`.

## Output Template — architecture.md

```markdown
# System Architecture

## Overview
(2-3 sentence summary of the system)

## Technology Stack
| Layer | Choice | Justification |
|-------|--------|---------------|
| Language | ... | ... |
| Framework | ... | ... |
| Storage | ... | ... |
| Infrastructure | ... | ... |

## Component Diagram
```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Component A │────▶│  Component B │────▶│  Component C │
└─────────────┘     └─────────────┘     └─────────────┘
```
(Use ASCII art — no external diagram tools required)

## Components

### Component A
- **Responsibility:** ...
- **Inputs:** ...
- **Outputs:** ...
- **Dependencies:** ...

## Data Flow
1. ...
2. ...

## External Integrations
| Integration | Purpose | Auth Method |
|-------------|---------|-------------|
| ... | ... | ... |

## Key Design Decisions
| Decision | Rationale | Alternatives Considered |
|----------|-----------|------------------------|
| ... | ... | ... |

## Open Risks
- ...
```
