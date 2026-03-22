# FinPlan — Feature Backlog

> This document tracks features that are intentionally out of scope for the current build. Nothing here is designed or specced — these are placeholders that acknowledge a gap without committing to a solution. When a feature moves into active design, remove it from this document and write its spec in `feature-specs.md`.

---

## 1. Keyboard Navigation

**Scope**

Full keyboard operability across the entire application:

- Two-panel layout: navigating between and within left and right panels
- Left panel item selection (arrow keys to move focus, Enter to select)
- Right panel breadcrumb navigation (`← Category / Item`)
- Inline edit forms (tab order, submit/cancel with keyboard)
- Timeline navigator (arrow keys to step between snapshots)
- Review Wizard and Waterfall Creation Wizard step navigation
- All button pairs, dropdowns, and action controls

**Constraints**

- Must not break the existing click-first interaction model — keyboard navigation is additive
- Focus states must be visually distinct (not relying on colour alone)

**Status**: Not yet designed.

---

## 2. Reduced Motion

**Scope**

All animated elements in the application must respect the user's OS-level motion preference:

- History graphs (line/bar chart draw animations)
- Timeline navigator dot transitions and scroll behaviour
- Snapshot banner appearance and dismissal
- Chart rendering (Wealth page projections, cashflow calendar)
- Inline expand/collapse animations (waterfall rows, right panel depth transitions)
- Wizard step transitions

**Constraints**

- Must honour the OS-level `prefers-reduced-motion` CSS media query
- Target: WCAG 2.1 Success Criterion 2.3.3 (Animation from Interactions) — AAA, but AA-equivalent behaviour should be the floor
- When reduced motion is active, animations should either be instant or replaced with a simple opacity transition with no movement

**Status**: Not yet designed.

---

## 3. Mobile Experience

**What is already decided**

- FinPlan is desktop-first. Desktop is the primary environment for setup, annual review, and deep analysis.
- Mobile is intended for quick edits and spot checks only.
- The Review Wizard and Waterfall Creation Wizard are desktop-only.
- The Wealth and Planner pages are desktop-only until mobile designs are specified.

**Scope**

The Overview (waterfall) page is the primary mobile surface. The design direction from earlier planning sessions:

- Two-panel layout collapses to a single column of summary cards (Income, Committed, Discretionary, Surplus)
- Tapping a card expands it to show line items within that section
- Tapping a line item opens a full-screen edit sheet with a number pad for quick value entry
- Staleness indicators are visible on summary cards

This sketch should be the starting point when the mobile feature is formally designed. All other pages (Wealth, Planner, Settings) are undefined for mobile.

**Status**: Not yet designed. Overview layout described above is a starting point only.
