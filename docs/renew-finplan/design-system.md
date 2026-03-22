# FinPlan Design System

> This document defines the concrete rules and constraints for the FinPlan UI: colour tokens, typography, layout, components, interaction patterns, and UX patterns. It is the *what* of the design — the specifications that follow from the principles in `design-philosophy.md`. Specific values (hex codes, pixel measurements) are confirmed during implementation; this document defines the rules those values must satisfy.
>
> Supersedes: `docs/2. design/technical/design_system.md` (built for the old ledger app).

---

## 1. Foundations

### 1.1 Theme

Dark theme only. The existing dark palette carries forward as the base:

| Token | Role |
|---|---|
| `background` | Main app background |
| `surface` | Cards, panels, popovers |
| `border` | Dividers, input borders |
| `text-primary` | Main content |
| `text-secondary` | Supporting information |
| `text-tertiary` | De-emphasised content, metadata |

No light mode. No theme switching. If this changes in future, the token layer (not component code) is the only thing that needs updating.

---

### 1.2 Colour Tokens

The colour system has three layers: primitives → semantic roles → component tokens.

**Tier palette** — one accent colour per waterfall tier, defined as semantic tokens:

| Token | Role | Colour family |
|---|---|---|
| `tier-income` | Income tier heading and accents | Teal |
| `tier-committed` | Committed Spend tier heading and accents | Blue-slate (neutral) |
| `tier-discretionary` | Discretionary tier heading and accents | Warm amber |
| `tier-surplus` | Surplus row heading and accents | Teal (same as `tier-income`) |

**Rule:** Income and Surplus share the same tier colour — both represent the positive side of the waterfall. Committed is neutral (not negative — it is simply obligatory). Discretionary is warm (chosen, human).

**Status palette** — used for states, not tiers:

| Token | Signal | When used |
|---|---|---|
| `staleness` | Amber | Stale items (dot, age text) |
| `shortfall` | Red | Yearly bill pot genuinely insufficient |
| `surplus-positive` | Teal | Surplus meets or exceeds benchmark |
| `surplus-warning` | Amber | Surplus exists but is below benchmark |
| `income` | Teal | Positive values throughout the app |
| `destructive` | Red | Data loss, irreversible actions (rare) |

**Action palette** — carries forward unchanged:

| Token | Role |
|---|---|
| `primary` | Orange — action buttons, CTAs, focus rings |
| `secondary` | Muted — secondary actions |
| `brand` | Purple/rose — identity elements |

**Removed tokens (ledger-era, not used in the new app):**
- `expense` — ledger concept, no equivalent in the planning model
- `highlight` (magenta) — not used in the waterfall model

**Renamed tokens:**
- `success` → `income` (same teal colour, clearer semantic role)
- `warning` → `staleness` (same amber colour, clearer semantic role)

---

### 1.3 Typography

**Rule: two fonts only.**

| Token | Font | Used for |
|---|---|---|
| `font-ui` | Inter | All labels, headings, copy, navigation, button text, metadata — everything that is not a number |
| `font-numeric` | JetBrains Mono | All monetary values, percentages, and numerical data |

The visual distinction between `font-ui` and `font-numeric` is intentional and load-bearing: a user's eye learns quickly that anything in the mono font is a number worth reading.

**Rule: tabular numerals always.** Any context where numbers stack vertically or need to align uses `font-variant-numeric: tabular-nums`, regardless of whether `font-numeric` is in use.

**Waterfall type hierarchy** — six levels, each a clear visual step:

| Level | Size | Weight | Font | Context |
|---|---|---|---|---|
| Right panel headline | `3xl` 30px | Semibold | Numeric | Selected item's value in detail view |
| Surplus value | `2xl` 24px | Bold | Numeric | The answer at the bottom of the waterfall |
| Tier total value | `lg` 18px | Semibold | Numeric | Sum at the bottom of each tier |
| Tier heading | `lg` 18px | Semibold | UI | `INCOME`, `COMMITTED SPEND`, etc. |
| Row item | `base` 16px | Normal | UI + Numeric | Label and value for each line item |
| Metadata | `xs` 12px | Normal | UI | Staleness age, dates, helper text |

The surplus value at `2xl` is the most prominent number on the page. It is the answer — the number the user came to see.

**Carry forward unchanged:** size scale (`xs` → `5xl`), line heights (tight/normal/relaxed), letter spacing.

**Heading typography token:** heading elements use tighter treatment than body text — letter spacing: −0.025em; line height: 1.15. These are defined as dedicated heading tokens in `design-tokens.ts`. They do not apply to body text, labels, or numerical values.

---

### 1.4 Spacing and Layout

**8px grid.** All spacing values are multiples of 4px (half-grid) or 8px (full grid). Generous by default — the "calm by default" principle applies to space as much as colour.

**Two-panel shell:**
- Left panel: fixed width **360px**
- Right panel: fills all remaining horizontal space
- Single `border` token separates the panels — no gap, no shadow, no divider chrome
- Top navigation bar: full width, above both panels

**Rule: left panel never scrolls horizontally.** Long labels truncate with an ellipsis.

**Rule: both panels are vertically scrollable.** The left panel is *designed* to never require scrolling — its content is intentionally minimal. The right panel routinely scrolls for long detail views.

**Spacing — grouping rule:** proximity signals relatedness; distance signals separation.
- Within a group (e.g. items inside the same waterfall tier): tight row spacing, line height 1.25
- Between groups (e.g. between the Committed Spend section and the Discretionary section): relaxed spacing or a structural divider

Apply consistently to all list and panel layouts throughout the app.

**Information hierarchy:** size, colour, and position communicate importance.
- Most important information appears at the top of each discrete section
- Income (teal) and primary actions (orange) are the most visually prominent
- The waterfall cascade is the primary expression: Income row is most prominent; Surplus is quieter at the bottom
- Headline figures in the left panel summary are always the dominant visual element per page

---

## 2. Component Catalogue

### `WaterfallTierRow`

Used in the left panel of the Overview page. Represents one tier of the waterfall (Income, Committed Spend, Discretionary, or Surplus).

**Anatomy:**
```
[ TIER NAME ········· (badge) · £ Total ]
```
- Tier name: uppercase, `font-ui`, `semibold`, tier accent colour
- Total: right-aligned, `font-numeric`, `semibold`
- Staleness count badge: amber, only rendered when ≥1 item in the tier is stale (e.g. `3 stale`). Absent when everything is current — silence = approval.
- Shortfall indicator: only on the Committed Spend tier, only when the yearly bills cashflow projects a shortfall

**Behaviour:**
- Clickable — selecting a tier loads its item list in the right panel
- Selected state: left border in tier accent colour + subtle background highlight (`surface` +1 level)
- Hover state: subtle background, no colour change on the tier name

**Rule:** the Surplus row shows both absolute amount and percentage of income (e.g. `£270 · 7.4%`).

---

### `WaterfallConnector`

The cascade element between tier rows. Reinforces the waterfall mental model.

**Anatomy:**
```
  │
  → minus committed spend
  │
```

- Subtle vertical line in `border` colour
- Annotation text in `text-tertiary` at `xs` size: "minus committed spend", "minus discretionary", "equals"
- **Rule:** connectors are structural — they must not draw the eye. Muted colour, small text, no animation.

---

### `StalenessIndicator`

Inline on any item row in the right panel. Communicates that a value has not been reviewed within its staleness threshold.

**At row level:**
- A small amber dot (●), no text
- Position: immediately after the item label, before the value

**On hover:**
- Tooltip: "Last reviewed: N months ago"

**In right panel detail view:**
- Expanded as text: "Last reviewed: 14 months ago" at `xs`, `text-tertiary`

**Rules:**
- Informational only — never blocking
- Never red, never destructive palette — staleness is not an error
- Absent when the item is current — silence = approval

---

### `ButtonPair`

The standard confirm/edit pattern used throughout the app.

**Anatomy:**
```
[ Edit ]   [ Still correct ✓ ]
```

**Rule: the rightmost button is always the affirmative action. No exceptions.**

This applies to all variants:
- `[ Edit ]   [ Still correct ✓ ]`
- `[ Update ]   [ Still correct ✓ ]`
- `[ Cancel ]   [ Save ]`
- `[ Back ]   [ Confirm ]`

**Behaviour of "Still correct ✓":**
- Resets the item's `lastReviewedAt` timestamp to now
- Does not open a form or modal
- Provides immediate visual confirmation (brief state change on the button)
- Removes the staleness indicator from the item

**Button sizing:**

| Size | Height | Vertical padding | Horizontal padding |
|---|---|---|---|
| sm | 32px | 8px | 16px |
| md | 40px | 10px | 20px |
| lg | 48px | 12px | 24px |

Horizontal padding is always 2× vertical padding.

**Button states** (all interactive buttons must implement all five):

| State | Trigger |
|---|---|
| Default | Resting |
| Hovered | Cursor over button |
| Pressed | Mousedown / active |
| Disabled | Action unavailable |
| Loading | Async operation in progress |

The loading state replaces the button label with a spinner. The disabled state uses reduced opacity — not colour alone.

---

### `FormInput`

All form inputs provide six states:

| State | Trigger |
|---|---|
| Unselected | Default resting |
| Focused | Keyboard focus or click |
| Error | Failed validation |
| Warning | Value is valid but noteworthy (e.g. outside expected range) |
| Disabled | Field is read-only or locked |
| Success / Valid | Inline validation passed |

- Error: red token (`destructive`) — sparingly, genuine problems only
- Warning: amber token (`staleness`) — valid but noteworthy
- Success: teal token (`income`) — validation passed

---

### `NudgeCard`

A contextual prompt in the right panel. Surfaces a mechanical action or observation when one is available.

**Anatomy:**
- Single sentence: information + arithmetic
- Optional action link (e.g. "See ISA accounts")
- Background: subtle surface variant — not a coloured alert box, not a warning banner

**Rules:**
- Right panel only — never in the left panel, never inline in a list
- One at a time — nudges are never stacked
- Absent when no opportunity exists — silence = approval
- Language: arithmetic and options only, never recommendations
  - ✓ "Redirecting £50/mo to this account could earn ~£180 more per year"
  - ✗ "You should move your savings to this account"

---

### `TimelineNavigator`

A row of snapshot dots displayed above the two-panel area on the Overview page.

**Anatomy:**
- Horizontal row of dots, one per snapshot
- Current live plan: no dot (it is the default state, not a snapshot)
- Historical snapshots: outline dots
- Currently viewed snapshot: filled dot

**Behaviour:**
- Hover: tooltip with snapshot name and date
- Click: loads that snapshot in read-only mode
- Read-only mode: "Viewing: [snapshot name]" banner replaces the timeline navigator for the duration of the session
- Returning to live plan: banner dismissed, timeline navigator restored

---

### `ItemRow`

Used in the right panel item list (State 2 — tier selected). Each row represents one waterfall item within the selected tier.

**Anatomy:**
```
[ Label ●················ £ Value ]
```
- Label: `font-ui`, `base` size, left-aligned, truncates with ellipsis if too long
- Value: `font-numeric`, `base` size, right-aligned, tabular numerals
- Staleness dot (●): amber, appears between label and value when the item is stale; absent when current — silence = approval
- No avatar — the left panel and item list are text-only

**Behaviour:**
- Clickable — clicking transitions the right panel to State 3 (item detail)
- Hover state: subtle background tint
- Selected state: same as hover but persists (for when item is loaded in State 3)

---

### `EntityAvatar`

Displays an identity image for a named entity. Used in right panel detail views only — not in the left panel or item list rows.

**Sources (in priority order):**
1. Logo selected from the curated library (common UK banks, pension providers, utilities, streaming services)
2. User-uploaded image
3. Initials fallback — when no image is assigned

**Initials fallback:**
- Background: a deterministic colour derived from the entity name (consistent across sessions and users)
- Content: 1–2 initials, `font-ui`, white

**Sizes:**
| Name | Size | Context |
|---|---|---|
| `sm` | 24px | Compact list rows |
| `md` | 32px | Standard detail contexts |
| `lg` | 48px | Right panel detail headline |

**Display rules:**
- Always circular (`border-radius: full`) at all sizes
- The fallback is the default expected state for new entries — it must not feel like an error

---

### `SnapshotBanner`

Replaces the `TimelineNavigator` when a historical snapshot is being viewed. Communicates clearly that the user is not viewing live data.

**Anatomy:**
```
  Viewing: March 2026 Review  ·  [ Return to current ▸ ]
```
- Full-width bar anchored directly below the top navigation bar, above both panels
- Background: `surface` token with a subtle `border-bottom`
- Text: `font-ui`, `sm` size, `text-secondary`
- "Return to current ▸" is a link/button — clicking it dismisses the banner and restores the live plan and `TimelineNavigator`

**Behaviour:**
- All edit controls (edit buttons, `ButtonPair`, add actions) are hidden while the banner is visible
- The waterfall left panel and right panel values all reflect the snapshot date
- The history graph shows a vertical marker at the snapshot date

---

### `SkeletonLoader`

Displayed during initial data loading to preserve layout and reduce perceived wait time.

**Left panel variant:**
- Four tier-row shaped blocks (matching the height of a `WaterfallTierRow`)
- Three connector-shaped thin lines between them
- Shimmer animation (left-to-right gradient sweep)

**Right panel variant:**
- One large block (matching the headline value area)
- One medium block (matching a sparkline chart height)
- Two small inline blocks side by side (matching a `ButtonPair`)
- Same shimmer animation

**Rules:**
- Background: slightly lighter than `background`, consistent with `surface` tone
- Duration of shimmer cycle: 1.5s, looped
- Must be trivially disableable via `prefers-reduced-motion` (no shimmer; static blocks instead)

---

### `StaleDataBanner`

Displayed when the app has failed to sync with the backend but is showing cached data.

**Anatomy:**
```
  Data may be outdated — last synced [N minutes ago]  ·  [ Retry ]
```
- Full-width bar anchored below the top navigation bar (same position as `SnapshotBanner`, but the two never appear simultaneously)
- Background: `staleness` amber tint, muted (not full saturation)
- Text: `font-ui`, `sm` size
- "Retry" triggers an immediate resync attempt

**Behaviour:**
- Auto-dismisses when a successful sync completes
- Does not block or replace any UI — the user can still navigate, view, and interact with the cached data
- Never uses the `destructive` (red) palette — this is informational, not an error state

---

## 3. Page Patterns

### 3.1 Two-Panel Shell

Applies to: Overview, Wealth, Planner. Exempt: Review Wizard, Waterfall Creation Wizard (full-screen modes).

```
┌─────────────────────────────────────────────────────────────────┐
│  TOP NAV                                                        │
├──────────────────┬──────────────────────────────────────────────┤
│                  │                                              │
│  LEFT PANEL      │  RIGHT PANEL                                 │
│  Fixed width     │  Fills remaining space                       │
│  Tier headings   │  Empty / Item list / Item detail             │
│  + totals        │                                              │
│                  │                                              │
└──────────────────┴──────────────────────────────────────────────┘
```

**Left panel rules:**
- Always visible; never replaced or navigated away from
- Contains only tier headings and summary totals — no individual items
- Clicking a tier selects it (selected state: left border accent + background highlight)
- Designed to never require vertical scrolling — content is intentionally minimal

**Right panel rules:**
- Default state: empty (muted placeholder prompt)
- Updates based on left panel selection
- Supports one level of internal depth (tier list → item detail), navigated via breadcrumb
- Never triggers a full page navigation

---

### 3.2 Right Panel States

**State 1 — Empty (nothing selected)**
- Muted placeholder: "Select any item to see its detail"
- No structural chrome, no CTA
- Exception: if the page has no data at all, this state shows the relevant empty-state CTA instead

**State 2 — Tier selected (item list view)**
- Breadcrumb: tier name only (no back arrow — tier is the first level)
- List of all items in the tier, each as an `ItemRow` (label, value, staleness dot)
- "Add item" row at the bottom of the list — inline, not a modal trigger
- Clicking an item transitions to State 3

**State 3 — Item selected (detail view)**
- Breadcrumb: `← Tier name / Item name` — the `←` navigates back to State 2
- Item value at `3xl`, `font-numeric`, prominent
- "Last reviewed" text at `xs`, muted (if stale)
- 24-month history graph (sparkline)
- `ButtonPair`: `[ Edit ]  [ Still correct ✓ ]`
- `NudgeCard`: shown below the button pair when relevant; absent otherwise

**Transitions:** direction-aware slide, 150–200ms, ease-out on entrance / ease-in on exit:
- Navigating deeper (State 2 → State 3): slide-left entrance
- Navigating shallower (State 3 → State 2 via breadcrumb): slide-right entrance
- Returning to empty (State 2/3 → State 1): fade-out

All transitions must be trivially disableable via `prefers-reduced-motion` (support deferred to backlog).

---

### 3.3 Left Panel — Overview Specifics

**The left panel shows tier summaries only.** Individual waterfall items (income sources, bills, discretionary categories) are never displayed in the left panel — they appear in the right panel when a tier is selected. This is the household at a glance; depth is accessed by selecting a tier.

The Overview left panel layout from top to bottom:

```
  Timeline navigator (snapshot dots)
  ─────────────────────────────────
  ● INCOME                  £8,856
  │
  → minus committed spend
  │
  ● COMMITTED SPEND         £4,817   [3 stale]
  │
  → minus discretionary
  │
  ● DISCRETIONARY           £3,830
  │
  ─────────────────────────────────
  = SURPLUS           £209 · 2.4%
```

- Four `WaterfallTierRow` components — tier name, total, and optional badge only
- Three `WaterfallConnector` components between them
- Surplus row is visually distinct — heavier weight, `2xl` value, the visual terminus of the cascade
- The left panel content is designed to never require vertical scrolling

---

### 3.4 Empty States

Every empty state includes a clear call to action. A blank view is never acceptable.

| Context | Empty state treatment |
|---|---|
| Overview — no waterfall data | CTA to launch the Waterfall Creation Wizard (replaces the full right panel) |
| Right panel — nothing selected | Muted placeholder: "Select any item to see its detail" |
| Any tier with no items | Inline "Add first item" action in the right panel (State 2) |

**Rule:** silence = approval *only when data exists*. When data is absent, the app guides the user forward.

---

### 3.5 Full-Screen Modes (Wizards)

The Review Wizard and Waterfall Creation Wizard are exempt from the two-panel layout rule. They are focused, full-screen flows with dedicated step navigation.

**Rules that still apply inside wizards:**
- `ButtonPair` rightmost-is-affirmative rule
- Language rules (budgeted/planned, not spent/paid)
- Staleness principles (informational, not blocking)

---

### 3.6 Card Component

Used in the Review Wizard, Waterfall Creation Wizard summary step, and anywhere a discrete item needs visual separation from its surroundings.

**Anatomy:**
- Background: `surface` token (one step lighter than `background`)
- Border: 1px `border` token — all four sides
- Border-radius: `md` (8px)
- Padding: 24px (`p-6`)
- No shadow

**Variants:**
- **Default** — `surface` background + `border`
- **Stale** — same as default, but the `StalenessIndicator` is present and the staleness age is shown prominently within the card

**Rule:** cards use `surface` elevation to distinguish themselves from the page background. No shadows — the dark theme relies on border contrast, not elevation shadows.

---

### 3.7 Liquidity Classification

Assets are classified into three liquidity tiers for analytical purposes. These are **not** used as primary navigation — users navigate by asset class (Savings, Pensions, Property, etc.). Liquidity is surfaced as a secondary breakdown in the Wealth page summary.

| Tier | Description | Examples |
|---|---|---|
| Cash & Savings | Accessible immediately | Cash, savings accounts, ISAs |
| Investments & Pensions | Accessible with delay or restrictions | Pensions, stocks & shares, investment accounts |
| Property & Vehicles | Not readily convertible to cash | Property equity, vehicles, physical assets |

---

### 3.8 Trust Savings (Held on Behalf Of)

Some savings are managed by the household but legally owned by a third party (e.g. a child's Junior ISA). These accounts are:
- Tracked with the same features as household savings (history, staleness, contributions)
- Clearly labelled "Held on behalf of [Name]"
- **Excluded from household net worth calculations**
- Displayed in a ring-fenced section below the main Wealth summary

---

### 3.9 Asset Valuation

Assets are recorded at **equity value** — what the user owns outright, not the total asset value. This avoids separately tracking associated debt (e.g. a property worth £300,000 with a £200,000 mortgage = equity value £100,000).

Every valuation update requires a **valuation date**, which defaults to today but can be set to any past date. This ensures the history graph accurately reflects when a value was true, not when it was entered.

---

### 3.10 Savings ↔ Waterfall Linkage

Monthly savings allocations are defined in the waterfall (Discretionary → Savings). Each allocation can optionally be linked to a specific account on the Wealth page. When linked:
- The Wealth page uses the contribution rate for forward projections
- The system can check ISA annual allowance limits per linked account
- Rate optimisation nudges can compare contribution rates across linked accounts

Linking is optional. Both pages function independently without it.

**ISA allowance is tracked per person, not per account.** Where a person holds multiple ISA accounts, contributions are summed against a single person-level annual limit. Household members each have independent allowance tracking.

---

## 4. Interaction Rules

### 4.1 Language

**Always use:** "budgeted", "planned", "allocated", "expected", "set aside"

**Never use:** "spent", "paid", "charged"

The app tracks what users *intend*, not what they *did*. Language must consistently reflect that.

---

### 4.2 Staleness

- Every value carries a `lastReviewedAt` timestamp
- Stale threshold is configurable per category (defaults: salary 12 months, energy 6 months)
- Staleness is communicated through the `StalenessIndicator` and aggregate count badges
- **Staleness is informational only — it never blocks user action**
- A user can always proceed, edit, confirm, or navigate regardless of stale state
- Stale items surface first in the Review Wizard

---

### 4.3 Nudges

- Appear in the right panel only, contextual to the selected item
- One at a time — never stacked
- Phrased as information + arithmetic, never as recommendations
- Absent when no opportunity exists — silence = approval
- Examples:
  - ✓ "Your ISA allowance has £11,600 remaining before April"
  - ✓ "Redirecting £50/mo to this account could earn ~£180 more per year"
  - ✗ "You should top up your ISA"
  - ✗ "We recommend moving your savings"

---

### 4.4 Colour Signal Rules

- Use teal and amber signals; reserve red for genuine shortfalls and destructive actions only
- **Rule:** never use the destructive (red) palette for staleness, low surplus, or informational warnings
- **Rule:** if a value is fine, show nothing — silence = approval
- Strong visual emphasis is reserved for genuine shortfalls or over-budget states

---

### 4.5 Snapshot Read-Only Mode

When a historical snapshot is loaded:
- A "Viewing: [snapshot name]" banner replaces the timeline navigator
- All values are read-only — no edit controls, no `ButtonPair`
- The history graph shows a vertical marker at the snapshot date for orientation
- Right panel headline value reflects the snapshot date, not current value
- Returning to the live plan: banner dismissed, full edit controls restored

**Snapshot naming rules:**
- Names must be unique within a household
- If a user enters a duplicate name, highlight the save field with a validation message
- Auto-generated names (e.g. "January 2026 — Auto") are reserved and cannot be duplicated by user-created snapshots

---

### 4.6 Tooltips

- Used for three purposes: (1) staleness age on `StalenessIndicator` hover, (2) term definitions on hover for financial terminology, (3) explanations on hover for any standalone icon that carries meaning but has no visible label text
- Tooltip definitions for financial terms and functional icons are maintained in `definitions.md`
- No in-app glossary — contextual tooltips are the only explanation mechanism
- Tooltip text: `xs` size, `font-ui`, muted background surface
- **Rule:** any icon not accompanied by visible label text must have a tooltip. No icon-only UI element may be left without one.

---

### 4.7 Action Feedback

Every user action that changes state must produce visible feedback.

| Action type | Feedback mechanism |
|---|---|
| Instant (copy, toggle, confirm) | Micro-interaction on the element itself (e.g. copy icon → "Copied!" chip for 2s) |
| Async (save, sync) | Loading state on triggering button → success/error toast on completion |
| Staleness confirmation ("Still correct ✓") | Brief teal colour flash on the button, then normal |
| Wizard step completion | Brief confirmation before advancing to next step |
| Destructive confirmation (delete) | Modal confirmation before proceeding |

Toast notifications: non-blocking, anchor consistently (bottom-right), auto-dismiss after 4s, dismissable manually.

### 4.8 Micro-Animations

Meaningful motion communicates spatial relationships. All animations follow this spec:

| Transition | Direction | Duration | Easing |
|---|---|---|---|
| Right panel deeper (State 2 → State 3) | Slide-left entrance | 150–200ms | ease-out |
| Right panel shallower (breadcrumb back) | Slide-right entrance | 150–200ms | ease-out |
| Wizard step forward | Slide-left | 150–200ms | ease-out |
| Wizard step back | Slide-right | 150–200ms | ease-out |
| Toast entrance | Fade-up | 150ms | ease-out |
| Toast exit | Fade-out | 150ms | ease-in |

**Rules:**
- Duration: 150–200ms. Motion must never feel like a delay.
- Easing: ease-out for entrances, ease-in for exits
- All animations must be trivially disableable via a single toggle on `prefers-reduced-motion` (support deferred; see `backlog.md`)

---

### 4.9 Micro Charts

Prefer micro charts over tables for time-series and comparative data:
- History sparklines in the right panel detail view (24-month window)
- Comparison bars for the Wealth liquidity breakdown
- ISA allowance remaining as a progress bar

**Rule:** no more than 2–3 micro charts visible simultaneously in any single view. When a view would otherwise require more, show the most contextually relevant ones and link to a full breakdown.

Chart library: Recharts.

---

### 4.11 Progressive Disclosure

Forms capture only mandatory fields by default.

| Field condition | Visibility |
|---|---|
| Mandatory field | Always visible |
| Optional field, no existing data | Hidden behind "+ More options" reveal |
| Optional field, has existing data | Always shown — never hide a user's own data behind a toggle |

The reveal action label: "+ More options" or "+ Optional details". It is always present if optional fields exist, even if all optional fields are already shown (because data is pre-populated).

---

### 4.12 Inline Edit Form (Transform in Place)

When the user clicks `[ Edit ]` in a right panel detail view (State 3), the form opens **in place** — the existing detail view converts to an edit form. No navigation occurs. The breadcrumb does not change.

**Before click (detail view):**
```
  ← Committed / British Gas
  £122 / month
  Last reviewed: Jan 2026 ✓
  [sparkline]
  [ Edit ]   [ Still correct ✓ ]
```

**After click (edit form, same panel position):**
```
  ← Committed / British Gas
  Name   [ British Gas         ]
  Amount [ 122                 ]
  + More options
  [ Cancel ]   [ Save ]
```

**Rules:**
- The breadcrumb (`← Committed / British Gas`) remains unchanged — the user has not navigated
- The sparkline history disappears during edit; it returns when the form is saved or cancelled
- `[ Cancel ]` reverts to the detail view without saving
- `[ Save ]` saves the changes and returns to the detail view, updated
- The rightmost button is always the affirmative action — `[ Save ]` is always on the right

---

### 4.13 Loading Strategy

The app uses **skeleton screens** for all data-loading states — never a full-page spinner.

**On initial page load or household switch:**
- Left panel: render the `SkeletonLoader` left panel variant (4 tier-row blocks + connectors)
- Right panel: render the empty placeholder state (not a skeleton — the right panel has nothing to load until a tier is selected)

**On tier selection (right panel loading):**
- If data loads in under 150ms: render directly, no skeleton shown
- If data takes longer: show the `SkeletonLoader` right panel variant until the data arrives

**Rules:**
- Skeletons mirror the layout they will replace — same heights, same positions
- Never use a spinner in place of a skeleton for panel-level loading
- Async button operations (save, confirm) use the button loading state (spinner in the button), not a panel skeleton

---

### 4.14 Error Handling

When a data sync fails, the app retains the last known data and surfaces the failure non-destructively.

**On sync failure:**
1. Show a toast (bottom-right, error variant): "Couldn't connect — using last synced data"
2. Show the `StaleDataBanner` above the panels (amber, muted): "Data may be outdated — last synced [N minutes ago]"
3. Continue showing cached data; the user can still navigate and view

**Auto-retry:**
- The app retries silently in the background
- On successful resync: the `StaleDataBanner` auto-dismisses; a success toast confirms: "Data refreshed"
- Manual retry: the "Retry" link in the `StaleDataBanner` triggers an immediate attempt

**Rules:**
- Never use the `destructive` (red) palette for connectivity failures — this is `staleness` amber
- Never blank out the UI or show an error page for a connectivity failure
- If data has never loaded (fresh session, first load fails): show an inline error in the panel with a prominent retry button

---

## 5. Icons

### 5.1 Library Priority

Icons must be sourced in this order:

1. **Lucide** — primary (already a dependency via shadcn/ui)
2. **Phosphor** — secondary, Regular weight only (for stroke consistency with Lucide)
3. Any other interface library — last resort; add a comment explaining why

Do not mix icon styles within a single component. Never use emojis as icon substitutes.

### 5.2 One Icon, One Meaning

The same icon must not be reused for two different meanings anywhere in the app. If a concept needs a visual representation, it gets a dedicated icon. The canonical icon map below is the authoritative reference.

**Canonical Icon Map** (extend as icons are confirmed during implementation):

| Meaning | Icon name | Library |
|---|---|---|
| Staleness / needs review | `AlertCircle` | Lucide |
| Snapshot | `Camera` | Lucide |
| Edit / modify | `Pencil` | Lucide |
| Delete / remove | `Trash2` | Lucide |
| Link / connected | `Link2` | Lucide |
| Confirmed / reviewed | `CheckCircle2` | Lucide |
| Add / create | `Plus` | Lucide |
| Navigate back | `ChevronLeft` | Lucide |
| Navigate deeper | `ChevronRight` | Lucide |
| Settings | `Settings` | Lucide |
| Household / members | `Users` | Lucide |
| Income source | `Wallet` | Lucide |
| Copy | `Copy` | Lucide |
| Close / dismiss | `X` | Lucide |
| Information | `Info` | Lucide |
| Loading / pending | Spinner (animated) | custom |

### 5.3 Icons with Text

When an icon appears inline beside label text:

- Icon size = cap height of the adjacent text (approximately equal to `font-size` for Inter)
- Gap: 4–6px (half to one grid unit)
- Alignment: vertically centred on the text baseline
- Gap must not exceed 8px (one grid unit)

### 5.4 Icon-Only Elements

Any icon without accompanying visible label text must have a tooltip on hover (see Section 4.6).

---

## 6. Images as Identifiers

### 6.1 Scope

Any named data entry may be assigned a main image. This applies across:
- Wealth page: savings accounts, pension providers, investment platforms, property
- Overview waterfall: income sources, bill items, discretionary categories
- Planner: purchases, gift recipients

### 6.2 Sources

Images may be:
1. **Selected from the curated library** — logos for common UK institutions and providers, bundled or statically served
2. **User-uploaded** — stored per household; max file size and accepted formats confirmed at implementation

**Curated library starting set:**

| Category | Examples |
|---|---|
| Banks / current accounts | Monzo, Barclays, HSBC, Lloyds, NatWest, Starling, Santander, Halifax |
| Savings / ISA platforms | Marcus, Zopa, Chase, NS&I |
| Pension providers | Vanguard, Aviva, Legal & General, Scottish Widows, Nest, PensionBee |
| Investment platforms | Vanguard, Fidelity, Hargreaves Lansdown, Trading 212 |
| Utilities | British Gas, Octopus Energy, EDF, E.ON |
| Telecoms / broadband | Sky, Virgin Media, BT, Vodafone, EE, Three |
| Streaming | Netflix, Spotify, Apple, Disney+, Amazon |

### 6.3 Fallback

When no image is assigned, display an `EntityAvatar` placeholder:
- Background: a deterministic colour derived from the entry name (using the existing colour token palette)
- Content: 1–2 initials from the entry name, `font-ui`, white

The placeholder must not feel like an error state — it is the default, expected appearance for new entries.

### 6.4 Display Rules

- Displayed at a consistent size per context (exact dimensions confirmed at implementation)
- Images are always circular (border-radius: full) at row/list scale; may be rounded-square at larger detail scale
- No image border unless needed for contrast against background — use a subtle `border` token ring if required

---

## 7. Top Navigation Bar

The top navigation bar spans the full width above both panels, present on all pages.

**Anatomy:**
```
  finplan    Overview  Wealth  Planner  Settings    [Household ▾]  [User ▾]
```

- **Logo/wordmark**: left-aligned, links to Overview
- **Navigation links**: `Overview`, `Wealth`, `Planner`, `Settings` — spaced evenly in the centre or left-of-centre
- **Household switcher**: right-aligned, dropdown listing all households the user belongs to; active household name is always visible
- **User menu**: rightmost, user's name or avatar; contains account settings and sign out

**Active state:**
- Active nav item: orange underline (`primary` token), 2px, below the link text
- Inactive items: `text-secondary`
- Hover: `text-primary`, no underline

**Bar treatment:**
- Background: `background` token (same as page — flush, no border below, no shadow)
- Height: 48px (`h-12`)
- The bar is visually continuous with the page — only the content below it is sectioned by the panel border

**Rules:**
- The household switcher label always shows the name of the currently active household
- Switching households reloads the active page's data immediately
- The navigation links use `font-ui`, `base` size

---

## 8. Settings Page

Settings follows the same two-panel layout as Overview, Wealth, and Planner.

**Left panel:** lists the 8 settings categories. Each is a plain text row (no tier accent colour — Settings is not a waterfall page). Selected state: same left-border + subtle background highlight as waterfall tier rows.

```
  Income sources
  ▶ Staleness thresholds
  Surplus benchmark
  ISA tax year
  Household
  Snapshot management
  Trust accounts
  Waterfall
```

**Right panel:** displays the selected category's form/controls. Follows the same empty/content states as other right panels, but without item list depth — Settings categories open directly to their form/controls (no State 2 intermediate list).

**Destructive actions in Settings** (e.g. "Rebuild waterfall from scratch", "Remove member") must always be:
- Visually separated from non-destructive actions (below a divider)
- Labelled clearly with the consequence ("This will clear all waterfall data")
- Confirmed via modal before proceeding

---

## 9. Page-Specific Colour Notes

### Planner

The Planner page (Purchases, Gifts) sits outside the waterfall tier-colour system. Its section headings use the `brand` token (purple/rose):

```
  PURCHASES    £6,000     ← brand token (purple/rose)
  GIFTS        £2,400     ← brand token (purple/rose)
```

This gives the Planner its own visual identity, distinct from the waterfall tiers (teal/slate/amber/orange) and the neutral Settings page.

Status indicators within the Planner (over-budget, complete) follow the standard colour rules:
- Over budget: `destructive` (red) — genuine problem
- Complete (spent ≥ budget): `income` (teal) — positive
- In progress: neutral `text-secondary`

---

*Last updated: March 2026 — initial design system for the FinPlan rebuild.*
