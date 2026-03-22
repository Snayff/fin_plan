# FinPlan Design System

> This document defines the rules and constraints for the FinPlan UI. It covers colour tokens, typography, layout, components, and interaction patterns. Specific values (hex codes, pixel measurements) are confirmed during implementation — this document defines the *rules* those values must satisfy.
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

---

### 1.4 Spacing and Layout

**8px grid.** All spacing values are multiples of 4px (half-grid) or 8px (full grid). Generous by default — the "calm by default" principle applies to space as much as colour.

**Two-panel shell:**
- Left panel: fixed width (value confirmed at implementation)
- Right panel: fills all remaining horizontal space
- Single `border` token separates the panels — no gap, no shadow, no divider chrome
- Top navigation bar: full width, above both panels

**Rule: left panel never scrolls horizontally.** Long labels truncate with an ellipsis.

**Rule: both panels are vertically scrollable.** The left panel is *designed* to never require scrolling — its content is intentionally minimal. The right panel routinely scrolls for long detail views.

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

The Overview left panel shows the waterfall summary. From top to bottom:

```
  Timeline navigator (snapshot dots)
  ─────────────────────────────────
  ● INCOME                  £3,650
  │
  → minus committed spend
  │
  ● COMMITTED SPEND         £1,580   [3 stale]
  │
  → minus discretionary
  │
  ● DISCRETIONARY             £800
  │
  ─────────────────────────────────
  = SURPLUS            £270 · 7.4%
```

- Four `WaterfallTierRow` components
- Three `WaterfallConnector` components between them
- Surplus row is visually distinct — heavier weight, `2xl` value, the visual terminus of the cascade

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

## 4. Interaction Rules

### 4.1 Language

**Always use:** "budgeted", "planned", "allocated", "expected", "set aside"

**Never use:** "spent", "paid", "charged" — unless recording actual figures in the Planner

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

### 4.8 Progressive Disclosure

Forms capture only mandatory fields by default.

| Field condition | Visibility |
|---|---|
| Mandatory field | Always visible |
| Optional field, no existing data | Hidden behind "+ More options" reveal |
| Optional field, has existing data | Always shown — never hide a user's own data behind a toggle |

The reveal action label: "+ More options" or "+ Optional details". It is always present if optional fields exist, even if all optional fields are already shown (because data is pre-populated).

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

*Last updated: March 2026 — initial design system for the FinPlan rebuild.*
