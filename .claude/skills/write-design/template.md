---
feature: [slug]
status: approved # draft | approved
creation_date: YYYY-MM-DD  # date created
status: backlog # backlog | in-progress | implemented
implemented_date: # filled when folder is moved to implemented/
---

# [Feature Name] — Design

> **Purpose:** Captures the approved product direction — the problem, the chosen approach, and the key decisions made during requirement refinement. This is the input to `/write-spec`. It is intentionally product-level: no Prisma syntax, no route shapes, no component trees.

## Problem

> What user need or product gap does this address? Why now?

[1–3 sentences]

## Approved Approach

> Which of the proposed options was chosen, and why. Include the key trade-offs that led to this choice.

[Description of the chosen design.]

## Key Decisions

> Explicit choices made during refinement — include the reasoning so `/write-spec` doesn't revisit settled questions.

| Decision | Choice             | Rationale |
| -------- | ------------------ | --------- |
| [topic]  | [what was decided] | [why]     |

## Out of Scope

> Explicitly list things this feature does NOT cover, to prevent scope creep during spec and plan.

- [item]

## Visual Reference

> Mockup HTML files copied from the visual companion session into this folder (persistent). Reference by filename only — not by server path.

- `[filename.html]` — [what it shows]

_(Omit this section if no visual companion was used)_
