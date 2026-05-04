---
feature: [slug]
category: # income | committed | discretionary | surplus | overview | ui | infrastructure
spec: docs/4. planning/[feature]/[feature]-spec.md
creation_date: YYYY-MM-DD # date created
status: backlog # backlog | in-progress | implemented
implemented_date: # filled when folder is moved to implemented/
---

# [Feature Name] — Implementation Plan

> **For Claude:** Use `/execute-plan <feature-name>` to implement this plan task-by-task.

> **Purpose:** An ordered, task-by-task build guide. Each task follows TDD red-green-commit and contains complete, ready-to-run code — no "implement X" placeholders. This is the input to `/execute-plan`. The spec defines _what_ to build; this plan defines _how_.

**Goal:** [one sentence]
**Spec:** `docs/4. planning/<feature-name>/<feature-name>-spec.md`
**Architecture:** [2–3 sentences describing the technical approach]
**Tech Stack:** Fastify · Prisma · tRPC · Zod · React 18 · TanStack Query · Zustand · Tailwind

## Pre-conditions

> What must already exist before this work starts — prior phases, existing models, shared components.

- [ ] [dependency]

## Tasks

> Each task is one action (2–5 minutes), follows red-green-commit, and contains complete code. Tasks are ordered: schema → shared schemas → backend service → tRPC router → frontend components.

### Task 1: [Component Name]

**Files:**

- Create: `exact/path/to/file.ts`
- Modify: `exact/path/to/existing.ts`
- Test: `exact/path/to/test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// complete test code here
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/backend && bun scripts/run-tests.ts <pattern>`
Expected: FAIL — "[expected error message]"

- [ ] **Step 3: Write minimal implementation**

```typescript
// complete implementation code here
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/backend && bun scripts/run-tests.ts <pattern>`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add <specific files>
git commit -m "<type>(<scope>): <description>"
```

## Testing

> Key scenarios that must pass end-to-end, beyond the per-task tests above.

### Backend Tests

> Service-layer correctness, route auth, and edge cases.

- [ ] Service: [specific logic]
- [ ] Endpoint: [route behaviour]
- [ ] Edge case: [boundary condition]

### Frontend Tests

> Component rendering, interaction, and query/mutation behaviour.

- [ ] Component: [rendering or interaction]
- [ ] Hook: [query/mutation logic]

### Key Scenarios

- [ ] Happy path: [description]
- [ ] Error case: [description]
- [ ] Edge case: [description]

## Verification

> Commands to run after all tasks are complete. All must pass before marking done.

- [ ] `bun run build` passes clean
- [ ] `bun run lint` — zero warnings
- [ ] `cd apps/backend && bun scripts/run-tests.ts <pattern>` passes
- [ ] Manual: [end-to-end journey description]

## Post-conditions

> What this feature enables for subsequent phases or dependent work.

- [ ] [what this unlocks]
