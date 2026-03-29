---
feature: design-critique
status: approved
creation_date: 2026-03-28
---

# Design Critique — Design Progress

> **Purpose:** Captures agreed design decisions from the critique walkthrough. All 26 items resolved.

---

## Grouping

10 design doc groups cover the 26 open critique items:

| Group                       | Items                        | Status         |
| --------------------------- | ---------------------------- | -------------- |
| **animations**              | #6, #7, #8, #9, #10          | ✅ All decided |
| **typography-system**       | #21, #22, #23, #25           | ✅ All decided |
| **spacing-rhythm**          | #16, #17, #18, #19, #20      | ✅ All decided |
| **colour-tokens**           | #5, #24                      | ✅ All decided |
| **microcopy**               | #12, #13, #26, #27, #29, #30 | ✅ All decided |
| **empty-states**            | #4                           | ✅ All decided |
| **nav-placeholders**        | #3                           | ✅ All decided |
| **right-panel**             | #2                           | ✅ All decided |
| **build-wizard-completion** | #11, #14                     | ✅ All decided |
| **review-wizard-polish**    | #15                          | ✅ All decided |

---

## Agreed Decisions

### Animations

| #   | Issue                                           | Decision                                 | Detail                                                                                                                                                                                                                                                                                                                                                    |
| --- | ----------------------------------------------- | ---------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 6   | Accordion expand/collapse is instant            | **A — AnimatePresence height + opacity** | `AnimatePresence` wrapping `ItemAccordion` and `ItemForm` in `ItemAreaRow.tsx`. `motion.div` with `initial: { height: 0, opacity: 0 }` → `animate: { height: "auto", opacity: 1 }` → `exit: { height: 0, opacity: 0 }`, `transition: { duration: 0.2, ease: [0.25, 1, 0.5, 1] }`, `overflow: hidden`. Same treatment for add-item form in `ItemArea.tsx`. |
| 7   | ReviewWizard has no step transitions            | **A — Directional slide + fade**         | Forward: content exits left, enters from right. Back: reverse. 200ms ease-out-quart. `AnimatePresence mode="wait"` keyed on `currentStep`. Requires tracking direction in state.                                                                                                                                                                          |
| 8   | SubcategoryList selection indicator is instant  | **A — Framer layoutId indicator**        | Replace `border-l-2` with absolutely-positioned `motion.div` using `layoutId="subcategory-indicator-{tier}"`. Bar and background highlight both slide between rows (220ms ease-out-quart, transform-only). Wrapped in `<LayoutGroup>`. Reduced motion: static `div` fallback.                                                                             |
| 9   | Missing entrance animations on contextual cards | **A — Per-card treatments**              | NudgeCard: `opacity: 0→1, y: 4→0` (250ms, easeOut). EmptyStateCard/CTA: `opacity: 0→1, scale: 0.97→1` (250ms, ease-out-quint). GhostedListEmpty: stagger ghost rows at `staggerChildren: 0.06`, `y: 6→0`. **Note:** Item list entrance stagger already shipped (commit b220039 — SubcategoryList rows stagger from left on mount).                        |
| 10  | ReviewWizard confirmation has no feedback       | **A — Animated opacity transition**      | `motion.div` with `animate={{ opacity: isResolved ? 0.6 : 1 }}` over 300ms ease-out-quart. Builds on existing `✓ Done` label.                                                                                                                                                                                                                             |

### Typography System

| #   | Issue                                        | Decision                                              | Detail                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| --- | -------------------------------------------- | ----------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 21  | Arbitrary font sizes outside Tailwind scale  | **A — Collapse unanchored sizes + named tokens**      | `text-[10px]`, `text-[11px]`, `text-[12.5px]` → `text-xs` (12px). `text-[28px]` → `text-[30px]` (aligns with hero standard). Documented waterfall sizes become named Tailwind tokens: `text-connector` (10.5px), `text-tier` (13px), `text-tier-total` (15px), `text-hero` (30px). Standard Tailwind classes (`text-xs`, `text-sm`, `text-base`, `text-lg`) kept as-is — no need to name them. Design-system.md updated to document the tokens. No magic numbers — every size is either a Tailwind default or a named token. |
| 22  | `font-mono` / `font-numeric` interchangeable | **A — Replace financial font-mono with font-numeric** | Reserve `font-mono` for code/technical text only. All financial figures use `font-numeric`. Affected: `WealthLeftPanel.tsx:70`, `NetWorthBar.tsx`, and others where content is a currency or percentage.                                                                                                                                                                                                                                                                                                                     |
| 23  | Uppercase label treatment inconsistent       | **A — Single canonical treatment**                    | `text-xs font-medium uppercase tracking-wider text-muted-foreground`. Applied to all section headers except waterfall tier labels (which keep their unique `tracking-tier` + tier colour). Replaces 7 different treatments across the app.                                                                                                                                                                                                                                                                                   |
| 25  | Hero amount typography diverges              | **A — Standardise to one treatment**                  | `text-hero font-numeric font-extrabold` (30px, 800 weight) everywhere. Colour varies by context: `text-primary` for waterfall items, `text-foreground` for wealth, `text-tier-surplus` for surplus. Size and weight are always the same — only colour changes. Surplus page comes down from 36px to 30px.                                                                                                                                                                                                                    |

### Spacing & Rhythm

| #   | Issue                                                    | Decision                      | Detail                                                                                                                                                                                                                                                                                                        |
| --- | -------------------------------------------------------- | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 19  | No shared vertical rhythm convention                     | **A — Two-tier spacing**      | Between major sections: `space-y-6` (24px). Within sections: `space-y-2` (8px). Related elements grouped (breadcrumb + heading, amount + staleness). Applied to all right-panel detail views. Settings page keeps its own wider rhythm (`space-y-12` / `space-y-4`) — justified by long-form editing context. |
| 16  | Right-panel detail panels use different vertical rhythms | **Resolved by #19**           | All panels adopt the two-tier convention from #19. `AccountDetailPanel`, `ItemDetailPanel`, `CommittedBillsPanel`, `IncomeTypePanel` all standardise.                                                                                                                                                         |
| 17  | WealthLeftPanel padding inconsistency                    | **B — Strip to px-4**         | Replace `px-5` with `px-4` (16px) throughout WealthLeftPanel — hero, breakout card, and body. Aligns with all other left panels. Breakout card repositioned from `left-4 right-4` to `left-3 right-3`.                                                                                                        |
| 18  | List item density too tight in Wealth                    | **Current pattern — unified** | Keep `space-y-0.5` + `py-1.5` (current tight pattern) applied uniformly. Unify WealthLeftPanel's inconsistent `space-y-0.5`/`space-y-1` to `space-y-0.5` throughout. Same pattern applied to WaterfallLeftPanel and PlannerLeftPanel for consistency.                                                         |
| 20  | PlannerLeftPanel cramped                                 | **Current pattern — unified** | Standardise to `space-y-0.5` + `py-1.5` across PlannerLeftPanel, matching all other left panels.                                                                                                                                                                                                              |

### Colour Tokens

| #   | Issue                                | Decision                       | Detail                                                                                                                          |
| --- | ------------------------------------ | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------- |
| 5   | GhostAddButton contrast too low      | **A — Minimal lift**           | `border-foreground/10` → `border-foreground/20`. `text-foreground/45` → `text-foreground/60`. Passes WCAG AA, keeps ghost feel. |
| 24  | Hardcoded hex colours in 7 locations | **Replace with design tokens** | All 7 hardcoded hex values replaced with appropriate CSS custom properties / Tailwind tokens. No hardcoded colours in codebase. |

### Microcopy

| #   | Issue                                       | Decision                               | Detail                                                                                                                                                                                                                                                                                                                                                                       |
| --- | ------------------------------------------- | -------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 12  | Toast messages are transactional            | **C — Softer words + affirmations**    | Success: specific noun-phrase, past tense. Softer words: "saved" not "updated", "removed" not "deleted", "sent" not "created". Contractions: "you've" not "you have". Errors: `"Couldn't [verb] [noun] — [next step]"`. Next step is context-aware: "try again" (generic), "check your connection" (network), "contact support" (persistent). No exclamation marks or emoji. |
| 13  | No recognition when all items are fresh     | **Toast on last stale item confirmed** | `"All caught up — no more stale items"`                                                                                                                                                                                                                                                                                                                                      |
| 26  | Error messages are generic                  | **Resolved by #12**                    | `"Couldn't [verb] [noun] — [next step]"` pattern from #12 applies.                                                                                                                                                                                                                                                                                                           |
| 27  | Delete confirmation uses "Are you sure?"    | **B — Named item + consequence**       | Heading: `"Remove [Item Name]?"`. Body: `"[Item Name] will be permanently removed from your plan."` No "Are you sure?" language.                                                                                                                                                                                                                                             |
| 29  | Empty state copy is imperative              | **B — Question prompt**                | Heading: `"What [x] do you have?"` / `"What are you saving towards?"` etc. Subtext: `"Add your first [x] to begin building your plan"`. Pattern applied across all addable empty states.                                                                                                                                                                                     |
| 30  | StaleDataBanner says "Data may be outdated" | **Rewrite as sync failure message**    | `"Couldn't sync — showing last saved data · [time ago] · Retry"`. Distinguishes sync failure from item staleness.                                                                                                                                                                                                                                                            |

### Empty States

| #   | Issue                             | Decision                  | Detail                                                                                                                                                                                                                                                                                                                                               |
| --- | --------------------------------- | ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 4   | Inconsistent empty state patterns | **Three-context pattern** | **Addable lists** (GhostedListEmpty): remove skeleton rows entirely — CTA card only. Question prompt heading + subtext on left, button right-aligned. **Informational panels** (overview/derived): centered heading + one-line subtext pointing where to act. **Inline/contextual** (notes, events): unchanged — minimal italic text is appropriate. |

### Nav Placeholders

| #   | Issue                                | Decision        | Detail                  |
| --- | ------------------------------------ | --------------- | ----------------------- |
| 3   | Goals and Gifts show identical stubs | **Leave as-is** | No change at this time. |

### Right Panel

| #   | Issue                  | Decision        | Detail                  |
| --- | ---------------------- | --------------- | ----------------------- |
| 2   | Right panel dead zones | **Leave as-is** | No change at this time. |

### Build Wizard Completion

| #   | Issue                                      | Decision    | Detail        |
| --- | ------------------------------------------ | ----------- | ------------- |
| 11  | No celebration when build wizard completes | **Skipped** | Out of scope. |
| 14  | Build wizard dumps to bare Overview        | **Skipped** | Out of scope. |

### Review Wizard Polish

| #   | Issue                                      | Decision                   | Detail                                                                           |
| --- | ------------------------------------------ | -------------------------- | -------------------------------------------------------------------------------- |
| 15  | ReviewWizard closes without summary moment | **A — Final summary step** | Final wizard step shows: items reviewed count, any still-stale count, timestamp. |

---

## Design Standard Updates Queued

The following updates to `docs/2. design/design-system.md` are implied by the agreed decisions:

1. **Named font size tokens** (#21): Add `text-connector`, `text-tier`, `text-tier-total`, `text-hero` to the Typography section
2. **Section label convention** (#23): Document the canonical treatment in the Component Catalogue
3. **Vertical rhythm convention** (#19): Document the two-tier spacing rule in Spacing and Layout
4. **Hero amount convention** (#25): Update the Waterfall Type Hierarchy table to reflect the standardised treatment
5. **Toast tone rules** (#12): Document voice/tone rules in a new Microcopy section — success pattern, error pattern, word choice list, no emoji/exclamation rule

---

## Visual Companion Mockups

Mockups from session 1 are in `.superpowers/brainstorm/1803-1774685786/`:

| File                         | Shows                                                                                     |
| ---------------------------- | ----------------------------------------------------------------------------------------- |
| `accordion-options.html`     | #6 — current vs height+opacity vs CSS grid animation                                      |
| `wizard-transitions.html`    | #7 — current vs directional slide vs crossfade                                            |
| `subcategory-indicator.html` | #8 — current vs animated layoutId indicator                                               |
| `card-entrances.html`        | #9 — per-card entrance animations (NudgeCard, EmptyStateCard, GhostedListEmpty, ItemArea) |
| `font-size-collapse.html`    | #21 — before/after type scale and component comparisons                                   |
| `spacing-rhythm.html`        | #19 — two-tier spacing convention across three panel types                                |
| `wealth-padding.html`        | #17 — current vs px-4 vs edge-to-edge hero                                                |

Mockups from session 2 are in `.superpowers/brainstorm/595-1774786215/`:

| File                      | Shows                                                                  |
| ------------------------- | ---------------------------------------------------------------------- |
| `left-panel-spacing.html` | #18/#20 — current vs Option A across Waterfall, Wealth, Planner panels |
| `ghost-add-button.html`   | #5 — current vs Option A vs Option B contrast levels                   |
| `toast-tone-v2.html`      | #12 — before/after toast messages with tone rules                      |
| `empty-states-v2.html`    | #4 — skeleton rows removed, CTA card layout, question prompt copy      |
