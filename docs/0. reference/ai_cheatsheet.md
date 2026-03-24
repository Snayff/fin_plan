# AI Cheatsheet

Quick reference for all AI-assisted workflows, commands, and skills available to fin_plan.

`command` = slash-invoked (`/name`). `skill` = context-activated (reference by name and Claude uses it automatically).

---

## Feature Workflow

Every new feature follows this pipeline. Each step chains to the next.

```
/brainstorm  →  /write-spec  →  /write-plan  →  /execute-plan <name>
```

| Step            | What happens                                                                                                  | Output                                                             |
| --------------- | ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| `/brainstorm`   | Reads design anchors, design system, and implementation plan. Asks clarifying questions one at a time.        | Approved design doc in `docs/plans/`                               |
| `/write-spec`   | Takes approved design, fills gaps with targeted questions. Runs UX review pass then security review pass.     | Spec in `docs/4. planning/<feature>/<feature>-spec.md`             |
| `/write-plan`   | Creates TDD task plan (failing test → implement → pass → commit). Tasks ordered: schema → shared → BE → FE.   | Plan in `docs/4. planning/<feature>/<feature>-plan.md`             |
| `/execute-plan` | Runs ~3 tasks per batch with review checkpoints. Post-execution: code review → tests → simplify → lint/types. | Spec moved to `docs/5. built/<feature>/`, `implemented.md` updated |

**Post-execution quality sequence** (run by `/execute-plan` in this order):

1. Code review via `requesting-code-review`
2. Tests — `cd apps/backend && bun scripts/run-tests.ts` + `cd apps/frontend && bun run test`
3. Simplify via `/simplify`
4. Tests — second pass (verify no regressions from simplification)
5. Lint & type check — `bun run lint` + `bun run type-check`
6. Atomic commits — explicit `git add <files>`, never `git add -A`

---

## Design & Build

| Name               | Type    | Description                                                                |
| ------------------ | ------- | -------------------------------------------------------------------------- |
| `/brainstorm`      | command | Collaborative design exploration — Socratic dialogue with fin_plan context |
| `/write-spec`      | command | Formal feature spec from approved design, with UX + security review        |
| `/write-plan`      | command | TDD implementation plan from approved spec                                 |
| `/execute-plan`    | command | Execute plan with subagents, quality gates, and atomic commits             |
| `/frontend-design` | command | Create distinctive, production-grade frontend interfaces                   |
| `brainstorming`    | skill   | Socratic design refinement through iterative dialogue                      |
| `writing-plans`    | skill   | Bite-sized, task-based implementation plans                                |
| `executing-plans`  | skill   | Batch execution (~3 tasks) with checkpoint reviews                         |
| `shadcn`           | skill   | Component discovery, installation, styling and composition for shadcn/ui   |

---

## Review & Audit

| Name                     | Type    | Description                                                                |
| ------------------------ | ------- | -------------------------------------------------------------------------- |
| `/audit`                 | command | Comprehensive audit across accessibility, performance, theming, responsive |
| `/critique`              | command | UX evaluation — visual hierarchy, information architecture, emotional tone |
| `/simplify`              | command | Review changed code for reuse, quality, and efficiency — fix issues found  |
| `requesting-code-review` | skill   | Pre-review checklist and structured review request                         |
| `receiving-code-review`  | skill   | Technical evaluation and feedback handling                                 |

---

## Refine

| Name         | Type    | Description                                                                           |
| ------------ | ------- | ------------------------------------------------------------------------------------- |
| `/bolder`    | command | Amplify safe or boring designs — increase impact                                      |
| `/quieter`   | command | Tone down overly bold or aggressive designs                                           |
| `/distill`   | command | Strip to essence — remove unnecessary complexity                                      |
| `/colorize`  | command | Add strategic colour to monochromatic interfaces                                      |
| `/animate`   | command | Add purposeful animations, micro-interactions, motion effects                         |
| `/delight`   | command | Add moments of joy, personality, and unexpected touches                               |
| `/typeset`   | command | Fix font choices, hierarchy, sizing, weight, readability                              |
| `/arrange`   | command | Fix layout, spacing, visual rhythm — improve composition                              |
| `/normalize` | command | Align with your design system — ensure consistency                                    |
| `/overdrive` | command | Technically ambitious effects — shaders, spring physics, scroll-driven reveals (beta) |

---

## Harden & Ship

| Name        | Type    | Description                                                              |
| ----------- | ------- | ------------------------------------------------------------------------ |
| `/polish`   | command | Final quality pass — alignment, spacing, consistency, detail             |
| `/harden`   | command | Error handling, i18n, text overflow, edge cases — production-ready       |
| `/optimize` | command | Performance — loading, rendering, animations, images, bundle size        |
| `/adapt`    | command | Responsive — different screen sizes, devices, contexts, platforms        |
| `/clarify`  | command | Improve UX copy, error messages, labels, microcopy                       |
| `/onboard`  | command | Design onboarding flows, empty states, first-time user experiences       |
| `/extract`  | command | Extract reusable components, tokens, and patterns into the design system |

---

## Test & QA

| Name                             | Type    | Description                                                                                        |
| -------------------------------- | ------- | -------------------------------------------------------------------------------------------------- |
| `/dogfood`                       | command | Systematic QA / exploratory testing — structured report with screenshots, videos, and repro steps  |
| `/agent-browser`                 | command | Browser automation — navigate, fill forms, click, screenshot, extract data                         |
| `test-driven-development`        | skill   | RED → GREEN → REFACTOR cycle. Includes testing anti-patterns reference                             |
| `systematic-debugging`           | skill   | 4-phase root cause process. Includes root-cause-tracing, defense-in-depth, condition-based-waiting |
| `verification-before-completion` | skill   | Evidence-before-claims — ensure it's actually fixed before marking done                            |
| `subagent-driven-development`    | skill   | Per-task subagent dispatch with two-stage review (spec compliance + code quality)                  |

---

## Git

| Name                             | Type  | Description                                            |
| -------------------------------- | ----- | ------------------------------------------------------ |
| `using-git-worktrees`            | skill | Isolated workspace creation and management             |
| `finishing-a-development-branch` | skill | Merge / PR / keep / discard decision workflow          |
| `dispatching-parallel-agents`    | skill | Concurrent subagent workflows for independent problems |

---

## System

| Name                  | Type    | Description                                                      |
| --------------------- | ------- | ---------------------------------------------------------------- |
| `/update-config`      | command | Configure settings.json, hooks, permissions, env vars            |
| `/keybindings-help`   | command | Customise keyboard shortcuts and key bindings                    |
| `/loop`               | command | Run a prompt or slash command on a recurring interval            |
| `/schedule`           | command | Create/manage scheduled remote agents (cron triggers)            |
| `/find-skills`        | command | Discover and install agent skills                                |
| `/skill-creator`      | command | Create new skills, modify existing, run evals                    |
| `/claude-api`         | command | Help building with Claude API / Anthropic SDK                    |
| `/revise-claude-md`   | command | Update CLAUDE.md with learnings from current session             |
| `/claude-md-improver` | command | Audit and improve CLAUDE.md file quality                         |
| `/teach-impeccable`   | command | One-time setup — gathers design context for persistent use       |
| `writing-skills`      | skill   | Create new skills following best practices (TDD-applied-to-docs) |
| `using-superpowers`   | skill   | Skill discovery and invocation framework — the meta-skill        |

---

## Sources

| Source      | What it provides                                                | Docs                                                                                 |
| ----------- | --------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| FinPlan     | Feature workflow (`brainstorm` → `execute-plan`), `/simplify`   | `~/.claude/skills/`                                                                  |
| Impeccable  | 20 design commands (Refine, Harden & Ship, Review)              | [impeccable.style/cheatsheet](https://impeccable.style/cheatsheet)                   |
| Superpowers | 14 context-activated skills (testing, collaboration, git, meta) | [github.com/obra/superpowers](https://github.com/obra/superpowers)                   |
| Vercel Labs | `/agent-browser`, `/dogfood`                                    | [github.com/vercel-labs/agent-browser](https://github.com/vercel-labs/agent-browser) |
| shadcn/ui   | Component management (context-activated)                        | [ui.shadcn.com](https://ui.shadcn.com)                                               |
| Claude Code | Built-in system commands                                        | [docs.anthropic.com](https://docs.anthropic.com)                                     |
