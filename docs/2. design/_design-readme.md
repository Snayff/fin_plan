# finplan Renew — Design Documentation Index

> This is the entry point for the finplan design documentation. Start here to understand the design philosophy, constraints, and concrete rules that govern the UI.

> Start here. This is the navigation guide for all design documentation.
>
> > > > > > > Stashed changes:docs/2. design/\_design-readme.md

---

## What finplan Is

finplan is a personal financial planning tool for households. It is not a ledger, a bank replacement, or a financial advisor. Its core structure is the **waterfall**: income at the top, committed spend deducted first, discretionary spend below that, and whatever remains as surplus. Every design decision reinforces this model. The app tracks what you _intend_ to spend, not every transaction — users reconcile actual transactions through their bank.

---

## Where to Find What You Need

<<<<<<< Updated upstream:docs/renew-finplan/design/\_design-readme.md

### Design docs (this directory)

| Document                                     | Purpose                                                                                             | Read when                             |
| -------------------------------------------- | --------------------------------------------------------------------------------------------------- | ------------------------------------- |
| [design-anchors.md](design-anchors.md)       | The 17 non-negotiable invariants — decisions that constrain all others                              | First, for AI context or onboarding   |
| [design-philosophy.md](design-philosophy.md) | The _why_: vision and 8 core principles that drive all design decisions                             | Early — before any UX or feature work |
| [design-system.md](design-system.md)         | The _what_: all UI specs, colour tokens, typography, components, interaction rules, and UX patterns | Before building any UI                |
| [definitions.md](definitions.md)             | Canonical tooltip text for every financial term and functional icon in the app                      | When writing or reviewing UI copy     |

### Project docs

| Document                       | Purpose                                                                     | Read when                                       |
| ------------------------------ | --------------------------------------------------------------------------- | ----------------------------------------------- |
| [planning/](../4.%20planning/) | Atomic feature spec files — one folder per feature, each with a `*-spec.md` | When working on or reviewing a specific feature |
| [built/](../5.%20built/)       | Completed features, with `implemented_date` in frontmatter                  | To audit what has been built and when           |

---

## Reading Order

**For AI context / onboarding:**

1. `design-anchors.md` — establishes the invariants
2. `design-philosophy.md` — the reasoning behind the product
3. `design-system.md` — the concrete rules

**For active development:**

- `../4. planning/[feature]/[feature]-spec.md` is the reference for a specific feature's intent, user stories, and acceptance criteria
- Consult `design-system.md` for component and interaction rules

**Planning workflow:**

- Features to be built live in `../4. planning/` — each in its own folder with a `*-spec.md`
- Add a `*-plan.md` to the folder when a feature enters active development (`status: in-progress`)
- Move the folder to `../5. built/<category>/` and fill `implemented_date` when the feature ships (`status: implemented`)
