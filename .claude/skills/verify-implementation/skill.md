---
name: verify-implementation
description: Post-implementation verification — runs agent-browser functional check, security review, and accessibility audit on the completed feature. Moves the feature's planning folder to built on success. Can be invoked standalone or called by /execute-plan. Invoke with `/verify-implementation <feature-name>`.
---

# Verify Implementation (fin_plan)

Verifies a completed feature works correctly through functional, security, and accessibility checks.

**Announce:** "Verifying implementation of `<feature-name>`. I'll check it works in the browser, review security, and audit accessibility."

## Step 1: Load Context

Read the feature spec to understand what was built and what to verify:

- First check `docs/5. built/*/<feature-name>/<feature-name>-spec.md` (search across all category subdirs: income, committed, discretionary, surplus, overview, ui, infrastructure)
- Otherwise check `docs/4. planning/<feature-name>/<feature-name>-spec.md`

If the spec content is already in context from a prior step in this session (e.g. called from `/execute-plan`), skip the file read.

Extract the key user flows, acceptance criteria, and any UI components to verify.

## Step 2: Smoke Test

Before any deep review, do a quick smoke test against the running app to catch obvious breakage (NaN values, blank pages, missing UI elements, 500 errors). This catches the most common post-refactor issues in seconds.

1. **Check the app is running.** If not, ask the user to start it (`bun run start`).

2. **Hit the key API endpoints directly** using `curl` or `WebFetch` against `http://localhost:3001` (backend) — no browser needed:
   - GET the main data endpoint that the feature affects (e.g. `/api/waterfall` for waterfall features)
   - Scan the JSON response for `null`, `NaN`, `undefined`, or missing fields that should be present
   - If the feature added new endpoints, GET those too and verify they return valid data

3. **Load the key pages in the browser** using `agent-browser`:
   - Read `docs/3. architecture/testing/user-journey-testing.md` for the seeded test user credentials (email, password) — always use these to log in, never hard-code credentials in the skill
   - Navigate to each page the feature touches (typically 1–3 pages)
   - Take one screenshot per page
   - Visually scan for: NaN/undefined text, missing UI components, layout breakage, empty sections that should have data

4. **If smoke test finds issues:** Stop immediately and report them. Do not proceed to the deeper security/accessibility review — fix the breakage first, since broken functionality invalidates those reviews.

5. **If smoke test passes:** Proceed to Step 3.

## Step 3: Agent-Browser Functional Check

**Use the Skill tool** to invoke `agent-browser` for a deeper functional check in the running app.

**Credentials:** Read `docs/3. architecture/testing/user-journey-testing.md` for the seeded test user credentials (email, password). Always use these to log in — never hard-code credentials in prompts.

- Navigate to the implemented feature
- Walk through each key user flow defined in the spec
- Verify UI renders correctly, interactions work, and data flows as expected
- Screenshot evidence of key states (empty, populated, error, success)
- Test edge cases mentioned in the spec (zero data, limits, multi-member scenarios)

If the app is not running, ask the user to start it (`bun run start`) before proceeding.

**Efficiency guidelines for agent-browser:**

- Use `--session-name finplan` so login state persists across runs (no re-login on repeat runs)
- On first run, log in and then `agent-browser state save ~/.agent-browser/finplan.json`; on subsequent runs: `agent-browser state load ~/.agent-browser/finplan.json`
- Batch navigation + screenshot: `agent-browser open <url> && agent-browser wait --load networkidle && agent-browser screenshot --annotate`
- One annotated screenshot per key state is sufficient — do not take a plain snapshot then a separate screenshot of the same state
- Limit to 3–4 key states: empty, populated, interaction (e.g. click/edit), settings page

## Steps 4 + 5: Security Review and Accessibility Check (parallel)

Run both checks in parallel — dispatch the security review as a subagent **and** read the UI component files for the accessibility check in the same message.

### Security review subagent

Dispatch a general-purpose Agent with this task:

> You are reviewing a fin_plan feature implementation for security concerns.
>
> Feature: `<feature-name>`
> Spec acceptance criteria: `<extracted from Step 1>`
>
> Derive file paths from the spec's Implementation section (it names the routes, services, and schemas that were built) and read those files. If the spec doesn't provide explicit file paths, grep for them:
>
> ```bash
> grep -rl "<FeatureName>\|<featureName>\|<feature-name>" \
>   apps/backend/src/routes/ \
>   apps/backend/src/services/ \
>   packages/shared/src/schemas/
> ```
>
> Do not use `git diff main...HEAD` — on a long-running branch this returns 200+ files, almost all irrelevant.
>
> Check for:
>
> - **Authentication** — are all new routes JWT-protected? Any intentional exceptions?
> - **Authorisation** — can users only access their own household's data? Member roles respected?
> - **Input validation** — are all inputs validated via Zod schemas in `packages/shared`?
> - **Data exposure** — do API responses avoid leaking sensitive fields?
> - **Multi-tenancy** — any risk of cross-household data leakage?
>
> Report each concern with severity (Critical / High / Medium / Low), description, and file location. If no issues found, say so explicitly.

### Accessibility check (inline, parallel)

In the same message as the subagent dispatch, read the feature's new/changed UI component files (identified in Step 1). When both results return, check each component for:

- `type="button"` on all non-submit `<button>` elements
- `aria-label` on icon buttons and ambiguous controls (e.g. "Rename" when repeated per row)
- `<label htmlFor>` or `aria-label` on every form input
- Semantic structure: interactive sections use `<section aria-label>` or `<h2>`/`<h3>`, not bare `<div>`/`<p>`
- Contrast: are muted text elements using opacity modifiers (e.g. `/55`, `/60`) rather than flat `text-muted-foreground`?
- Focus: do custom `<button>` elements use the `<Button>` component (which carries `focus-visible:ring`) or have equivalent classes?

### Collect results

Wait for both to complete, then merge findings into a single list for Step 6.

## Step 6: Report

Present a verification report:

### If all checks pass:

> "Verification complete for `<feature-name>`. Functional check passed, no security concerns, accessibility audit clean."

### If issues found:

List each issue with:

- **Category** — Functional / Security / Accessibility
- **Severity** — Critical / High / Medium / Low
- **Description** — What's wrong
- **Location** — File path and line, or URL/route

Ask the user: "Would you like me to fix these now, or should we track them separately?"

If the user chooses to fix, address issues in priority order (Critical → High → Medium → Low) and re-verify after each fix.

## Step 7: Atomic Commits

Once all verification issues are resolved (or none were found), commit all changes introduced during this execution.

Use `git diff HEAD --name-only` to enumerate exactly the files that changed — do not manually guess or list files:

```bash
git diff HEAD --name-only
```

Review the list. Stage and commit in logical atomic units — each commit should represent one coherent change (schema, service layer, router, frontend, etc.):

```bash
git add <specific files from the list above>
git commit -m "<type>(<scope>): <description>"
```

Do not use `git add -A` or `git add .`. If something in the diff list looks unrelated to this feature, pause and ask the user before staging it.

**Note:** If a worktree was used, run this step inside the worktree directory — `git diff HEAD` is scoped to that branch automatically.

## Step 8: Mark as Implemented

Now that the feature is verified, move the entire planning folder to built.

Read the `category` field from the plan frontmatter to determine the destination subdirectory:

```bash
# Read category from plan frontmatter
category=$(grep '^category:' "docs/4. planning/<feature-name>/<feature-name>-plan.md" | sed 's/category: *//')

# Validate category is one of: income, committed, discretionary, surplus, overview, ui, infrastructure
# If missing or invalid, ask the user before proceeding.

# Move the entire feature folder (spec, plan, design docs, mockups, etc.)
mv "docs/4. planning/<feature-name>" "docs/5. built/$category/<feature-name>"
```

Commit the housekeeping:

```bash
git add "docs/5. built/" "docs/4. planning/"
git commit -m "docs: move <feature-name> to implemented"
```

## Step 9: Check Open Questions

Read the feature spec. If it contains an **Open Questions** section with unresolved items, append to the verification report:

> "**Unresolved Open Questions:**
>
> [list each open question]
>
> These may affect the feature's completeness. Consider resolving them as a follow-up."
