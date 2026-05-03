---
name: write-plan
description: Use after write-spec to create a TDD implementation plan for a fin_plan feature. Reads the approved spec, resolves any implementation ambiguities through targeted questions, then writes a bite-sized task plan. Invoke with `/write-plan <feature-name>`.
---

# Write Plan (fin_plan)

Standalone skill for creating TDD implementation plans from approved feature specs.

**Announce:** "Writing implementation plan for `<feature-name>` using TDD."

## Phase 0: Implementation Audit

Before reading anything deeply, do a quick audit to understand how much already exists. This shapes how much exploration you need.

1. Read the spec's `## Implementation` section only (not the full spec yet) — it lists the schema models, API routes, and components the feature requires.
2. Use `Glob` and `Grep` to check whether the key files it names already exist (service files, route files, frontend components, test files). This takes 2–4 tool calls, not a full Explore agent.
3. Classify the feature:
   - **Mostly implemented (>80% of files exist):** Note the specific gaps. Scope all subsequent reading and exploration to those gaps only — skip reading files that are already complete.
   - **Partially or fully new:** Proceed with full exploration in Step 1.

This upfront check often reveals that a "backlog" feature just needs a small gap filled rather than a full build, which saves significant work in every subsequent step.

## Step 1: Load Spec and Read Supporting Files

Read the full spec: `docs/4. planning/<feature-name>/<feature-name>-spec.md`

If it doesn't exist, ask the user to run `/write-spec <feature-name>` first.

Then read supporting files in two tiers — the distinction matters for token efficiency:

**Context reads (excerpt only — 20–40 lines of the relevant section):**

- `apps/backend/prisma/schema.prisma` — confirm which models exist; read the relevant model definitions only, not the whole file
- `docs/4. planning/_implementation-plan.md` — phase context; read the section for this feature's phase only

**Full reads (needed completely to write accurate plan code):**

- `template.md` (in this skill's directory) — the plan template structure
- `examples/sample.md` (in this skill's directory) — fully-populated example showing format and code detail level
- The specific implementation files that will be **directly modified** (e.g. the existing service file, the existing test file, the existing route file) — you need their full contents to write accurate tests and implementations

Do not read files in full that you only need to confirm existence or skim for patterns. If the Phase 0 audit showed the feature is mostly implemented, only read the files relevant to the identified gaps.

## Step 2: Clarifying Questions

Before writing the plan, identify anything in the spec that would create ambiguity at implementation time. Ask the user one question at a time.

Ask when:

- A schema field's type, nullability, or relation is unclear
- An API endpoint's behaviour on error or edge case is unspecified
- A component's data-fetching strategy is ambiguous (tRPC query vs. subscription, RxDB vs. server)
- Test boundary is unclear (unit vs. integration vs. e2e)
- The spec's acceptance criteria could be satisfied by multiple different implementations

Do not ask about anything that can be resolved by reading the existing codebase.

## Step 3: Write the Plan

### Scope check

If the spec covers multiple independent subsystems, suggest breaking into separate plans — one per subsystem. Each plan should produce working, testable software on its own.

### Design agent (optional)

You only need a Plan design agent if there is genuine architectural ambiguity — for example, a new data model with unclear relations, a new caching strategy, or a pattern that doesn't exist yet in the codebase.

Skip the design agent when:

- All affected files are already identified from Phase 0 and Step 1
- The task is filling a clear gap in an existing pattern (add a method, add a route, add a button)
- No new architectural decisions are required

When in doubt, skip it and write the plan directly. A design agent adds cost; save it for when you genuinely need it.

### File structure mapping

Before defining tasks, map out which files will be created or modified and what each one is responsible for:

- Each file should have one clear responsibility
- Prefer smaller, focused files over large ones
- Files that change together should live together
- In existing codebases, follow established patterns

### Plan header

```markdown
# <Feature Name> Implementation Plan

> **For Claude:** Use `/execute-plan <feature-name>` to implement this plan task-by-task.

**Goal:** [one sentence]
**Spec:** `docs/4. planning/<feature-name>/<feature-name>-spec.md`
**Architecture:** [2–3 sentences]
**Tech Stack:** Fastify · Prisma · tRPC · Zod · React 18 · TanStack Query · Zustand · Tailwind
**Infrastructure Impact:**

- Touches `packages/shared/`: yes/no
- Requires DB migration: yes/no
```

Set `Touches packages/shared/` to `yes` if the plan includes any task creating or modifying files under `packages/shared/src/schemas/`. Set `Requires DB migration` to `yes` if the plan includes a `bun run db:migrate` step.

### TDD task structure

Each task follows red-green-commit:

````markdown
### Task N: [Component Name]

**Files:**

- Create: `exact/path/to/file.ts`
- Modify: `exact/path/to/existing.ts:123-145`
- Test: `tests/exact/path/to/test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// complete test code here
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/backend && bun scripts/run-tests.ts <pattern>`
Expected: FAIL with "[expected error]"

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
````

### Task guidelines

- Each task is one action (2-5 minutes)
- Complete code in plan — not "add validation" or "implement handler"
- Exact file paths always
- Exact commands with expected output
- DRY, YAGNI, TDD, frequent commits

### Task ordering

Follow this sequence:

1. Schema migration (`bun run db:migrate`)
2. Shared Zod schemas (`packages/shared/src/schemas/`)
3. Backend service layer with tests
4. tRPC router with tests
5. Frontend components and queries

### Breaking change impact analysis

After ordering tasks, trace every data contract that the feature modifies. The goal is to ensure that **no existing consumer of changed data is left broken**. This step catches the class of bugs where new code works but existing code silently receives `undefined`, `NaN`, or missing fields.

For each schema/model/type change in the plan:

1. **Identify the change**: field removed, field renamed, field moved to a new model, return type changed, endpoint removed.
2. **Trace all consumers**: Grep the codebase for every reference to the changed field, method, endpoint, or type. Include:
   - Backend services that read the field (e.g. `item.amount`)
   - Backend routes that call service methods and return data to the frontend
   - Frontend API service methods that call those routes
   - Frontend hooks that map/transform API responses
   - Frontend components that render the data
3. **For each consumer, verify the plan includes a task that updates it.** If not, add one.

Common blind spots to check explicitly:

- **List endpoints**: If a summary endpoint is updated to enrich data, are the individual `list*` endpoints also updated? (e.g. `listIncome` vs `getWaterfallSummary`)
- **Frontend mapping layers**: If the backend response shape changes, does the frontend hook that maps `r.field` to a local type also get updated? Explicit field-by-field mappings silently drop new fields.
- **Response assertions in tests**: If a field is removed from a model, do existing test assertions that check `res.json().field` get updated?
- **Shared type exports**: If a type is removed from `@finplan/shared`, are all frontend and backend imports updated?

If this analysis reveals missing tasks, add them to the plan in the correct position before proceeding to the plan review step.

### Category field

Set `category` in the plan frontmatter to the waterfall tier or cross-cutting concern this feature primarily serves. Valid values: `income`, `committed`, `discretionary`, `surplus`, `overview`, `ui`, `infrastructure`. This determines where the feature's docs are filed in `docs/5. built/<category>/` when `/execute-plan` marks it as implemented.

### Save location

Save to `docs/4. planning/<feature-name>/<feature-name>-plan.md`

Follow the document structure from `template.md` (Pre-conditions, Tasks, Testing, Verification, Post-conditions).

### Plan review

After writing the complete plan, dispatch a reviewer subagent with this focused checklist — not an open-ended review. The reviewer should work through these checks in order:

**Checklist checks (Glob/Grep only, no file reads):**

1. Are all file paths listed in the plan valid? (Glob each one)
2. Does every task have the failing-test → implementation → commit structure?
3. Are all mock objects in test files updated to include new methods?

**Code review** (read the implementation files listed in the plan — service, route, and test files being modified — but not context files like App.tsx, router registrations, or schema.prisma):

4. Do the test assertions match what the implementation actually returns?
5. Are side effects handled? (auth store updates, query cache invalidation, activeHouseholdId switching, etc.)
6. Any obvious TypeScript errors — wrong types, missing imports, incorrect destructuring?
7. Any redundant database queries (e.g. querying the same row twice when once would suffice)?

If issues are found: fix them and re-run the checklist (max 3 iterations). If approved: proceed to hand-off.

## Step 4: Hand Off to Execution

After saving the plan, tell the user:

> "Plan saved to `docs/4. planning/<feature-name>/<feature-name>-plan.md`.
>
> When you're ready to execute, start a new chat and run:
> `/execute-plan <feature-name>`"
