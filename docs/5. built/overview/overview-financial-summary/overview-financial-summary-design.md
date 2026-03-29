---
feature: overview-financial-summary
status: approved
creation_date: 2026-03-29
implemented_date:
---

# Overview — Financial Summary Panel — Design

> **Purpose:** Captures the approved product direction — the problem, the chosen approach, and the key decisions made during requirement refinement. This is the input to `/write-spec`. It is intentionally product-level: no Prisma syntax, no route shapes, no component trees.

## Problem

The Overview right panel is a dead zone — it currently shows a placeholder "Analytics coming soon" message when no waterfall item is selected. This is a missed opportunity: the user is looking at their waterfall but has no at-a-glance view of their overall financial position (net worth) or how each tier has trended over time. There is also no historical trend data being systematically captured to power sparklines.

## Approved Approach

Replace the empty right panel default state with a **Financial Summary Panel** — a stacked column of cards centred in the right panel, each showing a current figure and a trend sparkline. Net worth sits at the top as the headline, followed by one card per waterfall tier (Income, Committed, Discretionary, Surplus) in waterfall order.

To power the sparklines, introduce **daily auto-snapshots**: every day that contains at least one waterfall change, the system automatically upserts a snapshot of the full waterfall summary (named `auto:YYYY-MM-DD`). These accumulate silently in the background and are the exclusive data source for trend lines. Net worth sparklines are derived from `WealthAccountHistory` (existing).

The right panel continues to show item detail, cashflow calendar, etc. when something is selected — the summary panel is the default (nothing selected) state only.

## Key Decisions

| Decision                      | Choice                                                                                                                                             | Rationale                                                                                                                                                                                                           |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Snapshot strategy             | Daily auto-upsert on any waterfall change, named `auto:YYYY-MM-DD`                                                                                 | Per-change snapshots are too granular (multiple changes in one session); user-triggered snapshots are too sparse. Daily captures meaningful change frequency without noise.                                         |
| Snapshot timeline display     | Both auto and review snapshots shown, visually distinct                                                                                            | Auto dots are small and subtle; Review dots are more prominent. User retains historical comparison via Review; auto dots are informational. Exact visual treatment is a separate spec (`refine-snapshot-timeline`). |
| Manual "Save snapshot" button | Removed                                                                                                                                            | Auto-snapshots replace manual saves. Review wizard continues creating its own named snapshot.                                                                                                                       |
| Net worth data source         | `WealthAccount.balance` summed via existing `WealthSummary.netWorth`; sparkline from `WealthAccountHistory`                                        | Data already exists in schema and service. No new models needed.                                                                                                                                                    |
| Tier sparkline data source    | Parse tier totals from `auto:*` snapshot `data` JSON, ordered by date                                                                              | Avoids reconstructing totals from `WaterfallHistory` item-by-item. Snapshot data already contains computed tier totals.                                                                                             |
| No-history sparkline state    | Flat horizontal line at current value                                                                                                              | Communicates "stable / no data yet" without being alarming or confusing. A dot would be ambiguous.                                                                                                                  |
| Net worth placeholder         | Show `£—` with no sparkline if no `WealthAccount` records exist                                                                                    | Wealth accounts not yet fully built out in the UI. Net worth is real data when accounts exist; placeholder until then.                                                                                              |
| Card layout                   | All cards same width (62% of panel), centred, stacked vertically                                                                                   | Clean, scannable, no decorative cascade. Hierarchy is communicated by net worth's larger figure and gradient background, not position.                                                                              |
| Net worth card treatment      | Gradient background (`indigo → violet`, same as Overview ambient glow); large `36px` JetBrains Mono figure; full-width sparkline (no side padding) | Distinguishes net worth as a higher-order metric above the waterfall tiers without using tier colours.                                                                                                              |
| Tier card treatment           | Centred tier name (tier colour), centred amount (`19px`), sparkline with equal side padding (`14px`)                                               | Consistent, calm, uses existing tier colour tokens correctly.                                                                                                                                                       |
| Tier sparkline colour         | Each tier's own colour token (`tier-income`, `tier-committed`, etc.) with area-fill gradient                                                       | Tier colours are used in their tier context — this is a tier summary view. Consistent with left panel tier headings.                                                                                                |

## Out of Scope

- Forecast / projection — deferred to the `financial-forecast` feature (parked, pending assets)
- Snapshot timeline visual redesign — deferred to `refine-snapshot-timeline`
- Wealth account UI (creating/editing accounts) — separate feature; net worth shows placeholder until built
- Clicking a summary card to navigate to that tier page — not in v1; cards are display-only
- Inflation or growth rate modelling — deferred to `financial-forecast`
- Mobile layout

## Visual Reference

- `mockups/panel-fullscreen-final.html` — approved full-page mockup showing the Overview page with the financial summary panel in the right panel: net worth card + four tier cards, all centred, same width, with gradient-fill sparklines
