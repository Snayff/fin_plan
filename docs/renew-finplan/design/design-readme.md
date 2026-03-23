# FinPlan Renew — Documentation Index

> This is the entry point for the FinPlan rebuild documentation. Start here to understand what this project is, how the docs relate to each other, and in what order to read them.

---

## What FinPlan Is

FinPlan is a personal financial planning tool for households. It is not a ledger, a bank replacement, or a financial advisor. Its core structure is the **waterfall**: income at the top, committed spend deducted first, discretionary spend below that, and whatever remains as surplus. Every design decision reinforces this model. The app tracks what you *intend* to spend, not every transaction — users reconcile actual transactions through their bank.

---

## Document Map

| Document | Purpose | Read when |
|---|---|---|
| [design-anchors.md](design-anchors.md) | The 16 non-negotiable invariants — decisions that constrain all others | First, for AI context or onboarding |
| [design-philosophy.md](design-philosophy.md) | The *why*: vision and 7 core principles that drive all design decisions | Early — before any UX or feature work |
| [design-system.md](design-system.md) | The *what*: all UI specs, colour tokens, typography, components, interaction rules, and UX patterns | Before building any UI |
| [definitions.md](definitions.md) | Canonical tooltip text for every financial term and functional icon in the app | When writing or reviewing UI copy |
| [feature-specs.md](feature-specs.md) | Section-by-section UX flows for every page and feature (flat reference) | For a full overview of all features |
| [implementation-plan.md](implementation-plan.md) | The active 15-phase build plan with task-by-task instructions | The primary reference during development |
| [backlog.md](backlog.md) | Features that are intentionally deferred — not yet designed, not in scope | To understand what is explicitly out of scope |
| [backlog/](backlog/) | Atomic feature spec files — one folder per feature, each with a `*-spec.md` | When working on or reviewing a specific feature |
| [implemented/](implemented/) | Feature folders moved here once shipped, with `implemented_date` in frontmatter | To audit what has been built and when |

---

## Reading Order

**For AI context / onboarding:**
1. `design-anchors.md` — establishes the invariants
2. `design-philosophy.md` — the reasoning behind the product
3. `design-system.md` — the concrete rules
4. `feature-specs.md` — the section-by-section behaviour

**For active development:**
- `implementation-plan.md` is the primary reference for build sequencing
- `backlog/[feature]/[feature]-spec.md` is the reference for a specific feature's intent, user stories, and acceptance criteria
- Consult `design-system.md` for component and interaction rules

**Backlog workflow:**
- Features to be built live in `backlog/` — each in its own folder with a `*-spec.md`
- Add a `*-plan.md` to the folder when a feature enters active development (`status: in-progress`)
- Move the folder to `implemented/` and fill `implemented_date` when the feature ships (`status: implemented`)
- To add a new feature: copy `backlog/_template.md` into a new folder under `backlog/`
