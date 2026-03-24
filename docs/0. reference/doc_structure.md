# Documentation Structure

> Reference for how the `docs/` folder is organised and what belongs where.

---

## Folder Overview

| Folder             | Purpose                                                                                           |
| ------------------ | ------------------------------------------------------------------------------------------------- |
| `0. reference/`    | User-facing references (cheatsheets, this guide, etc.)                                            |
| `1. research/`     | Market research and competitor analysis                                                           |
| `2. design/`       | Aesthetic design: philosophy, anchors, design system, definitions                                 |
| `3. architecture/` | How the app is built: architecture, testing approach, auth lifecycle                              |
| `4. planning/`     | Features to be built — one folder per feature (spec + plan), plus the overall implementation plan |
| `5. built/`        | Completed features — tracking what has shipped                                                    |
| `_archive/`        | Legacy docs preserved for reference, no longer active                                             |

---

## Feature Lifecycle

1. **Spec** — write a `[feature]-spec.md` in a new folder under `4. planning/`
2. **Plan** — add a `[feature]-plan.md` to the same folder when development begins
3. **Build** — implement the feature
4. **Ship** — move the folder to `5. built/` and set `implemented_date` in the spec frontmatter

---

## Key Files

| File                                        | What it is                                      |
| ------------------------------------------- | ----------------------------------------------- |
| `2. design/design-anchors.md`               | 17 non-negotiable product invariants            |
| `2. design/design-philosophy.md`            | Vision and core principles                      |
| `2. design/design-system.md`                | Tokens, components, typography, colour, motion  |
| `2. design/definitions.md`                  | Canonical tooltip text for all financial terms  |
| `3. architecture/architecture.md`           | Monorepo structure, backend/frontend layering   |
| `3. architecture/testing_approach.md`       | Test strategy and runner setup                  |
| `3. architecture/auth-session-lifecycle.md` | JWT refresh, session boundaries, security model |
| `4. planning/_implementation-plan.md`       | 15-phase rollout with per-phase task breakdown  |
| `5. built/implemented.md`                   | Single source of truth for what has shipped     |
