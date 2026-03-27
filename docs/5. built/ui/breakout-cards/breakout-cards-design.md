# Breakout Cards — Approved Design

**Date:** 2026-03-24
**Status:** Approved

## Summary

Introduce intentional container-boundary-breaking cards in three locations to add visual tension and hierarchy to the FinPlan UI. Each breakout serves a semantic purpose — it highlights computed results, key figures, or the current state.

## Approved Breakouts

### 1. Surplus Breakout — MiniWaterfallChart

**Where:** The surplus row in the MiniWaterfallChart (build guide panel, and potentially the waterfall left panel).

**Design:**

- Card background rendered via `::before` pseudo-element, offset to the right (`left: -8px`, `right: -32px`).
- Content (label, bar track, value) stays in normal document flow — bars aligned at the same x-coordinate as Income, Committed, Discretionary rows above.
- "Surplus" label has `padding-left: 8px` on the span (fixed-width 100px) to create inner spacing from the card's left edge without shifting the bar track.
- Card uses `surface-elevated` background with `border` (1px).
- Card extends ~28px below the chart container's bottom edge.

**Waterfall cascade:** Bars are positioned as a proper waterfall — each tier starts where the previous ends (Income 0–100%, Committed 0–56%, Discretionary 56–89%, Surplus 89–100%).

**Semantic justification:** Surplus is the computed output of the waterfall — it emerges from the system, unlike the input tiers. The breakout visually communicates this distinction.

### 2. Net Worth Breakout — Wealth Left Panel (Toko-style)

**Where:** WealthLeftPanel — the Net Worth headline at the top.

**Design:**

- The panel splits into a hero section (top) and a content section (bottom).
- Hero has a subtle violet gradient background (`linear-gradient(135deg, rgba(139,92,246,0.06), rgba(99,102,241,0.04))`).
- Net Worth value card is absolutely positioned at the hero's bottom edge (`bottom: -24px`), extending 24px into the content section below.
- Card uses `surface-elevated` background, `border`, `border-radius: 10px`.
- Card contains the big `£` value (JetBrains Mono, 28px, 700) and YTD change.
- Content section has `padding-top: 36px` to accommodate the breakout card.

**Semantic justification:** Net Worth is the single most important figure on the Wealth page. The breakout card bridges the hero and content sections, signaling ownership of the page.

### 3. Snapshot Timeline — "Now" Floating Card

**Where:** SnapshotTimeline — the current "Now" dot.

**Design:**

- Floating card positioned `bottom: calc(100% + 6px)` above the dot.
- Card uses `surface-elevated` background, `border`, `border-radius: 6px`.
- Card contains "Current view · Mar 24" text.
- Small arrow (CSS border triangle) points down from the card to the dot.
- Dot stays 8px (same as all other dots), distinguished only by `action` colour + subtle box-shadow glow.
- "Now" label uses `text-primary` + `font-weight: 600` vs other dots' `text-tertiary`.

**Semantic justification:** The "Now" card distinguishes the current state from historical snapshots — a real semantic distinction encoded visually.

## Visual Treatment

- **Elevated surface + border** — consistent across all three breakouts.
- Background: `surface-elevated` (#141b2e).
- Border: 1px `border` token.
- No shadows (dark theme constraint).
- No animation on the breakouts themselves (static positioning).

## Constraints

- All breakouts must work within `overflow-y: auto` panels (can't escape panel bounds).
- Max 1 breakout per view.
- Must respect `prefers-reduced-motion` if any entrance animations are added later.
- Z-index: use `sticky` (10) to `dropdown` (30) range — below modals/tooltips.

## Mockup Reference

Interactive mockup at `apps/frontend/public/mockup-breakout.html` (development artifact, not for production).
