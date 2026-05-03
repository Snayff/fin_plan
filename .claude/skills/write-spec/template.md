---
feature: [slug]
design_doc: # docs/4. planning/<feature-name>/<feature-name>-design.md
creation_date: YYYY-MM-DD  # date created
status: backlog # backlog | in-progress | implemented
implemented_date: # filled when folder is moved to implemented/
---

# [Feature Name]

> **Purpose:** Captures _what_ the feature does and _why_ — user stories, acceptance criteria, and interface-level implementation constraints. This is the input to `/write-plan`. It is intentionally not a technical plan: no Prisma syntax, no route code, no component file paths.

## Intention

> Why this feature exists — the user need or design principle it serves. 1–3 sentences.

[Why this feature exists]

## Description

> What it does — a brief functional summary. 2–4 sentences.

[What it does]

## User Stories

- As a [user type], I want to [action] so that [outcome]
- ...

## Acceptance Criteria

> Specific, testable criteria that define done. Each criterion must be verifiable without reading the implementation.

- [ ] Specific, testable criterion
- [ ] ...

## Open Questions

> Unresolved decisions or clarifications needed before or during implementation. Mark resolved items with ~~strikethrough~~ and the decision taken.

- [ ] Unresolved design decisions or clarifications needed

---

## Implementation

> Interface-level constraints for the implementor. Describes _what_ is needed — entities, operations, UI units — without specifying _how_ to build them. `/write-plan` makes the technical decisions (Prisma syntax, route shapes, file paths, component code).

### Schema

> The logical data model — what entities are needed, their key fields and relationships, and any important constraints. Do NOT write Prisma syntax; `/write-plan` produces that.

- **[Entity]**: [key fields, relationships, and constraints in plain English]

### API

> What operations the backend needs to expose, who can call them, and any auth or multi-tenancy rules. Do NOT write HTTP routes; `/write-plan` produces those.

- [Operation description] — [auth requirement, e.g. JWT-protected, household-scoped]

### Components

> What UI units are needed and what each is responsible for. Do NOT write file paths or component code; `/write-plan` produces those.

- **[ComponentName]** — [responsibility and key behaviour]

### Notes

> Business logic, algorithms, edge case rules, or constraints that don't fit the sections above.

[Business logic, algorithms, or implementation constraints not covered above.]
