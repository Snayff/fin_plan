---
name: write-spec
description: Use after refine-requirement to write a formal fin_plan feature spec. Takes the approved design, fills any gaps through targeted questions, writes the spec using the project template, then runs UX and security review passes before presenting the final spec for approval. Invoke with `/write-spec <feature-name>`.
---

# Write Spec (fin_plan)

Produces a formal feature spec from an approved requirement design, with built-in UX and security review passes.

**Announce:** "Writing spec for `<feature-name>`. I'll fill any gaps, then run UX and security reviews before presenting it."

## Step 1: Load Context

Read in parallel:

- `docs/4. planning/<feature-name>/<feature-name>-design.md` — primary input (design doc from `/refine-requirement`)
- `docs/2. design/_design-readme.md` — consult this first to identify which design doc covers your specific need (tokens, components, patterns, anchors, or definitions)
- `docs/4. planning/_implementation-plan.md` — current phase context
- `template.md` (in this skill's directory) — the spec template to fill
- `examples/sample.md` (in this skill's directory) — a fully-populated example showing the expected format and level of detail

## Step 2: Clarifying Questions

Before writing anything, identify gaps in the design that would affect the spec's accuracy. For each gap, ask the user one question at a time and wait for a response before asking the next.

Ask when:

- A user story is unclear or could be interpreted multiple ways
- An acceptance criterion can't be written with confidence
- A schema field, API shape, or component is ambiguous
- A business rule is unspecified (e.g. what happens in edge case X?)

Do not ask about things Claude can determine independently from the design or existing codebase.

## Step 3: Write the Spec

Create the directory and spec file:

- **Path:** `docs/4. planning/<feature-name>/<feature-name>-spec.md`

Use the `template.md` loaded in Step 1. Fill every section — do not skip or rename sections.
Set `design_doc` to `docs/4. planning/<feature-name>/<feature-name>-design.md`.

Write the Implementation section at interface level — entities and relationships, operations and auth rules, UI units and responsibilities. Do NOT include Prisma syntax, HTTP routes, or component file paths; `/write-plan` produces those.

## Step 4: UX Review Pass

Review the spec against fin_plan's UX standards. Surface your reasoning as you go. Ask the user **only** when there is a genuine choice between two valid approaches — one question at a time, wait for response before continuing.

Check:

- **Waterfall model consistency** — does the feature respect the income → committed → discretionary → surplus flow?
- **Household multi-member support** — does the spec account for multiple members where relevant?
- **Pattern consistency** — does it follow conventions established in existing specs under `docs/4. planning/`?
- **Design system alignment** — are the right components, tokens, and motion patterns referenced?
- **State coverage** — loading, empty, error, and success states described?
- **Edge cases** — zero data, limits, conflicts between members?

Update the spec with any improvements from this pass.

## Step 5: Security Review Pass

Review the spec for security concerns relevant to fin_plan's stack (Fastify + Prisma + JWT + tRPC + Redis). Surface your reasoning. Ask the user **only** when there is a genuine choice — one question at a time.

Check:

- **Authentication** — are all new routes JWT-protected? Any that intentionally aren't?
- **Authorisation** — can users only access their own household's data? Member roles respected?
- **Input validation** — will all inputs be validated via Zod schemas in `packages/shared`?
- **Data exposure** — does the API response shape avoid leaking sensitive fields?
- **Rate limiting** — does the feature need specific rate limit rules?
- **CSRF** — any state-mutating actions exposed to the browser that need CSRF consideration?
- **Audit / PII** — does anything get logged that shouldn't (tokens, personal data)?
- **Multi-tenancy** — any risk of cross-household data leakage?

Update the spec with any security notes or constraints surfaced.

## Step 6: Present and Approve

Present the final spec to the user. Point out key decisions made in the UX and security passes. Ask for approval.

If the user requests changes, make them and re-present.

## Step 7: Hand Off to Implementation Plan

Once approved, confirm the file is saved at `docs/4. planning/<feature-name>/<feature-name>-spec.md`.

Tell the user:

> "Spec approved and saved to `docs/4. planning/<feature-name>/<feature-name>-spec.md`.
>
> When you're ready to write the implementation plan, start a new chat and run:
> `/write-plan <feature-name>`"
