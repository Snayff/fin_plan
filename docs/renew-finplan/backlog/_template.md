---
feature: [slug]
status: backlog # backlog | in-progress | implemented
priority: high # high | medium | low
deferred: false # true for intentionally postponed items
phase: # reference to implementation-plan.md phase number (optional)
implemented_date: # filled when folder is moved to implemented/
---

# [Feature Name]

## Intention

[Why this feature exists — the user need or design principle it serves. 1–3 sentences.]

## Description

[What it does — a brief functional summary. 2–4 sentences.]

## User Stories

- As a [user type], I want to [action] so that [outcome]
- ...

## Acceptance Criteria

- [ ] Specific, testable criterion
- [ ] ...

## Open Questions

- [ ] Unresolved design decisions or clarifications needed

---

## Implementation

### Schema

```prisma
// Relevant Prisma models. Include only fields that belong to this feature.
```

### API

```
METHOD  /path   → description
```

### Components

- `ComponentName.tsx` — brief description

### Notes

[Business logic, algorithms, or implementation constraints not covered above.]
