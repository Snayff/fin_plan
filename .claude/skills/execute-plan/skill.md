---
name: execute-plan
description: Use after write-plan to execute a fin_plan implementation plan with subagents, then run code review, tests, and commit. Invoke with `/execute-plan <feature-name>`.
---

# Execute Plan (fin_plan)

Standalone skill for executing fin_plan implementation plans with subagents, quality gates, and atomic commits.

**Announce:** "Executing plan for `<feature-name>`. I'll run in batches with review checkpoints, then handle code review, tests, cleanup, and commit."

## Pre-check: Plan Mode Bypass

If plan mode is active when this skill is invoked:

1. Write a single line to the session plan file: "No planning needed — proceeding to execute-plan Step 0."
2. Call ExitPlanMode immediately — do not run Explore agents, do not ask questions.
3. Upon user approval, begin at Step 0 without any further planning workflow.

## Step 0: Pre-flight Check

Before loading the plan, determine the feature's current state using targeted searches — do not launch broad Explore agents yet.

**Check A — Already implemented?**

Run these two checks:

1. Does `docs/5. built/*/<feature-name>/` contain a spec or plan file? (search across all category subdirs: income, committed, discretionary, surplus, overview, ui, infrastructure)
2. Grep `apps/` and `packages/` for 2–3 key identifiers from the feature name (e.g., component names, route paths, service names).

**If the feature appears already implemented** (either check finds evidence):

- Do NOT launch broad Explore agents.
- Read the spec's acceptance criteria (from `docs/5. built/<category>/<feature-name>/<feature-name>-spec.md` if it exists, otherwise `docs/4. planning/`).
- Run targeted greps for each acceptance criterion — check whether it is present in the codebase.
- Report to the user: "This feature appears already implemented. Here are the gaps I found: [list gaps, or 'none found']."
- Ask whether to fill gaps, skip, or run `/verify-implementation <feature-name>`.
- Do not continue to Step 1 unless the user explicitly asks to proceed with execution.

**Check B — Plan file missing and not yet implemented?**

If `docs/4. planning/<feature-name>/<feature-name>-plan.md` does not exist and the feature is NOT already implemented, stop and ask the user to run `/write-plan <feature-name>` first.

**If plan file exists and feature is not yet implemented:** proceed to Step 0.5.

## Step 0.5: Worktree Decision

Read the **Infrastructure Impact** section from the plan header:

```bash
grep -A2 "Infrastructure Impact" "docs/4. planning/<feature-name>/<feature-name>-plan.md"
```

**If either field is `yes`, OR if the Infrastructure Impact section is absent (older plan file) → treat as shared:**

- Work on the current branch — do not create a worktree.
- Announce: "Shared infrastructure changes detected — working on current branch."
- Before proceeding, verify the working tree is clean:

```bash
git status --porcelain
```

If any uncommitted changes exist, stop and tell the user:

> "Working tree has uncommitted changes unrelated to this feature. Please stash or commit them before running execute-plan, so the commit step can scope changes correctly."

- Proceed to Step 1.

**If both fields are `no` (isolated feature):**

- Create a feature branch and worktree:

```bash
# Verify .worktrees/ is gitignored
git check-ignore -q .worktrees || echo ".worktrees" >> .gitignore

# Create worktree on a new branch
git worktree add .worktrees/<feature-name> -b feature/<feature-name>
cd .worktrees/<feature-name>
bun install --frozen-lockfile
```

- Announce: "Isolated feature — working in worktree at `.worktrees/<feature-name>` on branch `feature/<feature-name>`."
- All subsequent steps (code, tests, commits, doc moves) execute within this worktree path.
- Proceed to Step 1.

## Step 1: Load Plan

Read `docs/4. planning/<feature-name>/<feature-name>-plan.md`.

If it doesn't exist, ask the user to run `/write-plan <feature-name>` first.

**Do NOT enter plan mode. Do NOT re-explore the codebase. Do NOT raise concerns or ask questions unless something in the plan is outright contradictory or broken.** The plan was already reviewed and approved during `/write-plan`. Proceed directly to Step 1.5.

## Step 1.5: Execution Mode

Count the tasks in the plan. Ask the user:

> "This plan has **N tasks**. Which execution mode would you prefer?
>
> **A — Standard batch** (recommended for fewer than 5 tasks): ~3 tasks per batch, one subagent per batch.
>
> **B — Three-agent-per-task** (recommended for 5+ tasks): each task gets a dedicated implementer subagent, then a spec compliance reviewer, then a code quality reviewer. Higher quality gate — but costs ~10× more tokens.
>
> A or B?"

**If A (standard batch):** proceed to Step 2A.

**If B (three-agent-per-task):** proceed to Step 2B.

## Step 2A: Execute Tasks (standard batch)

Create a TodoWrite entry for every task in the plan.

Execute in batches of ~3 tasks using subagents:

- For each task: mark as in_progress → follow each step exactly as written → run verifications as specified → mark as completed
- After each batch, report progress and wait for user feedback before continuing
- Stop immediately if blocked — do not guess. Ask for clarification.

Never start implementation on main/master branch without explicit user consent.

## Step 2B: Execute Tasks (three-agent-per-task)

Create a TodoWrite entry for every task in the plan.

For each task, in sequence (never parallel — agents would conflict on shared files):

1. **Mark task `in_progress`.**

2. **Dispatch implementer subagent.** Give it the full task text (do not reference the plan file — paste the text directly). The subagent should:
   - Ask any clarifying questions upfront before writing any code
   - Follow the task's TDD steps exactly (failing test → implement → pass)
   - Self-review before reporting back
   - Use escape hatches if needed: `BLOCKED: <reason>`, `DONE_WITH_CONCERNS: <concern>`, `NEEDS_CONTEXT: <question>`

3. **If implementer reports BLOCKED or NEEDS_CONTEXT:** resolve it, then re-dispatch.

4. **Dispatch spec compliance reviewer.** Give it: the task's acceptance criteria and the implementer's diff. The reviewer must:
   - Read the actual implemented code (do not trust the implementer's summary)
   - Verify every requirement is met — nothing missing, nothing extra
   - Report PASS or FAIL with specific gaps

5. **If spec review FAILs:** return to step 2 with the gap list. Do not proceed until it passes.

6. **Dispatch code quality reviewer.** Give it: the implemented code. The reviewer checks:
   - Code structure and decomposition
   - Consistency with existing codebase patterns
   - Whether new or existing files have grown excessively large
   - No obvious TypeScript errors or redundant queries

7. **Mark task `completed`** once both reviews pass.

Never start implementation on main/master branch without explicit user consent.

## Step 3: Post-Execution Quality Sequence

Once all plan tasks are complete and verified, run this sequence in order. Do not skip steps or proceed past a failure without resolving it.

### 3a. Code Review

Review all changed code for:

- Correctness against the spec
- Consistency with existing codebase patterns
- Security concerns (auth, validation, data exposure)
- Test coverage

Apply all improvements before continuing.

### 3b. Tests — First Pass

Run the full test suite:

```bash
cd apps/backend && bun scripts/run-tests.ts
```

For frontend tests:

```bash
cd apps/frontend && bun run test
```

Fix every failure before continuing. If a fix is non-trivial, stop and discuss with the user.

### 3c. Lint and Type Check

```bash
bun run lint
bun run type-check
```

Fix all issues — zero warnings required.

## Step 4: Verify Implementation

**Use the Skill tool** to invoke `verify-implementation` with argument `<feature-name>`. Do not skip this step or summarise it inline — actually call the Skill tool now.

If verification surfaces issues, fix them before proceeding. Re-run verification after fixes.

## Step 5: Check Open Questions

Read the spec. If it contains an **Open Questions** section with unresolved items, surface them:

> "**Note:** The spec for `<feature-name>` has unresolved open questions:
>
> [list each open question]
>
> Consider resolving these next — they may affect the feature's completeness or correctness."

## Step 6: Done

Announce completion:

> "`<feature-name>` is complete. All tests pass, code reviewed, verified, committed."

**If a worktree was used**, also output:

> "Feature branch `feature/<feature-name>` is ready. To integrate:
>
> ````bash
> git checkout implementation
> git merge feature/<feature-name>
> git worktree remove .worktrees/<feature-name>
> ```"
> ````
