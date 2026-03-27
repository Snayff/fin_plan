---
feature: design-polish
spec: docs/4. planning/design-polish/design-polish-spec.md
phase:
status: pending
---

# Design Polish — Implementation Plan

> **For Claude:** Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Bring the design system to life with atmospheric depth, visual hierarchy, purposeful empty states, and consistency fixes — frontend only, no backend changes.
**Spec:** `docs/4. planning/design-polish/design-polish-spec.md`
**Architecture:** Pure CSS/JSX changes across ~15 frontend files. New shared components for reusable patterns (cascade connectors, ghosted list empties, page glows). Design system documentation updated alongside code.
**Tech Stack:** React 18 · Tailwind · shadcn/ui · CSS custom properties

## Pre-conditions

- [ ] Current `implementation` branch builds clean (`bun run build`)
- [ ] Current lint passes (`bun run lint`)
- [ ] shadcn `<Button>` component exists at `apps/frontend/src/components/ui/button.tsx`

---

## Tasks

### Task 1: Add shadcn Checkbox component

The shadcn Checkbox doesn't exist yet. Install it before tasks that need it.

1. Run `cd apps/frontend && bunx shadcn@latest add checkbox`
2. Verify the component exists at `apps/frontend/src/components/ui/checkbox.tsx`
3. `bun run build` — confirm clean

**Commit:** `chore: add shadcn checkbox component`

---

### Task 2: Cascade connectors + surplus unification

Create the `WaterfallConnector` component and integrate it into the left panel. Unify surplus with other tiers.

**Files:**

- NEW: `apps/frontend/src/components/overview/WaterfallConnector.tsx`
- MODIFY: `apps/frontend/src/components/overview/WaterfallLeftPanel.tsx`

**Steps:**

1. Create `WaterfallConnector.tsx`:
   - Props: `text: string` (e.g. "minus committed", "equals")
   - Render: `flex items-center gap-2.5` container with two `flex-1 h-px bg-border/50` horizontal rules flanking the text
   - Text: `text-[10.5px] font-numeric font-medium text-muted tracking-wide`
   - Padding: `py-2 px-3`

2. In `WaterfallLeftPanel.tsx`:
   - Add `<WaterfallConnector text="minus committed" />` between Income and Committed sections
   - Add `<WaterfallConnector text="minus discretionary" />` between Committed and Discretionary sections
   - Add `<WaterfallConnector text="equals" />` between Discretionary and Surplus sections
   - Remove the `border-t pt-3` from the surplus section wrapper
   - Refactor the surplus section to use the same `SectionHeader` component as other tiers, passing `colorClass="text-tier-surplus"`
   - Apply `text-tier-*` colour to tier totals in `SectionHeader` (currently only the label is coloured — add the colour class to the total amount span too)

3. `bun run build && bun run lint`

**Commit:** `feat: add cascade connectors and unify surplus tier styling`

---

### Task 3: Typography hierarchy (D3)

Update sizes and weights for tier headers, totals, and item rows.

**Files:**

- MODIFY: `apps/frontend/src/components/overview/WaterfallLeftPanel.tsx`

**Steps:**

1. Update `SectionHeader` component:
   - Label: `text-[13px] font-heading font-semibold tracking-tier uppercase` + tier colour class (already has colour)
   - Total: `text-[15px] font-numeric font-semibold` + tier colour class (added in Task 2)

2. Update item row rendering (the `ROW_CLASS` and individual row markup):
   - Item name: `text-[13px] font-body font-normal text-secondary`
   - Item amount: `text-[13px] font-numeric font-normal text-[#cbd5e1]`

3. Verify staleness metadata remains at `text-xs` (12px) — no change needed

4. `bun run build && bun run lint`

**Commit:** `feat: implement D3 typography hierarchy for waterfall panel`

---

### Task 4: Ambient page glows

Add per-page dual radial gradient glows via CSS custom properties and pseudo-elements.

**Files:**

- MODIFY: `apps/frontend/src/index.css`
- MODIFY: `apps/frontend/src/pages/OverviewPage.tsx`
- MODIFY: `apps/frontend/src/pages/WealthPage.tsx`
- MODIFY: `apps/frontend/src/pages/PlannerPage.tsx`
- MODIFY: `apps/frontend/src/pages/SettingsPage.tsx` (or settings section components)

**Steps:**

1. In `index.css`, add page glow styles using `data-page` attribute selectors:

   ```css
   [data-page]::before,
   [data-page]::after {
     content: "";
     position: fixed;
     pointer-events: none;
     z-index: 0;
   }

   [data-page="overview"]::before {
     top: -100px;
     right: -50px;
     width: 500px;
     height: 400px;
     background: radial-gradient(ellipse, rgba(99, 102, 241, 0.06) 0%, transparent 65%);
   }
   [data-page="overview"]::after {
     bottom: -80px;
     left: 60px;
     width: 400px;
     height: 300px;
     background: radial-gradient(ellipse, rgba(124, 58, 237, 0.035) 0%, transparent 65%);
   }
   /* ... wealth, planner, settings similarly */
   ```

2. In each page component, add `data-page="overview"` (or `wealth`, `planner`, `settings`) to the outermost wrapper div. Ensure the wrapper has `position: relative` so glows are contained.

3. Verify no z-index conflicts — content should have `z-index: 1` or higher, glows at `z-index: 0`.

4. `bun run build && bun run lint`

**Commit:** `feat: add dual ambient glows per page for sense of place`

---

### Task 5: No-waterfall empty state (ghosted cascade + CTA card)

Replace the plain-text empty state on the Overview page.

**Files:**

- MODIFY: `apps/frontend/src/pages/OverviewPage.tsx`
- Reuse: `WaterfallConnector.tsx` (from Task 2)

**Steps:**

1. Replace the existing empty state block (currently `<p>No waterfall set up yet.</p>` + `<button>`) with:
   - Four ghosted tier headers at ~25% opacity, each showing tier label in its tier colour + "£—" placeholder amount
   - `<WaterfallConnector>` between each pair at ~20% opacity
   - A callout gradient CTA card below:
     - Background: `linear-gradient(135deg, rgba(99, 102, 241, 0.07) 0%, rgba(168, 85, 247, 0.05) 100%)`
     - Border: `1px solid rgba(99, 102, 241, 0.1)`
     - Heading: "Build your waterfall" (15px, Outfit, font-semibold)
     - Subtext: "See where your money flows — from income through to surplus."
     - Button: "Get started" using `<Button>`, onClick calls `enterBuildMode`

2. `bun run build && bun run lint`

**Commit:** `feat: ghosted cascade empty state for overview page`

---

### Task 6: Right panel placeholder upgrade

Replace the plain italic text with icon + contextual guidance.

**Files:**

- MODIFY: `apps/frontend/src/components/layout/TwoPanelLayout.tsx`

**Steps:**

1. Update `PlaceholderMessage` component:
   - Add a small SVG icon (two-panel layout representation, 20×20, `stroke="#475569"`, no fill)
   - Change text styling: `text-[13px] text-muted-foreground` (drop italic)
   - Accept `text` prop for page-aware guidance (default: "Select an item to view its details")
   - Note: keyboard hint badges deferred until keyboard navigation is implemented

2. `bun run build && bun run lint`

**Commit:** `feat: contextual right panel placeholder with icon`

---

### Task 7: Shared GhostedListEmpty component

Extract the reusable fading skeleton + CTA card pattern.

**Files:**

- NEW: `apps/frontend/src/components/ui/GhostedListEmpty.tsx`

**Steps:**

1. Create `GhostedListEmpty` component with props:
   - `rowCount?: number` (default 3) — number of ghost skeleton rows
   - `ctaText: string` — contextual description in the CTA card
   - `ctaButtonLabel?: string` (default "+ Add")
   - `onCtaClick: () => void` — action when CTA button is clicked

2. Render:
   - `rowCount` skeleton rows, each with a name placeholder (varying widths: cycle through 100px, 140px, 80px, 120px) and an amount placeholder (64px)
   - Progressive opacity: row 1 at 100%, row 2 at 80%, row 3 at 50%, row 4+ at 25%
   - Callout gradient CTA card below (same gradient as Task 5)
   - Card contains: `ctaText` description + `<Button size="sm">` with `ctaButtonLabel`

3. `bun run build && bun run lint`

**Commit:** `feat: add GhostedListEmpty shared component`

---

### Task 8: Apply GhostedListEmpty across list panels

Replace all "No X yet" italic text empty states.

**Files:**

- MODIFY: `apps/frontend/src/components/wealth/AccountListPanel.tsx`
- MODIFY: `apps/frontend/src/components/planner/PurchaseListPanel.tsx`
- MODIFY: `apps/frontend/src/components/planner/GiftPersonListPanel.tsx`
- MODIFY: `apps/frontend/src/components/planner/GiftUpcomingPanel.tsx`
- MODIFY: `apps/frontend/src/components/settings/EndedIncomeSection.tsx`
- MODIFY: `apps/frontend/src/components/settings/SnapshotsSection.tsx`

**Steps:**

1. In each file, replace the `<p className="text-sm text-muted-foreground italic ...">No X yet</p>` with `<GhostedListEmpty>`:

   | File                | ctaText                                                           | onCtaClick                                                                                      |
   | ------------------- | ----------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
   | AccountListPanel    | "Add your savings accounts to track balances and contributions"   | Trigger add account form                                                                        |
   | PurchaseListPanel   | "Plan purchases with cost, priority, and funding source"          | Trigger add purchase form                                                                       |
   | GiftPersonListPanel | "Plan gifts by person and event — birthdays, Christmas, and more" | Trigger add person form                                                                         |
   | GiftUpcomingPanel   | "Add gift recipients to see upcoming events"                      | Navigate to By Person view or trigger add                                                       |
   | EndedIncomeSection  | "Ended income sources will appear here"                           | No CTA button (informational only — pass `ctaButtonLabel=""` or add a `showCta?: boolean` prop) |
   | SnapshotsSection    | "Save snapshots to track your waterfall over time"                | Trigger snapshot save                                                                           |

2. For `EndedIncomeSection`: this is informational (users don't manually add ended sources), so either hide the CTA button or show ghost rows only. Add an optional `showCta` prop to `GhostedListEmpty` if needed.

3. `bun run build && bun run lint`

**Commit:** `feat: apply ghosted list empty states across all panels`

---

### Task 9: Minor fix — hardcoded amber → text-attention

**Files:**

- MODIFY: `apps/frontend/src/components/overview/WaterfallLeftPanel.tsx`
- MODIFY: `apps/frontend/src/components/overview/SnapshotTimeline.tsx`
- MODIFY: `apps/frontend/src/components/overview/ItemDetailPanel.tsx`

**Steps:**

1. Search each file for `style={{ color: "#f59e0b" }}` or `color: "#f59e0b"`
2. Replace with `className="text-attention"` (or add `text-attention` to existing className)
3. Verify `text-attention` is defined in the Tailwind config — if not, add it as a semantic colour token mapping to `#f59e0b`
4. `bun run build && bun run lint`

**Commit:** `fix: replace hardcoded amber with text-attention token`

---

### Task 10: Minor fix — ItemDetailPanel buttons → <Button>

**Files:**

- MODIFY: `apps/frontend/src/components/overview/ItemDetailPanel.tsx`

**Steps:**

1. Find all manually constructed `<button className="rounded bg-primary px-3 py-1.5 text-xs...">` elements
2. Replace with `<Button size="sm" variant="default">` (or appropriate variant)
3. Import `Button` from `@/components/ui/button`
4. `bun run build && bun run lint`

**Commit:** `fix: use shared Button component in ItemDetailPanel`

---

### Task 11: Minor fix — native checkboxes → shadcn Checkbox

**Files:**

- MODIFY: `apps/frontend/src/components/overview/build/BuildGuidePanel.tsx` (SummaryPhase section)
- MODIFY: `apps/frontend/src/pages/auth/LoginPage.tsx`

**Steps:**

1. In each file, find `<input type="checkbox" ...>`
2. Replace with shadcn `<Checkbox>` from `@/components/ui/checkbox`
3. Map `checked`/`onChange` props to shadcn's `checked`/`onCheckedChange` API
4. Ensure the checkbox label text is associated (wrap in `<label>` or use `aria-label`)
5. `bun run build && bun run lint`

**Commit:** `fix: replace native checkboxes with styled shadcn Checkbox`

---

### Task 12: Minor fix — wordmark enhancement

**Files:**

- MODIFY: `apps/frontend/src/components/layout/Layout.tsx` (line ~87)

**Steps:**

1. Find the "finplan" wordmark element (currently `font-bold text-base tracking-tight`)
2. Change to: `font-heading font-bold text-lg tracking-tight` (Outfit font, slightly larger)
3. Verify the text reads "finplan" exactly — lowercase, one word
4. `bun run build && bun run lint`

**Commit:** `fix: enhance finplan wordmark with Outfit font`

---

### Task 13: Minor fix — confetti particle count

**Files:**

- MODIFY: `apps/frontend/src/pages/WelcomePage.tsx` (ConfettiBurst function, lines ~131-171)

**Steps:**

1. Find the particle count (currently 40 — likely a loop count or array length)
2. Reduce to 20
3. `bun run build && bun run lint`

**Commit:** `fix: reduce confetti to 20 particles for calmer feel`

---

### Task 14: Minor fix — snapshot truncation + tooltips

**Files:**

- MODIFY: `apps/frontend/src/components/overview/SnapshotTimeline.tsx`

**Steps:**

1. Find the 60px max-width truncation on snapshot names
2. Widen to ~120px (or use `max-w-[8rem]` / similar)
3. Add a `title` attribute (or a Tooltip component) to show the full name on hover
4. Ensure `truncate` class is still applied for overflow
5. `bun run build && bun run lint`

**Commit:** `fix: widen snapshot name truncation and add hover tooltips`

---

### Task 15: Update design system documentation

**Files:**

- MODIFY: `docs/2. design/design-system.md`

**Steps:**

1. **Waterfall type hierarchy table** — update to D3 values:
   - Tier label: 13px / Outfit / 600 / uppercase / 0.09em tracking
   - Tier total: 15px / JetBrains Mono / 600 / tier colour
   - Item name: 13px / Nunito Sans / 400 / text-secondary
   - Item amount: 13px / JetBrains Mono / 400 / subtle foreground
   - Remove the old 18px/16px/24px values

2. **Ambient glows** — add a new subsection under Foundations (after Background & Depth) documenting:
   - Per-page glow table (page, primary colour/position/opacity, secondary colour/position/opacity)
   - Implementation note: CSS `data-page` attribute + pseudo-elements

3. **Empty state patterns** — add a new subsection under UX Patterns documenting:
   - Ghosted cascade (no waterfall)
   - Contextual hint (right panel placeholder)
   - Fading skeleton + CTA card (list empties)
   - Callout gradient CTA card spec (gradient values, border, border-radius, padding)

4. **Wordmark** — add a note in an appropriate section: "The canonical product name is **finplan** — lowercase, one word. Never 'FinPlan', 'Fin Plan', 'FINPLAN', or any other variation."

5. **Cascade connectors** — document in the waterfall section: connector component spec (font, size, colour, horizontal rules)

**Commit:** `docs: update design system with D3 typography, ambient glows, empty states, and wordmark`

---

## Testing

### Frontend Tests

This is a visual polish feature — most validation is manual/visual. However:

- [ ] Verify `bun run build` passes clean (TypeScript compilation catches prop changes)
- [ ] Verify `bun run lint` passes with zero warnings
- [ ] If snapshot tests exist for modified components, update them

### Key Scenarios

- [ ] **Happy path (waterfall with data):** All four tier labels + totals show in tier colours. Connectors ("minus committed", "minus discretionary", "equals") appear between tiers. Typography hierarchy: tier headers visually heavier than item rows.
- [ ] **Empty state (no waterfall):** Ghosted cascade with four tier headers at low opacity, connectors at lower opacity, gradient CTA card with "Get started" button that enters build mode.
- [ ] **Empty state (list panels):** Fading skeleton rows + gradient CTA card with contextual text and "+ Add" button. Verify in: AccountListPanel, PurchaseListPanel, GiftPersonListPanel, GiftUpcomingPanel.
- [ ] **Ambient glows:** Navigate between Overview, Wealth, Planner, Settings — each should have a subtly different atmospheric colour. Glows should not block interaction with any content.
- [ ] **Right panel placeholder:** Shows icon + guidance text when no item selected.
- [ ] **Minor fixes:** Amber indicators use `text-attention` class (inspect element to verify). Buttons in ItemDetailPanel use `<Button>`. Checkboxes are styled (not browser default). Wordmark shows "finplan" in Outfit font. Confetti has ~20 particles. Snapshot names show tooltip on hover.
- [ ] **Reduced motion:** Verify `prefers-reduced-motion` is respected — glows are static (no animation), so no change needed. Confetti already respects this.

## Verification

- [ ] `bun run build` passes clean
- [ ] `bun run lint` — zero warnings
- [ ] `bun run type-check` — no errors
- [ ] Manual: navigate all 4 pages, verify ambient glows differ
- [ ] Manual: view waterfall with data — connectors, tier colours, typography hierarchy
- [ ] Manual: view waterfall with no data — ghosted cascade + CTA card
- [ ] Manual: view empty lists (accounts, purchases, gifts) — fading skeleton + CTA card
- [ ] Manual: inspect amber indicators — should use `text-attention` class not inline style
- [ ] Manual: verify checkboxes in login page and build summary are styled
- [ ] Manual: verify "finplan" wordmark uses Outfit font
- [ ] Manual: trigger confetti on WelcomePage — count ~20 particles
- [ ] Manual: view SnapshotTimeline with long names — wider truncation + tooltip on hover

## Post-conditions

- [ ] Design system documentation (`design-system.md`) is in sync with implemented values
- [ ] Shared components (`WaterfallConnector`, `GhostedListEmpty`) are available for future features
- [ ] Ambient glow system is extensible — new pages just add a `data-page` attribute and CSS rule
- [ ] All empty states follow a consistent ghosted structure pattern
- [ ] Canonical wordmark "finplan" is documented and consistently applied
