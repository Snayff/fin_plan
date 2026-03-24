# AI Cheatsheet

Quick reference for all AI-assisted workflows, commands, and skills available to fin_plan.

`command` = slash-invoked (`/name`). `skill` = context-activated (reference by name and Claude uses it automatically).

---

## Feature Workflow

Every new feature follows this pipeline. Each step auto-chains to the next on completion — no need to manually invoke each command.

```
/refine-requirement  →  /write-spec  →  /write-plan  →  /execute-plan <name>  →  /verify-implementation <name>
```

All five skills are **standalone** — they do not delegate to superpowers skills at runtime.

| Step                     | What happens                                                                                                                                                | Output                                                             |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| `/refine-requirement`    | Hard-gate (no code until approved). Offers visual companion once upfront, then decides per-question. One question at a time. 2-3 approaches with tradeoffs. | Approved design doc in `docs/plans/`                               |
| `/write-spec`            | Takes approved design, fills gaps with targeted questions. Runs UX review pass then security review pass. Auto-chains to write-plan.                        | Spec in `docs/4. planning/<feature>/<feature>-spec.md`             |
| `/write-plan`            | Creates TDD task plan (failing test → implement → pass → commit). Tasks ordered: schema → shared → BE → FE. Plan review loop. Auto-chains to execute-plan.  | Plan in `docs/4. planning/<feature>/<feature>-plan.md`             |
| `/execute-plan`          | Runs ~3 tasks per batch with subagents. Post-execution quality sequence. Checks open questions in spec. Auto-chains to verify-implementation.               | Spec moved to `docs/5. built/<feature>/`, `implemented.md` updated |
| `/verify-implementation` | Agent-browser functional check, security review, accessibility audit. Checks open questions. Can also be invoked standalone.                                | Verification report with issues by severity                        |

**Visual companion** (during `/refine-requirement`): Offered once as a dedicated message before questions begin. After consent, Claude silently decides per-question whether to use the browser (mockups, layouts, diagrams) or terminal (text, tradeoffs, scope). All mockup HTML files stay in `.superpowers/brainstorm/` — never in `apps/`, `packages/`, or `docs/`.

**Post-execution quality sequence** (run by `/execute-plan` in this order):

1. Code review — correctness, patterns, security, test coverage
2. Tests — `cd apps/backend && bun scripts/run-tests.ts` + `cd apps/frontend && bun run test`
3. Simplify via `/simplify`
4. Tests — second pass (verify no regressions from simplification)
5. Lint & type check — `bun run lint` + `bun run type-check`
6. Atomic commits — explicit `git add <files>`, never `git add -A`
7. Verify implementation via `/verify-implementation` — agent-browser + security + accessibility
8. Open questions — surfaces any unresolved items from the spec's Open Questions section

---

## Design & Build

| Name                     | Type    | Description                                                                  |
| ------------------------ | ------- | ---------------------------------------------------------------------------- |
| `/refine-requirement`    | command | Standalone — Socratic dialogue with visual companion, hard-gate before code  |
| `/write-spec`            | command | Standalone — formal spec from approved design, with UX + security review     |
| `/write-plan`            | command | Standalone — TDD implementation plan with plan review loop                   |
| `/execute-plan`          | command | Standalone — subagent batch execution, quality gates, atomic commits         |
| `/verify-implementation` | command | Standalone — agent-browser + security + accessibility audit + open questions |
| `/frontend-design`       | command | Create distinctive, production-grade frontend interfaces                     |
| `shadcn`                 | skill   | Component discovery, installation, styling and composition for shadcn/ui     |

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
| `/verify-implementation`         | command | Post-implementation verification — agent-browser + security review + accessibility audit           |
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

| Source      | What it provides                                                                                             | Docs                                                                                 |
| ----------- | ------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------ |
| FinPlan     | Standalone feature workflow (`refine-requirement` → `verify-implementation`), `/simplify`                    | `~/.claude/skills/`                                                                  |
| Impeccable  | 20 design commands (Refine, Harden & Ship, Review)                                                           | [impeccable.style/cheatsheet](https://impeccable.style/cheatsheet)                   |
| Superpowers | Context-activated skills (testing, debugging, git, collaboration). Visual companion server for brainstorming | [github.com/obra/superpowers](https://github.com/obra/superpowers)                   |
| Vercel Labs | `/agent-browser`, `/dogfood`                                                                                 | [github.com/vercel-labs/agent-browser](https://github.com/vercel-labs/agent-browser) |
| shadcn/ui   | Component management (context-activated)                                                                     | [ui.shadcn.com](https://ui.shadcn.com)                                               |
| Claude Code | Built-in system commands                                                                                     | [docs.anthropic.com](https://docs.anthropic.com)                                     |
