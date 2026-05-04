---
feature: quick-add-waterfall
status: approved
creation_date: 2026-04-18
implemented_date:
---

# Quick-Add Waterfall — Design

## Context

Users currently add waterfall items one-at-a-time through inline forms on each tier page, and new users are onboarded via a multi-step Waterfall Creation Wizard. Both flows force heavy navigation between screens and provide no single place to scan or bulk-edit the whole plan. Three pains motivate this change:

1. **Time to build a whole new waterfall** — first-time setup requires stepping through a wizard with per-item inline forms.
2. **Time navigating between tier screens** — adding related items across tiers in one sitting means hopping between Income, Committed, and Discretionary pages.
3. **No single "scan everything" view** — users cannot see their whole waterfall at a glance while editing.

The intended outcome is a single full-waterfall surface that serves both first-time setup and ongoing bulk-add/review, replacing the existing Waterfall Creation Wizard.

## Problem

There is no surface in finplan where a user can see and edit their entire waterfall (income, committed, discretionary) in one place. First-time setup and bulk edit are each forced through narrow, per-item entry flows that multiply clicks and screen changes. This raises time-to-first-complete-waterfall for new users and makes ongoing annual-review edits slower than they need to be.

## Approved Approach

### The surface

A new full-screen route at **`/waterfall`** — the "Full Waterfall" — showing all three tiers stacked in cascade order (Income → Committed → Discretionary) with a read-only Surplus strip at the bottom. Each tier is presented as a dense, grouped table with inline editable cells. The surface is full-width (no two-panel shell) and framed as the first instance of a new "full-screen focused surface" class alongside wizards — see Design Standard Updates below.

The surface serves two jobs with one UI:

- **First-time setup.** A new user arrives from the Overview ghosted-cascade empty-state CTA. All three tier tables render; the Income table has a pre-focused empty add-row, and committed/discretionary show ghosted skeleton rows + empty add-rows. A one-line tip at the top reads _"Start with your income — what arrives in your accounts each month."_ There is no splash screen, no multi-step chrome, no progress bar.
- **Ongoing view-all / bulk-add.** An existing user lands here via a "View all" button in the right-panel header of any tier page. The surface scrolls to the originating tier. They can edit any row, add new rows, and see the cascade in context.

### Table structure

Per tier, rows are **grouped under subcategory headers** (not columns). All tier-specific fields are shown as inline columns (full density).

| Tier          | Columns                                                |
| ------------- | ------------------------------------------------------ |
| Income        | Name · Type (chip) · Cadence · Owner · Amount · /month |
| Committed     | Name · Cadence · Due · Amount · /month                 |
| Discretionary | Name · Cadence · Due · Amount · /month                 |

- `/month` is the monthly-equivalent figure (annual ÷ 12, one-off amortised across the plan year) — the waterfall-relevant number. Shown read-only in tabular monospace.
- The **Due** column on Committed/Discretionary is conditionally populated — shows month for yearly, date for one-off, "—" for monthly.
- Between subcategory groups, a ghost **"+ Add subcategory"** affordance creates a new empty group the user can fill. This enables inline subcategory creation during first-time setup without leaving the surface.
- Each subcategory group has a **row total** on its header, and each tier has a **tier total** in its header (name · £X/mo).

### Interaction model

- **New rows**: Tabbing off the last cell of the last row in a subcategory auto-creates a fresh empty row below. Each subcategory also has an explicit `+ add` row at the bottom as a discoverable alternative.
- **Auto-save**: Each field saves on blur. No global "Save" button, no dirty-state guard on exit.
- **Incomplete rows**: A row persists only when name + amount + required cadence fields are valid. Incomplete rows stay as local-only drafts with a small amber "incomplete" indicator until filled — never blocking, never alarming.
- **Delete**: Hover over a row → trash icon reveals at far right → click → confirm dialog → delete.
- **Subcategory creation**: "+ Add subcategory" button between groups opens an inline empty group header with an input for the subcategory name.
- **Keyboard flow**: Tab/Shift-Tab across cells; Enter moves down one row within the same column; Esc cancels the current cell edit.

### Entry and exit

**Entry points:**

- Overview empty-state CTA ("Build your waterfall") — replaces the current wizard CTA
- "View all" button in the right-panel header of each waterfall tier page (Income, Committed, Discretionary)

**Exit:** Back/close button in the surface header returns the user to wherever they came from — Overview if they entered from there, or the specific tier page if they used "View all". Because auto-save is per-row, there is no dirty-state prompt.

### Surplus

After the Discretionary table, a read-only calm strip: `= SURPLUS  £209 · 2.4%` in teal-mint (`tier-surplus` colour). Updates live as rows change. Reinforces the cascade terminus (Anchor 14).

### Surface chrome

```
┌─────────────────────────────────────────────────────────────┐
│  finplan                                        [✕ Close]   │  ← top bar, minimal
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   YOUR WATERFALL                                            │  ← page title
│   Start with your income — what arrives each month.         │  ← tip, dismissible
│                                                             │
│   ┌─────────────────────────────────────────────────────┐   │
│   │ ● INCOME                              £8,856/mo     │   │
│   │   [ subcategory: Salaries ]                         │   │
│   │     Ben — Salary      ...                           │   │
│   │     Alex — Salary     ...                           │   │
│   │   + Add subcategory                                 │   │
│   └─────────────────────────────────────────────────────┘   │
│                  ↓ minus committed                          │
│   ┌─────────────────────────────────────────────────────┐   │
│   │ ● COMMITTED                           £4,817/mo     │   │
│   │   ...                                               │   │
│   └─────────────────────────────────────────────────────┘   │
│                  ↓ minus discretionary                      │
│   ┌─────────────────────────────────────────────────────┐   │
│   │ ● DISCRETIONARY                       £3,830/mo     │   │
│   │   ...                                               │   │
│   └─────────────────────────────────────────────────────┘   │
│                                                             │
│   ═ SURPLUS                                £209 · 2.4%      │  ← teal-mint strip
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Wizard removal

The existing **Waterfall Creation Wizard** (`docs/5. built/overview/waterfall-creation-wizard/`) is removed. No migration of in-progress `WaterfallSetupSession` rows is needed since the session stores only `currentStep`. Implementation detail: drop `WaterfallSetupSession` model + its API endpoints + the `WaterfallSetupWizard.tsx` component during implementation. "Rebuild from scratch" in Settings → Waterfall routes to `/waterfall` after the `DELETE /api/waterfall/all` confirmation.

## Key Decisions

| Decision                                                  | Choice                                                                                | Rationale                                                                                                                                                                                                |
| --------------------------------------------------------- | ------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Scope (table surface)                                     | Income, Committed, Discretionary only                                                 | Waterfall tiers — surplus is a derived terminus, other data surfaces (Assets, Goals, Gifts) are out of scope                                                                                             |
| Shared vs. separate surfaces for first-time and bulk edit | One shared surface at `/waterfall`                                                    | Same pain points; one surface keeps code and mental model lean                                                                                                                                           |
| Layout shell                                              | Full-width focused (no two-panel)                                                     | More breathing room for 3 stacked tables; reinforces "workbench" feel for bulk entry                                                                                                                     |
| Anchor 17 resolution                                      | Update design standards to recognise "full-screen focused surfaces" alongside wizards | Future-proof: this class may grow (e.g. annual review). Applied in this session before saving                                                                                                            |
| Row density                                               | Full density — all tier-specific fields as inline columns                             | User's stated goals (time to enter, navigation, scanning) all pull toward density. Documented trade-off against Principle 3 "precision without density"; mitigated by line-height, tabular-nums, padding |
| Subcategory grouping                                      | Rows grouped under subcategory headers (not a column)                                 | Strong visual buckets; reinforces hierarchical structure of each tier                                                                                                                                    |
| Inline subcategory creation                               | "+ Add subcategory" affordance between groups                                         | First-time users can build the whole hierarchy without leaving the surface; avoids a Settings round-trip                                                                                                 |
| Save strategy                                             | Per-row auto-save on blur                                                             | No dirty state to guard; fastest perceived flow; matches spreadsheet mental model                                                                                                                        |
| Incomplete row handling                                   | Persist only when valid; keep as amber-marked local draft otherwise                   | Prevents half-valid DB rows while staying non-blocking (Anchor 12)                                                                                                                                       |
| New-row creation                                          | Tab-off-end auto-creates + explicit "+ add" row                                       | Optimises continuous entry while staying discoverable                                                                                                                                                    |
| Delete                                                    | Hover-reveal trash icon + confirm                                                     | Out-of-way but discoverable; calm-by-default                                                                                                                                                             |
| Entry points                                              | Overview empty-state CTA + "View all" on tier pages                                   | Covers both first-time and returning users without top-nav bloat                                                                                                                                         |
| Exit                                                      | Return to entry point                                                                 | Predictable; respects user's originating context                                                                                                                                                         |
| Route                                                     | `/waterfall`                                                                          | Short, matches mental model                                                                                                                                                                              |
| Surplus display                                           | Read-only strip at bottom of surface                                                  | Reinforces cascade terminus (Anchor 14) without introducing an editable fourth table                                                                                                                     |
| First-time empty state                                    | All 3 tables visible; Income focused; committed/discretionary show ghosted skeletons  | Teaches waterfall shape while user builds it (empty-state pattern from § 3.5)                                                                                                                            |
| Language                                                  | "budgeted", "planned", "/month" — never "spent", "paid"                               | Anchor 3 and Principle 2                                                                                                                                                                                 |
| Legacy wizard                                             | Removed (model, API, component)                                                       | Replaced by this surface; no migration needed since session only stored `currentStep`                                                                                                                    |

## Out of Scope

- **Other data-entry screens.** Assets, Accounts, Goals, and Gifts quick-add are not covered; they may adopt similar patterns in follow-up work.
- **Snapshot creation.** The old wizard offered an opening snapshot on completion; this surface does not — snapshots are created separately from Overview. If we want to preserve onboarding snapshots, that belongs to a follow-up design.
- **Resumable session model.** Because auto-save persists every row to the real DB immediately (matching the old wizard's behaviour), there is no need for a `WaterfallSetupSession`-like model.
- **Mobile.** Desktop-first; the surface assumes min width 1024px (Anchor 6).
- **Undo.** No multi-step undo stack. Delete is confirmed; individual field edits are not reversible beyond browser undo on the in-focus input.
- **Row reordering across subcategories.** Moving a row between subcategories requires opening its detail panel (not inline drag). Within-group sortOrder changes are out of scope for v1.
- **Bulk import (CSV).** Future work.
- **Keyboard shortcuts beyond Tab/Shift-Tab/Enter/Esc.** No ⌘-combos in v1.

## Visual Reference

- `mockups/layout-shell.html` — side-by-side comparison of two-panel shell (Option Y) vs full-width workbench (Option X, chosen)
- `mockups/row-density.html` — side-by-side comparison of row density and subcategory layout options (A + C chosen)
