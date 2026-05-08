# Mobile Accessibility & WCAG 2.1 AA Pass

## Context

The finplan frontend is desktop-first. `TwoPanelLayout` hardcodes a 360px aside (used on ~10 of 14 pages), several stat grids force 3–4 columns, default icon buttons are 36px (below WCAG 44px touch-target minimum on mobile), and a few interactions (`SnapshotTimeline` scrubbing, dnd-kit subcategory reorder) are mouse-only. The viewport meta tag, the hamburger Sheet, semantic HTML and Radix primitives are already in place — so the gap is layout-collapse + interaction parity, not a navigation rebuild.

**Outcome**: full feature parity at a 360px viewport (iPhone SE), all touch targets ≥44px on mobile, WCAG 2.1 AA verified by automated axe and manual VoiceOver pass. Tablets (≥768px) keep the desktop layout. Locked-in scope: phone-first responsive web (single codebase), no PWA, no native shell. TwoPanelLayout pages collapse via master-detail push navigation. Existing hamburger nav is retained. Charts use responsive scaling of the same visualisations.

---

## Phase 1 — Foundations (~1.5 dev-days)

**Goal**: install lint/test guardrails, settle breakpoint and hook conventions, fix global primitives so every later phase inherits them.

**Files**:

- `apps/frontend/package.json`, `apps/frontend/eslint.config.js`
- `apps/frontend/vitest.config.ts` and test setup file
- `apps/frontend/tailwind.config.js`
- `apps/frontend/src/components/ui/button.tsx`
- `apps/frontend/src/index.css` (label utilities ~lines 214–222)
- New: `apps/frontend/src/hooks/useIsMobile.ts`

**Approach**:

- **eslint-plugin-jsx-a11y**: add `plugin:jsx-a11y/recommended`. Land as `warn` first, escalate to `error` after fixes. Anticipate ~20–40 inline disables or fixes (alt text, click-without-keyboard, label-for).
- **vitest-axe**: install and expose `expectNoA11yViolations(container)` from `apps/frontend/src/test/a11y.ts`. Don't bulk-add to every test now — Phase 6 wires a smoke pass.
- **Tailwind breakpoint**: add `xs: 480px`. Default `sm:` at 640px is too wide for the 360–430px phone band; cashflow grids look bad jumping straight 1→4. Non-breaking — no existing class uses `xs:`.
- **`useIsMobile()` hook**: at `apps/frontend/src/hooks/useIsMobile.ts`. Implementation: `window.matchMedia('(max-width: 767px)')` via `useSyncExternalStore` for SSR safety. Used only where CSS branching can't express the rule (URL-vs-store selection, dnd-kit sensor config). Default `false` during SSR.
- **Touch targets in button.tsx** — `size` variants:
  - `default`: `h-10 px-4 py-2 sm:h-9` (44px mobile, 36px desktop)
  - `sm`: `h-9 px-3 text-xs sm:h-8`
  - `icon`: `h-11 w-11 sm:h-9 sm:w-9`
  - `lg`: unchanged (already 40px)

  Audit raw `<button>` elements (Layout hamburger, NavLinks) and ensure mobile padding hits 44px.

- **Label contrast** in `apps/frontend/src/index.css`:
  - `.label-section`: `text-muted-foreground/60` → `/75`
  - `.label-detail`: `/70` → `/85`
  - `.label-chart`: switch from `text-text-tertiary` to `text-secondary` (verify ≥ 4.5:1 against `--card`).

**Risks**: jsx-a11y noise blocks CI — mitigated by `warn`-first rollout.

**Verify**: `bun run lint && bun run type-check`; render Button at both viewports.

---

## Phase 2 — TwoPanelLayout responsive refactor (~2 dev-days)

**Goal**: master-detail push navigation on mobile, desktop unchanged.

**Files**:

- `apps/frontend/src/components/layout/TwoPanelLayout.tsx`
- `apps/frontend/src/components/common/PageHeader.tsx` (add optional `onBack` slot)
- New: `apps/frontend/src/hooks/useSelectedDetailId.ts`
- `apps/frontend/src/design-system.test.tsx` (relax invariants)
- All 10 pages using TwoPanelLayout (small change — pass `detailKey`, read selection through new hook)

**Approach**:

- **TwoPanelLayout API**: add optional `detailKey?: string | null` prop. When `useIsMobile()` is true:
  - `detailKey == null` → render only the left aside, full-screen (`w-full`, no border).
  - `detailKey != null` → render only `right`, full-screen, with framer-motion slide-in (gated on `useReducedMotion()`).
- Replace `w-[360px] min-w-[360px]` with `w-full md:w-[360px] md:min-w-[360px]`.
- **`useSelectedDetailId(key)` hook** — URL state via `?detail=<id>` (decision A):
  - Reads `useSearchParams`; writes via `setSearchParams({ detail }, { replace: false })` so the OS back button clears selection naturally.
  - On desktop, syncs URL value into the existing per-page Zustand slice on mount and on change, so existing right-panel components keep working unmodified.
  - Returns `[selectedId, setSelectedId, clearSelectedId]`.
- **PageHeader**: when mobile + `detailKey != null`, render a leading 44px chevron back-button bound to `clearSelectedId`. Desktop ignores. Keeps existing "PageHeader as first child" invariant.
- **Page wiring**: Assets, Goals, Income, Committed, Discretionary, Surplus replace direct store reads with `useSelectedDetailId` (the hook writes through to the store on desktop for backward compat). Forecast and Overview have no per-item selection — see decision E for Overview default.
- **`design-system.test.tsx`**: update the TwoPanelLayout invariant to allow `w-full md:w-[360px]`. Allow PageHeader's optional back-button slot.

**Risks**:

- URL-driven selection on desktop fights existing programmatic "select after create"; mitigate by making the hook bidirectional with explicit "URL is source of truth on mobile" rule.
- Animation flicker on slow devices — gated on reduced-motion.

**Verify**: design-system tests pass; nav forward/back on each page; deep-link `/assets?detail=<id>` resolves on both viewports.

---

## Phase 3 — Page-by-page mobile pass (~3 dev-days)

**Goal**: every page renders cleanly at 360px with no horizontal scroll, all primary actions reachable.

- **Overview**: in `WaterfallSankey` replace fixed `width="320" height="200"` with `viewBox="0 0 320 200"` + `preserveAspectRatio="xMidYMid meet"` + `className="w-full h-auto max-w-[320px]"`. Mobile right-panel default: **show Left only** (decision E).
- **Forecast**: wrap recharts in `<ResponsiveContainer width="100%" height={220}>`. Stat cards `grid-cols-4` → `grid-cols-2 sm:grid-cols-4`. Consider `<details>` disclosure for secondary stats below 480px.
- **Assets, Goals**: master-detail push (Phase 2 covers this); verify create/edit modals open full-width on mobile.
- **Income / Committed / Discretionary / Surplus**: master-detail push. `WaterfallTierTable`: switch row from `flex` to two-line stacked card on mobile (one component, responsive classes — decision G). Row 1: name + meta (`text-secondary`). Row 2: amount (right-aligned, `font-mono tabular-nums`) + actions menu.
- **FullWaterfallPage**: wrap each tier section in Radix `<Accordion>` on mobile (`md:hidden` accordion + `hidden md:block` table). Default expanded: current tier; others collapsed. Already has `SubcategoryGroup` to lean on.
- **Cashflow grids** (`CashflowMonthView.tsx:95`, `CashflowYearView.tsx:63`, `UpcomingModePanel.tsx:114`): `grid-cols-4` → `grid-cols-2 sm:grid-cols-4`.
- **CompoundInterestCalculator** (`:35`, `:79`): `grid-cols-3` → `grid-cols-1 xs:grid-cols-3`.
- **NetWorthBar** (`:23`), **GrowthSectionPanel** (`:55`): `grid-cols-3` → `grid-cols-1 sm:grid-cols-3`.
- **Settings (Profile, Household)**: form inputs `text-sm` → `text-base sm:text-sm` (prevents iOS focus zoom). Stack horizontal field-pairs vertically below `sm:`.
- **Help, Gifts, Auth**: confirm `max-w-md mx-auto`; reduce `px-8` to `px-4 sm:px-8`.

**Risks**: stacked WaterfallTierTable rows lose amount scan-ability — mitigate via right-aligned `font-mono tabular-nums` on row 2.

**Verify**: screenshot each page at 360 / 390 / 768; no horizontal scrollbar except in FullWaterfall desktop fallback.

---

## Phase 4 — Interactions (~1.5 dev-days)

**Goal**: every interactive surface works with touch.

- **`SubcategoriesSection.tsx`** (dnd-kit reorder): configure both `PointerSensor` (`activationConstraint: { distance: 5 }`) and `TouchSensor` (`activationConstraint: { delay: 200, tolerance: 5 }`). Add explicit `↑`/`↓` icon buttons next to each row as the a11y/discoverability fallback and the keyboard path. **Both** approaches (decision D).
- **`SnapshotTimeline.tsx`** (custom mouse-drag): replace `onMouseDown/Move/Up` with `onPointerDown/Move/Up` + `setPointerCapture`. One handler set covers mouse, touch, pen. Add `touch-action: pan-y` so vertical page scroll still works while horizontally scrubbing.
- **Tooltips**: Radix `Tooltip` works on touch via `delayDuration` — verify tap-hold opens. For recharts tooltips, default touch behaviour is acceptable; configure `trigger="click"` if discoverability suffers.
- **Search**: `useSearchHotkey.ts` is hotkey-only. Add a visible `<SearchTriggerIcon>` in `Layout.tsx` next to the hamburger (visible `md:hidden`).

**Risks**: dnd-kit touch-sensor delay can feel laggy; 200ms is standard. Test on iPhone — adjust to 250ms if accidental drags occur during scroll.

**Verify**: real-device test on iOS Safari and Android Chrome.

---

## Phase 5 — A11y completion to WCAG AA (~1.5 dev-days)

**Goal**: pass automated axe checks and clear remaining manual gaps.

- **Toast aria-live**: wrap toaster portal in `role="status" aria-live="polite" aria-atomic="false"`. Sonner accepts `toastOptions` for this.
- **Scrollable containers with focusable children**: grep `overflow-y-auto`. Containers that are scroll-only get `tabIndex={0}`. Ones whose children take focus naturally don't.
- **Placeholder-only inputs**: audit forms across `apps/frontend/src/features/**/forms/*.tsx`. Add `<Label htmlFor>` or `aria-label`. ~5–15 instances expected.
- **Smoke a11y test**: `apps/frontend/src/test/a11y.smoke.test.tsx` mounts each top-level page (mocked queries) and asserts `expectNoA11yViolations`. Allowlist false positives with comments.
- **Contrast sweep**: grep `text-foreground/[0-4]0`, `text-muted-foreground/[0-6]0`. For each occurrence, compute rendered colour against local background; verify ≥ 4.5:1 (large text ≥ 3:1). Fix utility classes once, propagate.
- **Hamburger button**: bump padding to hit 44px target; confirm `aria-expanded` is bound to `navOpen`.

**Risks**: contrast sweep may surface dozens of violations — triage by frequency, fix utility classes first.

**Verify**: vitest a11y smoke pass; manual VoiceOver pass on iOS for Overview, Assets, and a form page.

---

## Phase 6 — Verification & sign-off (~1 dev-day)

- **Local emulation**: Chrome DevTools at 375×667 (iPhone SE), 393×852 (iPhone 14 Pro), 412×915 (Pixel 7), 768×1024 (iPad — must match desktop).
- **Real device**: iOS Safari (strictest). Confirm no input zoom, no horizontal scroll, no stuck modals.
- **Automated**: `bun run lint`, `bun run type-check`, `bun run test` (incl. a11y smoke + design-system invariants), backend tests via `cd apps/backend && bun scripts/run-tests.ts`.
- **Lighthouse mobile**: Accessibility ≥ 95, Best Practices ≥ 95.
- **Manual checklist per page**: navigable, every form submittable, every modal usable, every chart readable, no horizontal scroll, all touch targets ≥ 44px, no zoom needed, back button works.

---

## Cross-cutting design decisions (with pros/cons)

### A. URL state vs store state for master-detail

**Recommend: URL (`?detail=<id>`)** with bidirectional store sync.

- **Pros**: native back-button clears selection; deep-linking; shareable; survives reload.
- **Cons**: sync logic with existing Zustand slices; requires the `useSelectedDetailId` wrapper.

### B. Custom `xs: 480px` vs sticking with default `sm: 640px`

**Recommend: add `xs: 480px`.**

- **Pros**: many phones (414–430px) need a step before 640px; cashflow grids look bad jumping 1→4.
- **Cons**: one more breakpoint to remember.

### C. Mobile-first vs desktop-first className ordering

**Recommend: keep desktop-first** (current convention).

- **Pros**: 100% consistency with existing codebase; smaller diff; design-system tests already encode it.
- **Cons**: counter to Tailwind's idiomatic mobile-first guidance — accepted for consistency.

### D. dnd-kit touch sensor vs explicit ↑/↓ buttons

**Recommend: both.**

- **Pros**: touch-sensor is the natural gesture; ↑/↓ buttons are a11y/discoverability fallback and the keyboard interaction surface for all users.
- **Cons**: two affordances to maintain.

### E. Overview right-panel default on mobile

**Recommend: show Left only.**

- **Pros**: simplest; matches master-detail mental model; Overview's left panel is already the headline (Sankey).
- **Cons**: less to look at on first load.

### F. Global vs mobile-conditional touch-target sizing

**Recommend: mobile-conditional** (`h-11 sm:h-9` etc.).

- **Pros**: preserves desktop density (a known design value).
- **Cons**: more verbose classes — acceptable; global 44px would visibly bloat desktop tables.

### G. WaterfallTierTable: one responsive component vs two

**Recommend: one component, responsive classes.**

- **Pros**: single source of truth; data shape unchanged.
- **Cons**: classNames get longer — small price.

---

## Effort & sequencing

| Phase               | Effort | Depends on                           |
| ------------------- | ------ | ------------------------------------ |
| 1 — Foundations     | 1.5 d  | —                                    |
| 2 — TwoPanelLayout  | 2 d    | 1 (useIsMobile, button sizes)        |
| 3 — Page-by-page    | 3 d    | 2 (master-detail), 1 (xs breakpoint) |
| 4 — Interactions    | 1.5 d  | 1                                    |
| 5 — A11y completion | 1.5 d  | 3                                    |
| 6 — Verification    | 1 d    | all                                  |

**Total: ~10.5 dev-days.** Phases 1, 2, 4 can overlap after the first half of Phase 1 lands. Phase 3 must wait on Phase 2. Phase 5 must wait on Phase 3.

---

## Critical files

- `apps/frontend/src/components/layout/TwoPanelLayout.tsx`
- `apps/frontend/src/components/layout/Layout.tsx`
- `apps/frontend/src/components/common/PageHeader.tsx`
- `apps/frontend/src/components/ui/button.tsx`
- `apps/frontend/src/index.css`
- `apps/frontend/src/design-system.test.tsx`
- `apps/frontend/tailwind.config.js`
- `apps/frontend/eslint.config.js`
- New: `apps/frontend/src/hooks/useIsMobile.ts`, `apps/frontend/src/hooks/useSelectedDetailId.ts`, `apps/frontend/src/test/a11y.ts`, `apps/frontend/src/test/a11y.smoke.test.tsx`
