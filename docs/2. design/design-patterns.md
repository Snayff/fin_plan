# finplan Design Patterns

> Page layouts, UX patterns, interaction rules, and data states. For tokens see `design-tokens.md`; for component specs see `design-components.md`.

---

## 3. Page Patterns

### 3.1 Two-Panel Shell

Applies to: Overview, Wealth, Planner, Settings. Exempt: Review Wizard, Waterfall Creation Wizard (full-screen modes).

```
┌─────────────────────────────────────────────────────────────────┐
│  TOP NAV                                                        │
├──────────────────┬──────────────────────────────────────────────┤
│                  │                                              │
│  LEFT PANEL      │  RIGHT PANEL                                 │
│  Fixed 360px     │  Fills remaining space                       │
│                  │                                              │
└──────────────────┴──────────────────────────────────────────────┘
```

**Left panel rules:**

- Always visible; never replaced or navigated away from
- Contains only tier headings and summary totals — no individual items
- Clicking a tier selects it (selected state: left border accent + ~14% tier colour background)
- Designed to never require vertical scrolling

**Right panel rules:**

- Default state: empty placeholder
- Updates based on left panel selection
- Supports one level of internal depth (tier list → item detail), navigated via breadcrumb
- Never triggers a full page navigation

---

### 3.2 Right Panel States

**State 1 — Empty (nothing selected)**

- Muted placeholder: "Select any item to see its detail"
- No structural chrome, no CTA
- Exception: if the page has no data at all, show the relevant empty-state CTA instead

**State 2 — Tier selected (item list view)**

- Breadcrumb: tier name only, in tier colour
- List of all items in the tier, each as an `ItemRow`
- "Add item" row at the bottom — inline, not a modal trigger
- Clicking an item transitions to State 3

**State 3 — Item selected (detail view)**

- Breadcrumb: `← Tier name / Item name`
- Item value at 30px, `font-numeric`, weight 800, `text-primary`
- "Last reviewed" text at 12px, `text-tertiary` (amber if stale)
- 24-month history sparkline
- `ButtonPair`: `[ Edit ] [ Still correct ✓ ]`
- `NudgeCard`: shown below button pair when relevant; absent otherwise

**Transitions:** direction-aware slide, 150–200ms, ease-out on entrance / ease-in on exit:

- Deeper (State 2 → State 3): slide-left entrance
- Shallower (breadcrumb back): slide-right entrance
- Back to empty: fade-out

All transitions must be trivially disableable via `prefers-reduced-motion`.

---

### 3.3 Left Panel — Overview Specifics

The left panel shows tier summaries only. Individual items appear in the right panel.

From top to bottom:

1. `TimelineNavigator` (snapshot dots)
2. Horizontal rule
3. Four `WaterfallTierRow` components — tier name in solid tier colour, total, optional attention badge
4. Three `WaterfallConnector` components between tiers
5. Surplus row is visually distinct — heavier weight, 24px value, the visual terminus of the cascade

---

### 3.4 Wealth & Planner — Page Layout Notes

Wealth and Planner follow the same two-panel shell and right panel state machine as Overview. The differences:

- **No waterfall tiers.** Left panel lists asset classes (Wealth) or planning categories (Planner). Selected state uses `page-accent`, not a tier colour.
- **No connectors.** Left panel is a plain list.
- **Headline figure.** Each page has one dominant summary value at the top of the left panel (e.g. net worth). `font-numeric`, weight 800, `text-primary`.

Page-specific content is defined in individual feature specs — this doc covers shared patterns only.

---

### 3.5 Empty States

Every empty state teaches the interface structure and guides the user forward.

#### Ghosted Cascade (No Waterfall)

When the overview has no waterfall data:

- Four tier headers at ~25% opacity with tier colours and "£—" placeholder amounts
- Cascade connectors at ~20% opacity
- Callout gradient CTA card below: "Build your waterfall" + "Get started" button

#### Contextual Hint (Right Panel — Nothing Selected)

- Small SVG icon (20×20, `#475569` stroke, two-panel layout representation)
- Page-aware guidance text

#### Fading Skeleton + CTA Card (Empty List)

When a list has no items:

- 2–4 ghosted skeleton rows with progressively fading opacity: 100% → 80% → 50% → 25%
- Callout gradient CTA card with contextual text and "+ Add" button

**CTA card spec:**

```
background: linear-gradient(135deg, rgba(99, 102, 241, 0.07) 0%, rgba(168, 85, 247, 0.05) 100%)
border: 1px solid rgba(99, 102, 241, 0.1)
border-radius: 8px
padding: 14px 16px
```

**Rule:** silence = approval _only when data exists_. When data is absent, the app guides the user forward.

---

### 3.6 Full-Screen Modes (Wizards)

The Review Wizard and Waterfall Creation Wizard are exempt from the two-panel layout. They are focused, full-screen flows with dedicated step navigation.

**Rules that still apply inside wizards:**

- `ButtonPair` rightmost-is-affirmative rule
- Language rules (budgeted/planned, not spent/paid)
- Staleness principles (informational, not blocking)

---

### 3.7 Card Component

Used in wizards and anywhere a discrete item needs visual separation.

- Background: `surface` token
- Border: 1px `surface` border token (`#1a1f35`)
- Border-radius: 8px
- Padding: 24px (`p-6`)
- No shadow

**Variants:** Default — standard surface; Stale — same but `StalenessIndicator` present with attention amber detail text.

---

### 3.8 Liquidity Classification

Assets are classified into three liquidity tiers for analytical purposes — surfaced as a secondary breakdown in Wealth, not primary navigation.

| Tier                   | Description                           | Examples                                       |
| ---------------------- | ------------------------------------- | ---------------------------------------------- |
| Cash & Savings         | Accessible immediately                | Cash, savings accounts, ISAs                   |
| Investments & Pensions | Accessible with delay or restrictions | Pensions, stocks & shares, investment accounts |
| Property & Vehicles    | Not readily convertible to cash       | Property equity, vehicles, physical assets     |

---

### 3.9 Trust Savings (Held on Behalf Of)

Savings managed by the household but legally owned by a third party (e.g. a child's Junior ISA):

- Tracked with the same features as household savings
- Clearly labelled "Held on behalf of [Name]"
- **Excluded from household net worth calculations**
- Displayed in a ring-fenced section below the main Wealth summary

---

### 3.10 Asset Valuation

Assets are recorded at **equity value** — what the user owns outright, not total asset value. Every valuation update requires a **valuation date** (defaults to today; may be set to any past date) to ensure the history graph reflects when a value was true, not when it was entered.

---

### 3.11 Savings ↔ Waterfall Linkage

Monthly savings allocations are defined in the waterfall (Discretionary → Savings). Each can optionally be linked to a specific Wealth account. When linked:

- Wealth page uses the contribution rate for forward projections
- System can check ISA annual allowance limits per linked account
- Rate optimisation nudges can compare contribution rates across linked accounts

Linking is optional. Both pages function independently without it.

**ISA allowance is tracked per person, not per account.** Where a person holds multiple ISAs, contributions are summed against a single person-level annual limit. Household members each have independent allowance tracking.

---

## 4. Interaction Rules

### 4.1 Language

**Product name:** always **finplan** — lowercase, one word. Never "FinPlan", "Fin Plan", "FINPLAN".

**Always use:** "budgeted", "planned", "allocated", "expected", "set aside"

**Never use:** "spent", "paid", "charged"

The app tracks what users _intend_, not what they _did_.

---

### 4.2 Staleness

- Every value carries a `lastReviewedAt` timestamp
- Stale threshold is configurable per category (defaults: salary 12 months, energy 6 months)
- Communicated through the attention system: amber dot + amber detail text
- **Staleness is informational only — it never blocks user action**
- A user can always proceed, edit, confirm, or navigate regardless of stale state
- Stale items surface first in the Review Wizard

---

### 4.3 Nudges

- Appear in the right panel only, contextual to the selected item
- One at a time — never stacked
- Phrased as information + arithmetic, never as recommendations
- Use the attention system visual treatment
- Absent when no opportunity exists — silence = approval
- Examples:
  - ✓ "Your ISA allowance has £11,600 remaining before April"
  - ✓ "Redirecting £50/mo to this account could earn ~£180 more per year"
  - ✗ "You should top up your ISA"
  - ✗ "We recommend moving your savings"

---

### 4.4 Colour Signal Rules

> Quick-reference summary of the rules defined per token in `design-tokens.md`. When in doubt, `design-tokens.md` is authoritative.

1. **Tier colours are semantically protected** — Income blue, Committed indigo, Discretionary purple, Surplus teal are exclusively reserved for their waterfall tier. Never repurpose for status, attention, or other UI signals.
2. **Callout gradients are for engagement only** — never for warnings, attention items, or informational alerts.
3. **Red is only for app errors** — never for financial shortfalls, negative balances, or over-budget states.
4. **Green is only for UI confirmations** — never for positive balances, surplus amounts, or any financial value.
5. **Amber is the attention colour** — one colour (`#f59e0b`), one pattern (dot + text). No variations in hue or saturation.
6. **Tier headings are solid colours** — never gradient. Gradient text is reserved for callout words.
7. **If a value is fine, show nothing** — silence = approval. No green ticks, no "all good" badges.

---

### 4.5 Snapshot Read-Only Mode

When a historical snapshot is loaded:

- A "Viewing: [snapshot name]" banner replaces the timeline navigator
- All values are read-only — no edit controls, no `ButtonPair`
- History graph shows a vertical marker at the snapshot date
- Right panel headline value reflects the snapshot date
- Returning to live plan: banner dismissed, full edit controls restored

**Snapshot naming rules:**

- Names must be unique within a household
- Duplicate name triggers a validation message on the save field
- Auto-generated names (e.g. "January 2026 — Auto") cannot be duplicated by user-created snapshots

---

### 4.6 Tooltips

- Three purposes: (1) staleness age on `StalenessIndicator` hover, (2) term definitions for financial terminology, (3) explanations for any standalone icon without visible label text
- Tooltip definitions are maintained in `definitions.md`
- No in-app glossary — contextual tooltips only
- Style: 12px, `font-body`, `surface-overlay` background
- **Rule:** any icon without visible label text must have a tooltip. No exceptions.

---

### 4.7 Action Feedback

Every user action that changes state must produce visible feedback.

| Action type                                | Feedback mechanism                                                               |
| ------------------------------------------ | -------------------------------------------------------------------------------- |
| Instant (copy, toggle, confirm)            | Micro-interaction on the element itself (e.g. copy icon → "Copied!" chip for 2s) |
| Async (save, sync)                         | Loading state on triggering button → success/error toast on completion           |
| Staleness confirmation ("Still correct ✓") | Brief `success` colour flash on the button, then normal                          |
| Wizard step completion                     | Brief confirmation before advancing to next step                                 |
| Destructive confirmation (delete)          | Modal confirmation before proceeding                                             |

---

### 4.8 Micro-Animations

| Transition                              | Direction            | Duration  | Easing   |
| --------------------------------------- | -------------------- | --------- | -------- |
| Right panel deeper (State 2 → State 3)  | Slide-left entrance  | 150–200ms | ease-out |
| Right panel shallower (breadcrumb back) | Slide-right entrance | 150–200ms | ease-out |
| Wizard step forward                     | Slide-left           | 150–200ms | ease-out |
| Wizard step back                        | Slide-right          | 150–200ms | ease-out |
| Toast entrance                          | Fade-up              | 150ms     | ease-out |
| Toast exit                              | Fade-out             | 150ms     | ease-in  |

**Rules:**

- Duration: 150–200ms. Motion must never feel like a delay.
- Easing: ease-out for entrances, ease-in for exits
- All animations must be trivially disableable via a single toggle on `prefers-reduced-motion`

---

### 4.9 Micro Charts

Prefer micro charts over tables for time-series and comparative data:

- History sparklines in right panel detail view (24-month window)
- Comparison bars for Wealth liquidity breakdown
- ISA allowance remaining as a progress bar

**Rule:** no more than 2–3 micro charts visible simultaneously in any single view.

Chart library: Recharts.

---

### 4.10 Progressive Disclosure

Forms capture only mandatory fields by default.

| Field condition                   | Visibility                                                  |
| --------------------------------- | ----------------------------------------------------------- |
| Mandatory field                   | Always visible                                              |
| Optional field, no existing data  | Hidden behind "+ More options" reveal                       |
| Optional field, has existing data | Always shown — never hide a user's own data behind a toggle |

The reveal action label: "+ More options" or "+ Optional details". Always present if optional fields exist, even when all are already shown due to pre-populated data.

---

### 4.11 Inline Edit Form (Transform in Place)

When the user clicks `[ Edit ]` in a right panel detail view (State 3), the form opens **in place** — the existing detail view converts to an edit form. No navigation occurs. The breadcrumb does not change.

**Rules:**

- The breadcrumb remains unchanged — the user has not navigated
- The sparkline history disappears during edit; it returns when saved or cancelled
- `[ Cancel ]` reverts to the detail view without saving
- `[ Save ]` saves and returns to the detail view
- The rightmost button is always the affirmative action — `[ Save ]` is always on the right

---

### 4.12 Loading Strategy

The app uses **skeleton screens** for all data-loading states — never a full-page spinner.

**On initial page load or household switch:**

- Left panel: render `SkeletonLoader` left panel variant
- Right panel: render empty placeholder (no skeleton — nothing to load until a tier is selected)

**On tier selection (right panel loading):**

- Under 150ms: render directly, no skeleton
- Over 150ms: show `SkeletonLoader` right panel variant until data arrives

**Rules:**

- Skeletons mirror the layout they will replace — same heights, same positions
- Never use a spinner in place of a skeleton for panel-level loading
- Async button operations use button loading state (spinner in the button), not a panel skeleton

---

### 4.13 Error Handling

When a data sync fails, the app retains the last known data and surfaces the failure non-destructively.

**On sync failure:**

1. Show a toast (error variant): "Couldn't connect — using last synced data"
2. Show `StaleDataBanner` above the panels (attention amber): "Data may be outdated — last synced [N minutes ago]"
3. Continue showing cached data; the user can still navigate and view

**Auto-retry:**

- The app retries silently in the background
- On successful resync: `StaleDataBanner` auto-dismisses; a success toast confirms: "Data refreshed"
- Manual retry: "Retry" link in the banner triggers an immediate attempt

**Rules:**

- Never use `error` red for connectivity failures — this is `attention` amber
- Never blank out the UI or show an error page for a connectivity failure
- If data has never loaded (fresh session, first load fails): show an inline error in the panel with a prominent retry button

---

## 4a. Data States

Every query-driven panel must handle all four data states. No panel should ever render blank space.

### Decision Table

| Condition                         | What to render                          | Component          |
| --------------------------------- | --------------------------------------- | ------------------ |
| `isLoading && !data`              | Ghost skeleton (no shimmer, no content) | `SkeletonLoader`   |
| `isError && !data`                | Ghost skeleton + blur overlay + retry   | `PanelError`       |
| `isError && data`                 | Stale data (visible) + amber banner     | `StaleDataBanner`  |
| `!isLoading && !isError && empty` | Ghosted placeholder + guidance text     | `GhostedListEmpty` |
| Success                           | Content                                 | —                  |

### Components

**`SkeletonLoader`** (`variant: "left-panel" | "right-panel"`)

- Static ghost skeleton — no shimmer, no animation
- Used for initial load only (`isLoading && !data`)

**`PanelError`** (`variant: "left" | "right" | "detail"`, `onRetry`, `message?`)

- Static ghost skeleton at opacity 0.30, colour `#2a3f60`
- Overlay: `rgba(8,10,20,0.70)` + `backdrop-filter: blur(2px)`
- "Failed to load" in `--destructive` red
- Optional contextual message in `--muted-foreground`
- Retry button in destructive-subtle style
- Red is for app errors only — never financial values

**`StaleDataBanner`**

- Amber — the only attention signal in the app
- Shown globally in `Layout.tsx` via `useStaleDataBanner` hook
- Appears only when `isError && data` (background refetch failure)
- Retry refetches all errored queries

**`GhostedListEmpty`** (`ctaText`, `ctaButtonLabel?`, `showCta?`)

- Used when a query succeeds but returns an empty array
- Provides contextual guidance and optional CTA

### Rules

1. Never render blank space — one of the four states must always render
2. Retry is always explicit user action — no auto-retry polling
3. Stale data stays visible on background failure — no jarring replacement
4. `PanelError` red is scoped to app errors only — never on financial values
5. `StaleDataBanner` amber is the only attention signal — informational, never blocking
