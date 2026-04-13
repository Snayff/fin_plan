# finplan Design Tokens

> Colour tokens, typography, spacing, z-index, and all design primitives. For components see `design-components.md`; for page patterns and interaction rules see `design-patterns.md`.

---

## 1. Theme

Dark theme only. No light mode. No theme switching. If this changes in future, the token layer (not component code) is the only thing that needs updating.

---

## 2. Colour Tokens

The colour system has three layers: **primitives** (raw values) → **semantic roles** (what it means) → **component tokens** (where it's used).

### Background & Depth

| Token          | Value            | Role                                                                       |
| -------------- | ---------------- | -------------------------------------------------------------------------- |
| `background`   | `#080a14`        | Main app background — deep navy, almost black with blue undertone          |
| `ambient-glow` | Radial gradients | Indigo/violet at top-right, teal at bottom-left — subtle depth, never flat |

The background is never a plain solid. Ambient radial glows give the canvas depth without competing with content.

### Page Ambient Glows

Each page has dual radial gradient glows at very low opacity.

| Page     | Primary                          | Secondary                         |
| -------- | -------------------------------- | --------------------------------- |
| Overview | Indigo, top-right, 6% opacity    | Violet, bottom-left, 3.5% opacity |
| Wealth   | Blue, top-left, 5% opacity       | Teal, bottom-right, 3% opacity    |
| Planner  | Purple, center-right, 5% opacity | Indigo, bottom-left, 3% opacity   |
| Settings | Neutral, bottom-right, 2.5%      | None                              |

**Implementation:** CSS `[data-page]` attribute on the page wrapper + `::before` / `::after` pseudo-elements with `position: fixed`, `pointer-events: none`, `z-index: 0`. Glows use `radial-gradient(ellipse, ... 0%, transparent 65%)`. No animation — static only.

### Surfaces

Three elevation levels with wide steps (~8–10 lightness points) for clear visual hierarchy.

| Token              | Background | Border    | Used for                                |
| ------------------ | ---------- | --------- | --------------------------------------- |
| `surface`          | `#0d1120`  | `#1a1f35` | Cards, panels, sidebars                 |
| `surface-elevated` | `#141b2e`  | `#222c45` | Modals, popovers, selected rows         |
| `surface-overlay`  | `#1c2540`  | `#2a3558` | Dropdowns, tooltips, top-layer elements |

**Rule:** No shadows — the dark theme relies on border contrast, not elevation shadows.

### Text

All text uses a blue-white tint. The base tint is `rgb(238, 242, 255)` at varying opacities.

| Token            | Value                       | Used for                                    |
| ---------------- | --------------------------- | ------------------------------------------- |
| `text-primary`   | `rgba(238, 242, 255, 0.92)` | Headlines, key values, primary labels       |
| `text-secondary` | `rgba(238, 242, 255, 0.65)` | Item names, descriptions, body text         |
| `text-tertiary`  | `rgba(238, 242, 255, 0.40)` | Metadata, helper text, timestamps           |
| `text-muted`     | `rgba(238, 242, 255, 0.25)` | Placeholders, disabled text, divider labels |

### Tier Colours

One colour per waterfall tier, used exclusively for that tier's heading, accent bar, and value text.

| Token                | Value     | Tier            | Semantic intent                       |
| -------------------- | --------- | --------------- | ------------------------------------- |
| `tier-income`        | `#0ea5e9` | Income          | The source — energetic, electric blue |
| `tier-committed`     | `#6366f1` | Committed Spend | Neutral obligation — settled indigo   |
| `tier-discretionary` | `#a855f7` | Discretionary   | Chosen spend — expressive purple      |
| `tier-surplus`       | `#4adcd0` | Surplus         | The answer — rewarding teal-mint      |

**Rule:** Tier colours are semantically protected. They must only appear in their tier context — heading text, accent bar, value text, and contextual interactive states (hover/selected backgrounds at reduced opacity). They must never be repurposed for status indicators, attention signals, buttons, or any non-tier UI element.

### Accent & Action

| Token         | Value     | Used for                                                       | Notes                                                                           |
| ------------- | --------- | -------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `action`      | `#7c3aed` | Buttons, focus rings, CTAs, primary interactive elements       | Electric violet — the app's action colour                                       |
| `page-accent` | `#8b5cf6` | Breadcrumbs, section headers, nav indicators on non-tier pages | Soft violet — bluer and cooler than Discretionary, never reads as a tier signal |

### Callout Gradients

Gradient text for engagement and special highlights. Applied via `background-clip: text`.

| Token               | Value                                 | Used for                                             |
| ------------------- | ------------------------------------- | ---------------------------------------------------- |
| `callout-primary`   | `#0ea5e9` → `#a855f7` (blue → purple) | Hero emphasis, key phrases, primary standout moments |
| `callout-secondary` | `#a855f7` → `#4adcd0` (purple → teal) | Secondary emphasis, variety                          |

**Rule:** Callout gradients are for engagement only — hero headlines, wordmark, key summary phrases, standout CTAs. Never use them for warnings, attention items, informational alerts, or tier headings.

### Callout Gradient Cards

Low-opacity gradient backgrounds for hero cards and completion moments.

| Gradient        | CSS                                                                             | Border                            | Canonical locations            |
| --------------- | ------------------------------------------------------------------------------- | --------------------------------- | ------------------------------ |
| Indigo → Purple | `linear-gradient(135deg, rgba(99,102,241,0.08) 0%, rgba(168,85,247,0.05) 100%)` | `1px solid rgba(99,102,241,0.1)`  | Empty state CTAs, Welcome hero |
| Purple → Teal   | `linear-gradient(135deg, rgba(168,85,247,0.06) 0%, rgba(74,220,208,0.04) 100%)` | `1px solid rgba(168,85,247,0.08)` | Build completion card          |

**Rule:** All callout gradient cards use `rounded-xl`, `p-6` padding, and a 1px border at ~10% opacity of the gradient start colour.

### Attention

One colour, one pattern. Amber is the universal "noteworthy" signal.

| Token              | Value                      | Used for                                                            |
| ------------------ | -------------------------- | ------------------------------------------------------------------- |
| `attention`        | `#f59e0b`                  | Dot indicator, text detail, inline labels — always this exact value |
| `attention-bg`     | `rgba(245, 158, 11, 0.04)` | Nudge card background tint only                                     |
| `attention-border` | `rgba(245, 158, 11, 0.08)` | Nudge card border only                                              |

**Rule:** `#f59e0b` everywhere — staleness dots, staleness text, cashflow attention, nudge card dots. No variations in hue or saturation across contexts.

### Status

The app is **non-judgemental**. Financial values are never colour-coded as good or bad.

| Token     | Value     | Used for                                                                              | Never for                                                   |
| --------- | --------- | ------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| `error`   | `#ef4444` | App errors only — validation failures, system errors, destructive action confirmation | Financial shortfalls, negative balances, over-budget states |
| `success` | `#22c55e` | UI confirmations only — saved, completed, synced                                      | Positive balances, surplus amounts, financial "good" states |

**Removed tokens:** `shortfall` (was red for cashflow — now attention amber), `surplus-positive` / `surplus-warning` (removed — no good/bad colour coding), `expense` (ledger concept), `highlight` (not used).

### Page-Specific Colour Notes

**Overview:** Each tier uses its own semantic colour for headings, accent bars, and value text. The left panel is a vertical cascade of four distinct colours reinforcing the waterfall mental model.

**Wealth & Planner:** These pages sit outside the tier-colour system. Section headings and breadcrumbs use `page-accent` (`#8b5cf6` soft violet). Status indicators follow standard rules: attention amber for noteworthy items, `error` red for app errors, `success` green for UI confirmations, financial values never colour-coded.

---

## 3. Typography

**Three fonts, strict roles.**

| Token          | Font               | Weights       | Used for                                                                   |
| -------------- | ------------------ | ------------- | -------------------------------------------------------------------------- |
| `font-heading` | **Outfit**         | 700, 800      | Tier names, headlines, wordmark, button labels, nav links, section headers |
| `font-body`    | **Nunito Sans**    | 400, 500, 600 | Item labels, descriptions, metadata, helper text, breadcrumbs, body copy   |
| `font-numeric` | **JetBrains Mono** | 400, 500, 600 | All monetary values, percentages, and numerical data                       |

**Inter is not used anywhere.**

**Rule: tabular numerals always.** Any context where numbers stack vertically or need to align uses `font-variant-numeric: tabular-nums`.

**Tier headings:** solid tier colour (never gradient), `font-heading` weight 800, uppercase, letter-spacing 0.09em.

**Callout words:** gradient text reserved for engagement phrases, hero headlines, standout moments. Uses callout gradient tokens. `font-heading` weight 800.

**Heading typography token:** letter spacing: −0.025em; line height: 1.15. Defined as dedicated heading tokens in `design-tokens.ts`. Do not apply to body text, labels, or numeric values.

### Waterfall Type Hierarchy

Six levels in the left panel:

| Level                | Size | Weight | Font           | Colour                     | Context                                                 |
| -------------------- | ---- | ------ | -------------- | -------------------------- | ------------------------------------------------------- |
| Right panel headline | 30px | 800    | `font-numeric` | `text-primary`             | Selected item's value in detail view                    |
| Tier total           | 15px | 600    | `font-numeric` | `text-tier-*`              | Sum next to each tier heading, in tier colour           |
| Tier heading         | 13px | 600    | `font-heading` | `text-tier-*`              | `INCOME`, `COMMITTED`, etc. (uppercase, 0.09em spacing) |
| Item name            | 13px | 400    | `font-body`    | `text-secondary` (#94a3b8) | Label for each line item — dimmed to recede             |
| Item amount          | 13px | 400    | `font-numeric` | `#cbd5e1`                  | Value for each line item — subtle but readable          |
| Metadata             | 12px | 500    | `font-body`    | varies                     | Staleness age, dates, helper text                       |

### Subheading Labels

Three standardised uppercase label styles, defined as `@layer components` utility classes in `index.css`. Always use these instead of ad-hoc class combinations.

| Class            | Size | Weight | Font           | Tracking          | Colour                     | Use for                                                          |
| ---------------- | ---- | ------ | -------------- | ----------------- | -------------------------- | ---------------------------------------------------------------- |
| `.label-section` | 11px | 600    | `font-heading` | `tracking-wider`  | `text-muted-foreground/60` | Panel group headers, sidebar nav labels, settings section titles |
| `.label-detail`  | 12px | 600    | `font-heading` | `tracking-wider`  | `text-muted-foreground/70` | Right-panel detail sections, content area headings               |
| `.label-chart`   | 10px | 600    | `font-heading` | `tracking-widest` | `text-text-tertiary`       | Chart titles, data-viz labels, stat card headers                 |

All three are uppercase by default. Override colour with a tier class (e.g. `label-detail text-tier-committed`) when the label is tier-scoped.

### Cascade Connectors Typography

Between each tier, connector text uses `font-numeric`, 10.5px, `font-medium`, `text-muted`, `tracking-wide`. Rules use `bg-border/50` at 1px height.

---

## 4. Spacing and Layout

**8px grid.** All spacing values are multiples of 4px or 8px. Generous by default.

**Two-panel shell:**

- Left panel: fixed **360px**
- Right panel: fills all remaining horizontal space
- Single `border` token separates panels — no gap, no shadow, no divider chrome
- Top nav: full width, above both panels

**Minimum viewport: 1024px.** Desktop-first; narrower viewports out of scope.

**Rules:**

- Left panel never scrolls horizontally — long labels truncate with ellipsis
- Both panels are vertically scrollable
- Within a group (items in the same tier): tight row spacing, line height 1.25
- Between groups: relaxed spacing or a structural divider

---

## 5. Interactive States

Interactive states use the contextual tier colour at varying opacities. On non-tier pages, use `page-accent`.

| State          | Treatment                                                                      |
| -------------- | ------------------------------------------------------------------------------ |
| **Hover**      | ~5% tier/accent colour opacity background                                      |
| **Selected**   | ~14% tier/accent colour opacity background + left border in tier/accent colour |
| **Active nav** | Solid tier/accent colour text + 2px bottom underline bar                       |
| **Focus**      | `action` colour focus ring (2px)                                               |
| **Disabled**   | Reduced opacity (0.4) — not colour change alone                                |

---

## 6. Scrollbars

Custom-styled to match the dark theme. Browser-default scrollbars are not acceptable.

- Track: transparent
- Thumb: `rgba(238, 242, 255, 0.10)`, border-radius `full`
- Thumb on hover: `rgba(238, 242, 255, 0.18)`
- Width: 6px

Applied globally via `::-webkit-scrollbar` with CSS fallback (`scrollbar-color`, `scrollbar-width: thin`) for Firefox.

---

## 7. Border Radius

| Token    | Value  | Used for                                                     |
| -------- | ------ | ------------------------------------------------------------ |
| `radius` | 8px    | Cards, modals, toasts, dropdown panels, form inputs, buttons |
| `full`   | 9999px | `EntityAvatar`, badges, indicator dots                       |

No other radii. Everything rectangular gets `radius`; everything circular gets `full`.

---

## 8. Z-Index Scale

Do not use arbitrary z-index values. 10-point increments leave room for future layers.

| Layer         | z-index | Elements                              |
| ------------- | ------- | ------------------------------------- |
| Base          | 0       | Page content, panels                  |
| Sticky        | 10      | Top navigation bar                    |
| Banner        | 20      | `SnapshotBanner`, `StaleDataBanner`   |
| Dropdown      | 30      | `Select` dropdown panels              |
| Modal overlay | 40      | `ConfirmationModal` backdrop          |
| Modal         | 50      | `ConfirmationModal` container         |
| Toast         | 60      | `Toast` notifications (always on top) |
| Tooltip       | 70      | Tooltips (highest — never occluded)   |

---

## Appendix: Full Token Reference

Quick-reference table of every colour token.

| Token                     | Value                       | Category |
| ------------------------- | --------------------------- | -------- |
| `background`              | `#080a14`                   | Base     |
| `surface`                 | `#0d1120`                   | Surface  |
| `surface-border`          | `#1a1f35`                   | Surface  |
| `surface-elevated`        | `#141b2e`                   | Surface  |
| `surface-elevated-border` | `#222c45`                   | Surface  |
| `surface-overlay`         | `#1c2540`                   | Surface  |
| `surface-overlay-border`  | `#2a3558`                   | Surface  |
| `text-primary`            | `rgba(238, 242, 255, 0.92)` | Text     |
| `text-secondary`          | `rgba(238, 242, 255, 0.65)` | Text     |
| `text-tertiary`           | `rgba(238, 242, 255, 0.40)` | Text     |
| `text-muted`              | `rgba(238, 242, 255, 0.25)` | Text     |
| `tier-income`             | `#0ea5e9`                   | Tier     |
| `tier-committed`          | `#6366f1`                   | Tier     |
| `tier-discretionary`      | `#a855f7`                   | Tier     |
| `tier-surplus`            | `#4adcd0`                   | Tier     |
| `action`                  | `#7c3aed`                   | Accent   |
| `page-accent`             | `#8b5cf6`                   | Accent   |
| `callout-primary`         | `#0ea5e9 → #a855f7`         | Callout  |
| `callout-secondary`       | `#a855f7 → #4adcd0`         | Callout  |
| `attention`               | `#f59e0b`                   | Status   |
| `attention-bg`            | `rgba(245, 158, 11, 0.04)`  | Status   |
| `attention-border`        | `rgba(245, 158, 11, 0.08)`  | Status   |
| `error`                   | `#ef4444`                   | Status   |
| `success`                 | `#22c55e`                   | Status   |
