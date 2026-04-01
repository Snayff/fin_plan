# finplan Design Components

> Component rules, token assignments, and forbidden usage. For design tokens see `design-tokens.md`; for page layouts and interaction rules see `design-patterns.md`. For visual reference, open `/design-renew` in a running dev environment.

---

## Component Catalogue

### `WaterfallTierRow`

Left panel, Overview only. One per waterfall tier.

**Tokens:** tier colour for name and total value; `attention` amber dot + count only when ≥1 item needs attention; `text-secondary` for total when nothing is stale.

**Behaviour:** clicking selects the tier (right panel loads item list). Selected: left border in tier colour + ~14% tier colour background. Hover: ~5% tier colour background.

**Rule:** the Surplus row shows absolute amount **and** percentage of income (e.g. `£270 · 7.4%`).

---

### `WaterfallConnector`

Between tier rows in the Overview left panel. Three instances: "minus committed spend", "minus discretionary", "equals".

**Tokens:** `text-muted`, `font-body` 12px for annotation text; `border` colour for vertical rule.

**Rule:** connectors must not draw the eye — muted colour, small text, no animation.

---

### `StalenessIndicator`

Inline on item rows and in detail views. Uses the attention system only — never red.

**Tokens:** `attention` amber for dot and detail text.

**States:**

- Row level: amber dot before label + amber detail text (e.g. "14mo ago")
- Hover: tooltip "Last reviewed: N months ago"
- Detail view: text "Last reviewed: 14 months ago", 12px, `text-tertiary`

**Rules:**

- Informational only — never blocks user action
- Absent when item is current — silence = approval

---

### `ButtonPair`

The standard confirm/edit pattern. Used throughout the app.

**Rule: the rightmost button is always the affirmative action. No exceptions.** Applies to all variants: `[ Edit ] [ Still correct ✓ ]`, `[ Cancel ] [ Save ]`, `[ Back ] [ Confirm ]`.

**"Still correct ✓" behaviour:** resets `lastReviewedAt` to now; no form/modal; instant visual confirmation; removes staleness indicator.

**Button sizes:**

| Size | Height | Vertical padding | Horizontal padding |
| ---- | ------ | ---------------- | ------------------ |
| sm   | 32px   | 8px              | 16px               |
| md   | 40px   | 10px             | 20px               |
| lg   | 48px   | 12px             | 24px               |

**All interactive buttons must implement all five states:** Default, Hovered, Pressed, Disabled (reduced opacity — not colour alone), Loading (spinner replaces label).

**Button colours:**

- Primary/CTA: `action` token (`#7c3aed`) background
- Secondary: `surface-elevated` background, `text-secondary` text
- Destructive: `error` token — only for irreversible actions, always behind a `ConfirmationModal`

---

### `FormInput`

All form inputs provide six states:

| State           | Trigger                       | Visual                                   |
| --------------- | ----------------------------- | ---------------------------------------- |
| Unselected      | Default resting               | `surface` background, `border`           |
| Focused         | Keyboard focus or click       | `action` focus ring (2px)                |
| Error           | Failed validation             | `error` token border and helper text     |
| Warning         | Value is valid but noteworthy | `attention` token border and helper text |
| Disabled        | Field is read-only or locked  | Reduced opacity                          |
| Success / Valid | Inline validation passed      | `success` token border                   |

---

### `Select`

Dropdown selector. Trigger has the same visual treatment as `FormInput`. Inherits all six FormInput states.

**Tokens:** dropdown panel uses `surface-overlay` background and border; hover option uses ~12% `action` colour opacity background; selected option has checkmark right-aligned.

**Behaviour:** Enter/Space opens; Enter selects and closes; Escape closes without change; arrow keys navigate; opens below trigger (above if insufficient space).

**Rules:**

- Never use for fewer than 3 options — use radio group or toggle instead
- Trigger always shows current selection — never a placeholder like "Select..."

---

### `ConfirmationModal`

For destructive actions requiring explicit confirmation (delete item, remove member, rebuild waterfall).

**Tokens:** `surface-elevated` background and border; overlay `rgba(0,0,0,0.35)`; affirmative button uses `error` token for destructive modals.

**Dimensions:** max width 480px, centred. Padding 24px (`p-6`). Border-radius 8px.

**Behaviour:**

- Fade-in 150ms ease-out; fade-out 150ms ease-in
- Focus trapped inside while open — Tab cycles within modal only
- Escape key and overlay click both dismiss (equivalent to Cancel)
- Underlying page is inert while open

**Rules:**

- Only for irreversible/high-consequence actions — never routine confirmations
- Body text must state the consequence plainly: "This will permanently delete [item name]" — not "Are you sure?"
- Animations trivially disableable via `prefers-reduced-motion`

---

### `NudgeCard`

Contextual prompt in the right panel. Uses attention system.

**Tokens:** `attention-bg` background, `attention-border` border, `attention` amber dot in header.

**Rules:**

- Right panel only — never left panel, never inline in a list
- One at a time — never stacked
- Absent when no opportunity exists — silence = approval
- Language: arithmetic and options only, never recommendations
  - ✓ "Committed bills total **£2,140** in March, **£120 more than your income**"
  - ✓ "Redirecting £50/mo to this account could earn ~£180 more per year"
  - ✗ "You should move your savings to this account"

---

### `TimelineNavigator`

Row of snapshot dots above the two-panel area on Overview. One dot per historical snapshot; no dot for the current live plan.

**Behaviour:**

- Hover: tooltip with snapshot name and date
- Click: loads snapshot in read-only mode; banner replaces navigator for the session
- "Return to current" link restores live plan and navigator

---

### `ItemRow`

Right panel item list (tier selected). One row per waterfall item.

**Tokens:** `attention` amber dot and text for stale items; `font-body` weight 500 `text-secondary` for label; `font-numeric` weight 500 `text-secondary` for value.

**Behaviour:** clickable — transitions right panel to item detail. Hover: ~5% tier colour background. Selected: ~14% tier colour background (persists when item detail is open).

**Rule:** no avatar in item rows — the item list is text-only.

---

### `Breadcrumb`

Top of right panel. Max two segments: `Tier / Item`. Never goes deeper.

**State 2 (tier selected):** tier name only, in tier colour (or `page-accent` on non-tier pages). `font-body` weight 600, 9px, uppercase, 0.08em letter-spacing.

**State 3 (item selected):** `← Tier name / Item name`. The `←` and tier name are both clickable and navigate back to State 2. Item name is not clickable.

**Rules:**

- **Maximum two segments — this is a structural constraint, not a limitation to work around.** Features needing deeper navigation must use inline expansion, a modal, or a separate page — not a third breadcrumb segment.
- During inline edit (§ 4.11 of `design-patterns.md`), the breadcrumb remains unchanged — editing is not navigation
- Non-tier pages use `page-accent` instead of tier colour

---

### `EntityAvatar`

Identity image for a named entity. Right panel detail views only — not in the left panel or item list rows.

**Sources (priority order):**

1. Logo from curated library (common UK banks, pension providers, utilities, streaming)
2. User-uploaded image
3. Initials fallback — deterministic colour derived from entity name, 1–2 initials, `font-heading` white

**Sizes:** `sm` 24px (compact rows), `md` 32px (standard detail), `lg` 48px (right panel headline).

**Rules:**

- Always circular (`border-radius: full`) at all sizes
- The fallback is the default expected state for new entries — it must not feel like an error

---

### `SnapshotBanner`

Replaces `TimelineNavigator` when a historical snapshot is being viewed. Full-width bar below the top nav.

**Tokens:** `surface` background with `border`; text `text-secondary` 12px.

**Behaviour:**

- Hides all edit controls (edit buttons, ButtonPair, add actions) while visible
- All panel values reflect the snapshot date
- "Return to current" link dismisses the banner and restores the live plan

---

### `SkeletonLoader`

For initial data loading. Preserves layout shape; no content.

**Tokens:** `surface` token for all skeleton blocks.

**Rules:**

- Shimmer animation: 1.5s cycle, looped — **trivially disableable via `prefers-reduced-motion`** (static blocks, no shimmer)
- Left panel variant: four tier-row blocks + three connector lines
- Right panel variant: large value block + sparkline block + button-pair blocks

---

### `StaleDataBanner`

Shown when the app is displaying cached data after a sync failure. Never appears simultaneously with `SnapshotBanner`.

**Tokens:** `attention-bg` background, `attention-border` border-bottom, `attention` amber dot and text.

**Behaviour:**

- Auto-dismisses on successful resync
- Does not block navigation or interaction — cached data remains fully usable
- "Retry" triggers immediate resync

**Rule:** never uses `error` red — connectivity failure is `attention` amber, not an app error.

---

### `Toast`

Non-blocking async action confirmation. Anchored bottom-right, 24px from edge.

**Tokens:** `surface-elevated` background and border; 3px left-edge colour bar per variant; `font-body` weight 500 `text-secondary` for message.

**Variants:**

| Variant | Bar colour            | Used for                                        |
| ------- | --------------------- | ----------------------------------------------- |
| Success | `success` (`#22c55e`) | Save confirmed, sync complete, action succeeded |
| Error   | `error` (`#ef4444`)   | Save failed, sync failed, action errored        |
| Info    | `text-tertiary`       | Neutral notifications (e.g. "Data refreshed")   |

**Behaviour:** entrance fade-up 150ms ease-out; exit fade-out 150ms ease-in; auto-dismiss after 4s; manually dismissable via `✕`. Multiple toasts stack vertically (newest at bottom), 8px gap. All animations trivially disableable via `prefers-reduced-motion`.

**Rules:**

- For confirming completed actions only — never for prompting the user to act
- Never use where inline feedback is sufficient
- Prefer micro-reactions over toasts wherever an inline feedback target exists

---

## 5. Icons

### Library Priority

1. **Lucide** — primary (already a dependency via shadcn/ui)
2. **Phosphor** — secondary, Regular weight only (stroke consistency with Lucide)
3. Any other library — last resort; add a comment explaining why

Do not mix icon styles within a single component. Never use emojis as icon substitutes.

### One Icon, One Meaning

The same icon must not be reused for two different meanings anywhere in the app.

**Canonical Icon Map:**

| Meaning                  | Icon name          | Library |
| ------------------------ | ------------------ | ------- |
| Staleness / needs review | `AlertCircle`      | Lucide  |
| Snapshot                 | `Camera`           | Lucide  |
| Edit / modify            | `Pencil`           | Lucide  |
| Delete / remove          | `Trash2`           | Lucide  |
| Link / connected         | `Link2`            | Lucide  |
| Confirmed / reviewed     | `CheckCircle2`     | Lucide  |
| Add / create             | `Plus`             | Lucide  |
| Navigate back            | `ChevronLeft`      | Lucide  |
| Navigate deeper          | `ChevronRight`     | Lucide  |
| Settings                 | `Settings`         | Lucide  |
| Household / members      | `Users`            | Lucide  |
| Income source            | `Wallet`           | Lucide  |
| Copy                     | `Copy`             | Lucide  |
| Close / dismiss          | `X`                | Lucide  |
| Information              | `Info`             | Lucide  |
| Loading / pending        | Spinner (animated) | custom  |

### Icons with Text

When an icon appears inline beside label text: icon size = cap height of adjacent text; gap 4–6px; vertically centred on text baseline; gap must not exceed 8px.

### Icon-Only Elements

Any icon without accompanying visible label text must have a tooltip on hover (see `design-patterns.md` §4.6 Tooltips).

---

## 6. Images as Identifiers

### Scope

Any named data entry may be assigned a main image: wealth accounts, income sources, bill items, discretionary categories, purchases, gift recipients.

### Sources

1. **Curated library** — logos for common UK institutions, bundled/statically served
2. **User-uploaded** — stored per household

**Curated library starting set:**

| Category                 | Examples                                                             |
| ------------------------ | -------------------------------------------------------------------- |
| Banks / current accounts | Monzo, Barclays, HSBC, Lloyds, NatWest, Starling, Santander, Halifax |
| Savings / ISA platforms  | Marcus, Zopa, Chase, NS&I                                            |
| Pension providers        | Vanguard, Aviva, Legal & General, Scottish Widows, Nest, PensionBee  |
| Investment platforms     | Vanguard, Fidelity, Hargreaves Lansdown, Trading 212                 |
| Utilities                | British Gas, Octopus Energy, EDF, E.ON                               |
| Telecoms / broadband     | Sky, Virgin Media, BT, Vodafone, EE, Three                           |
| Streaming                | Netflix, Spotify, Apple, Disney+, Amazon                             |

### Fallback

`EntityAvatar` placeholder — deterministic colour from entry name, 1–2 initials. The fallback is the default expected appearance for new entries — not an error state.

### Display Rules

- Always circular at row/list scale; may be rounded-square at larger detail scale
- Add a subtle border token ring only if needed for contrast

---

## 7. Top Navigation Bar

Full-width bar above both panels, present on all pages. Height: 48px. Background: `background` token (flush with page — no border, no shadow).

**Layout:** `finplan` wordmark (left) — nav links — household switcher — user menu (right).

**Wordmark:** `font-heading`, `font-bold`, `text-lg`, `tracking-tight`. Always **finplan** — lowercase, one word. Never "FinPlan", "Fin Plan", "FINPLAN".

**Nav links:** `Overview`, `Wealth`, `Planner`, `Settings`. Font: `font-heading` weight 500.

**Active state:** `action` colour 2px underline below link text; text `text-primary`. Inactive: `text-secondary`. Hover: `text-primary`, no underline.

**Rules:**

- Household switcher always shows the active household name
- Switching households reloads the active page's data immediately
- Active nav uses `action` colour, not a tier colour — the nav is a global element

---

## 8. Settings Page

Two-panel layout. Left panel lists settings categories using `page-accent` (`#8b5cf6`) for selected state — no tier colours.

**Settings categories:** Income sources, Staleness thresholds, Surplus benchmark, ISA tax year, Household, Snapshot management, Trust accounts, Waterfall.

**Right panel:** opens directly to the category's form/controls — no intermediate item list (unlike Overview).

**Section headers:** `page-accent`, `font-heading` weight 700, uppercase, 0.06em letter-spacing.

**Destructive actions** (e.g. "Rebuild waterfall", "Remove member") must:

- Be visually separated from non-destructive actions (below a divider)
- Be labelled with the consequence ("This will clear all waterfall data")
- Be confirmed via `ConfirmationModal` before proceeding
