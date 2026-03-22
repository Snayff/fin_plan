# FinPlan — Feature Specifications

> This document contains the detailed UX flows and specifications for every section of the FinPlan rebuild. It translates the principles in `design-philosophy.md` and the rules in `design-system.md` into concrete, section-by-section behaviour. Reference this document during implementation of each page or feature — it is the authoritative source for *what* each part of the app does.

---

## 1. Overview (The Waterfall)

The primary view of the app. Users land here by default. It is the only page most users will need during a routine monthly check.

### Layout

**Left panel: tier summaries only.** Individual items (income sources, bills, discretionary categories) are never shown in the left panel — they appear in the right panel when a tier is selected. The left panel is the household at a glance.

```
┌─────────────────────────────────────────────────────────────────┐
│  finplan          Overview  Wealth  Planner  Settings    Josh ▾ │
├─────────────────────────────────────────────────────────────────┤
│  Overview                             March 2026   [Review ▸]   │
│  ◂  Jan 2025 ··· Apr 2025 ··· Jan 2026 ··· [Now]  ▸             │
│       ●               ●              ●                          │
│   Yr Review       Yr Review      Salary +£200                   │
├───────────────────────────┬─────────────────────────────────────┤
│                           │  (right panel — contextual)         │
│  INCOME          £8,856   │                                     │
│  │                        │  Select a tier to see its items,    │
│  → minus committed spend  │  history, and edit controls.        │
│  │                        │                                     │
│  COMMITTED       £4,817   │                                     │
│  │                        │                                     │
│  → minus discretionary    │                                     │
│  │                        │                                     │
│  DISCRETIONARY   £3,830   │                                     │
│  │                        │                                     │
│  ─────────────────────    │                                     │
│                           │                                     │
│  SURPLUS    £209 · 2.4%   │                                     │
│                           │                                     │
└───────────────────────────┴─────────────────────────────────────┘
```

When the user selects a tier (e.g. INCOME), the right panel shows the item list for that tier:</p>

```
│  INCOME          £8,856   │  Income                             │
│  │                        │  ─────────────────────────────────  │
│  → minus committed spend  │  Josh Salary              £5,148   │
│  │                        │  Cat Salary               £3,708   │
│  ● COMMITTED     £4,817 ⚑ │                                     │
│  │                        │  [ + Add income source ]            │
│  → minus discretionary    │                                     │
│  │                        │                                     │
│  DISCRETIONARY   £3,830   │                                     │
│  │                        │                                     │
│  ─────────────────────    │                                     │
│                           │                                     │
│  SURPLUS    £209 · 2.4%   │                                     │
```

### Waterfall Layers

| Layer | Content | Notes |
|---|---|---|
| **Income** | All income sources (salary, freelance, rental, etc.) | Per person where relevant |
| **Committed — Monthly** | Fixed regular outgoings (mortgage, subscriptions, phone) | Cannot easily choose not to spend |
| **Committed — Yearly (÷12)** | Annual bills amortised to monthly average | Each bill has a due month; see Yearly Bills section |
| **Discretionary** | Chosen spending categories (food, petrol, takeaways, etc.) | Savings is a special sub-type here |
| **Surplus** | Income minus all committed and discretionary | First-class citizen; never buried |

### Income Sources

All income is entered as net (take-home, after tax and deductions). Each source captures: name, net amount, frequency, owner (household member), and — for one-off income — an expected month.

| Frequency | Waterfall treatment |
|---|---|
| **Monthly** | Included directly in the monthly income total |
| **Annual** | Divided by 12; displayed with a ÷12 indicator below the source name, same pattern as Yearly Bills |
| **One-off** | Not included in the monthly total; shown as a separate entry below regular income sources with a one-off badge and its expected month |

One-off income sources are also visible in the cashflow calendar (Yearly Bills view) as positive entries in the month they are expected.

### Surplus Indicator

When surplus falls below a configurable threshold (default: 10% of income), a subtle indicator appears with a tooltip:

> "A monthly surplus of around 10% of income is a common planning benchmark."

This is informational only. No recommendation is made.

### Surplus — Increase Savings Link

The `[Increase savings ▸]` link in the Surplus section selects the Savings row within the Discretionary section of the waterfall, populating the right panel with the savings detail. This guides the user to add or increase a savings allocation — the natural home for unallocated surplus.

### Overview — Empty State

When the waterfall has no data (new household or rebuilt from scratch), the left panel shows:

```
┌───────────────────────────┬─────────────────────────────────────┐
│                           │                                     │
│  Your waterfall is empty. │                                     │
│                           │                                     │
│  [ Set up your waterfall  │                                     │
│    from scratch ▸ ]       │                                     │
│                           │                                     │
└───────────────────────────┴─────────────────────────────────────┘
```

This CTA launches the Waterfall Creation Wizard.

### Right Panel — Item Detail

Clicking any line item in the waterfall populates the right panel:

```
┌──────────────────────────────────┐
│  Josh Salary                     │
│  £5,148 / month                  │
│  Last reviewed: Jan 2026  ✓      │
│                                  │
│  History (24 months)             │
│  £5.2k ┤          ╭──────────    │
│  £4.9k ┤    ╭─────╯              │
│  £4.5k ┤────╯                    │
│                                  │
│  [ Edit ]   [ Still correct ✓ ]  │
└──────────────────────────────────┘
```

- **Edit**: opens inline form within the right panel
- **Still correct**: confirms the value without changing it; resets the staleness clock
- **History graph**: shows value over the last 24 months (or since creation)

### Savings Allocation (Discretionary Sub-items)

Savings within Discretionary are expandable to show per-account allocations:

```
├─ ▼ Savings              £1,000
│   ├─ Tandem ISA           £700   → linked account ✓
│   └─ Trading 212 ISA      £300   → linked account ✓
```

Allocations are created and managed here in the waterfall. Linking to a Wealth account is optional but enables forecasting on the Wealth page.

### Snapshot Timeline

A timeline sits between the page header and the waterfall. Dots mark saved snapshots. Clicking a dot loads that snapshot in read-only mode with a banner:

```
  Viewing: January 2026 Review  ·  [Return to current ▸]
```

All values, totals, and history graphs reflect what was true at that snapshot. Editing is disabled in snapshot view.

---

## 2. Yearly Bills — Cashflow Calendar

Accessible from the Committed — Yearly row in the waterfall. When that row is selected, the right panel shows the ÷12 monthly total with a link at the top: **"View cashflow calendar ▸"**. Clicking this replaces the right panel content with the scrollable 12-month calendar. A breadcrumb `← Committed / Yearly Bills` returns to the summary. No full-page navigation is triggered.

### Purpose

Yearly bills are entered with an amount and a due month. The waterfall shows the ÷12 monthly average for planning. The cashflow calendar shows what actually lands and when, and whether the accumulated "pot" can cover each bill.

### Model

Each month, a fixed contribution (the ÷12 average) is added to a virtual pot. When a bill falls due, it is deducted from the pot. The calendar shows the running pot balance and flags months where the pot would go negative.

```
┌─────────────────────────────────────────────────────────────────┐
│  Yearly Bills — 2026 Cashflow             Monthly pot: £242     │
├─────────────────────────────────────────────────────────────────┤
│  Jan   +£242  →  Pot: £242                                      │
│  Feb   +£242  →  Pot: £484                                      │
│  Mar   +£242  →  Pot: £726                                      │
│  Apr   +£242                                                     │
│        −£487  Josh Car Insurance                                 │
│               →  Pot: £481  ✓ Covered                           │
│  May   +£242  →  Pot: £723                                       │
│  Jun   +£242                                                     │
│        −£422  House Insurance                                    │
│        −£300  Josh Car Service                                   │
│               →  Pot: £243  ✓ Covered                           │
│  ...                                                             │
│  Sep   +£242                                                     │
│        −£110  RAC Breakdown                                      │
│        −£487  Cat Car Insurance                                  │
│               →  Pot: −£82  ⚠ Shortfall                         │
└─────────────────────────────────────────────────────────────────┘
```

### Shortfall Nudge

When a shortfall is detected, the app surfaces two mechanical options — not a recommendation:

> "⚠ September looks tight — two bills land in the same month (£597 total). Your pot will have £515 by then.
>
> Options:
> - Increase your monthly contribution by £7 to cover this
> - Draw £82 from existing savings when the bills fall due"

The user decides. The app does the arithmetic.

---

## 3. Wealth Page

Tracks the household's total financial picture: savings, pensions, investments, property, vehicles, and other assets.

### Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  Wealth                                          Mar 2026       │
├──────────────────────┬──────────────────────────────────────────┤
│                      │  (right panel — updates on left select)  │
│  TOTAL NET WORTH     │                                          │
│  £258,122            │                                          │
│  ↑ £14,200 this yr   │                                          │
│                      │                                          │
│  By liquidity:            │                                     │
│  Cash & Savings  £47,311  │                                     │
│  Inv. & Pensions £162,922 │                                     │
│  Property & Veh. £47,889  │                                     │
│                      │                                          │
│  ───────────────────  │                                         │
│                      │                                          │
│  Savings    £37,900 ●│                                          │
│  Pensions  £162,922  │                                          │
│  Investments £9,411  │                                          │
│  Property   £47,889  │                                          │
│  Vehicles        £0  │                                          │
│  Other           £0  │                                          │
│                      │                                          │
│  ───────────────────  │                                         │
│                      │                                          │
│  Held on behalf of   │                                          │
│  LR          £6,101  │                                          │
│  (excluded)          │                                          │
│                      │                                          │
└──────────────────────┴──────────────────────────────────────────┘
```

### Left Panel

- **Total net worth**: headline figure with year-to-date change
- **By liquidity**: secondary breakdown (Cash & Savings / Investments & Pensions / Property & Vehicles) — analytical only, not navigation
- **Asset classes**: Savings, Pensions, Investments, Property, Vehicles, Other — primary navigation
- **Held on behalf of**: ring-fenced section for trust savings; excluded from net worth

### Right Panel — Asset Class Selected

When an asset class is selected (e.g. Savings), the right panel lists all accounts within it:

```
│  Savings                                                        │
│  ─────────────────────────────────────────────────────────────  │
│  Tandem ISA          £17,300   3.40%   Updated 15 Jan ✓        │
│  → £700/mo from waterfall  ·  Projected Dec 2026: £25,700      │
│                                                                 │
│  Trading 212 ISA     £18,500   4.30%   Updated 15 Jan ✓        │
│  → £300/mo from waterfall  ·  Projected Dec 2026: £22,100      │
│                                                                 │
│  Zopa Savings         £2,100   7.10%   Updated 15 Jan ✓        │
│  → £0/mo from waterfall                                         │
│                                                                 │
│  ⚡ Zopa (7.10%) has headroom — redirecting from Tandem could  │
│     earn ~£230 more per year.                                   │
│                                                                 │
│  ISA allowance used: £8,400 of £20,000  ████░░░░  Apr deadline │
│                                                                 │
│  [ + Add savings account ]                                      │
```

### Right Panel — Account Selected

Clicking an account steps one level deeper within the right panel:

```
│  ← Savings  /  Tandem ISA                                      │
│  ─────────────────────────────────────────────────────────────  │
│  Balance        £17,300                                         │
│  Interest rate  3.40%                                           │
│  Contribution   £700/mo  (from waterfall — Savings allocation)  │
│  Last updated   15 Jan 2026                                     │
│                                                                 │
│  History                                                        │
│  £18k ┤            ╭─────────                                   │
│  £15k ┤      ╭─────╯                                            │
│  £12k ┤ ╭────╯                                                  │
│       └────────────────────────────────────────────────────     │
│       Jan 25         Jan 26         Mar 26                      │
│                                                                 │
│  Projected (at £700/mo)                                         │
│  Dec 2026: £25,700                                              │
│                                                                 │
│  [ Edit balance ]    [ Update valuation ]                       │
```

"Update valuation" opens a form with two fields: new balance and valuation date (defaults to today, can be set to any past date).

### ISA Allowance Tracking

The ISA allowance bar reflects the combined contributions across all of a person's ISA accounts for the current tax year. It is tracked per person, not per account. Where multiple household members hold ISA accounts, separate allowance bars appear per person (e.g. Josh: £8,400 of £20,000; Cat: £3,200 of £20,000).

### Nudge Rules (Savings)

| Situation | Nudge? |
|---|---|
| Higher-rate account has unused capacity | Yes — show arithmetic |
| All contributions already at optimal rate | No |
| At ISA limit | No |
| Approaching ISA limit (within ~£2,000) | Yes — show remaining allowance and deadline |
| Under ISA limit with capacity | Yes — show remaining allowance |

### Trust Savings (Held on Behalf Of)

Clicking "LR" in the left panel populates the right panel with LR's accounts, following the same pattern as other asset classes. All features (history, staleness, contributions) work identically. The key distinction: these accounts never contribute to net worth calculations.

### Asset Classes — Data Captured

| Class | Key fields |
|---|---|
| **Savings** | Provider, account type, balance, interest rate, ISA flag, contribution (linked from waterfall) |
| **Pensions** | Provider, scheme/account reference, balance, owner (Josh / Cat / joint) |
| **Investments** | Provider, holding name, balance, owner |
| **Property** | Address/name, equity value (not total value), valuation date |
| **Vehicles** | Name/registration, equity value, valuation date |
| **Other** | Name, description, equity value, valuation date |

All classes share: valuation date on update, history graph, staleness signal.

---

## 4. Planner Page

Tracks two types of planned discretionary spending that sit outside the monthly waterfall: one-off annual purchases, and gift budgets.

### Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  Planner                             ‹ 2025   2026 ›            │
├──────────────────────┬──────────────────────────────────────────┤
│                      │  (right panel — purchase list by default)│
│  PURCHASES         ● │                                          │
│  Budget    £6,000    │  ● London Trip        £1,000   In prog   │
│  Scheduled £10,110 ⚠ │  ● Kitchen repaint    £2,000   In prog   │
│                      │  ✓ Backdoor           £1,117   Done      │
│  ───────────────────  │  ● Bay window           £650   In prog  │
│                      │  ● Network cabling      £800   In prog   │
│  GIFTS               │  ✓ sofas               £3,500   Done     │
│  Budget    £2,400    │  ✓ Pillows               £160   Done     │
│  Estimated £2,623 ⚠  │  ● Guttering             £300            │
│                      │  ··· 11 more                            │
│                      │  [ + Add purchase ]                      │
│                      │                                          │
└──────────────────────┴──────────────────────────────────────────┘
```

### Purchases — Right Panel (Item Detail)

Clicking a purchase steps into its detail:

```
│  ← Purchases  /  London Trip                                    │
│  ─────────────────────────────────────────────────────────────  │
│  Estimated cost   £1,000                                        │
│  Priority         Low                                           │
│  Funding source   Holiday, Outing                               │
│  Scheduled        Yes                                           │
│  Status           In progress                                   │
│  Reason           Get it in before she starts school            │
│  Comment          Hotel booked 23/24 Jun                        │
│                                                                 │
│  Added: 03 Jan 2026                                             │
│                                                                 │
│  [ Edit ]   [ Mark complete ]                                   │
```

### Purchases — Fields

| Field | Type | Notes |
|---|---|---|
| Item / service name | Text | |
| Date added | Date | |
| Estimated cost | Currency | |
| Priority | Enum | Lowest / Low / Medium / High |
| Scheduled for this year | Boolean | Drives "Scheduled cost for year" total |
| Funding source | Multi-select | Savings, Bonus, Purchasing budget, Holiday budget, etc. |
| Funding account | Optional | Dropdown of Wealth savings accounts; visible when Funding source includes Savings. If linked, the Wealth page projects a planned withdrawal from that account. |
| Status | Enum | Not started / In progress / Done |
| Reason | Text | Why we want this |
| Comment | Text | Practical notes (quotes, contacts, bookings) |

Budget summary: manually set yearly budget vs sum of estimated costs where scheduled = Yes (red if over).

The year selector (`‹ 2025  2026 ›`) in the Planner header allows viewing previous years. Prior years are read-only.

### Gifts — Right Panel

Gifts are organised by **person**. Each person has one or more events assigned to them, each with its own budget and spend. Selecting Gifts in the left panel opens the right panel in the default **Upcoming** view.

#### Right Panel — Upcoming View (Default)

Events are sorted chronologically by upcoming date across all people:

```
│  Gifts                                         [By person ▾]   │
│  ─────────────────────────────────────────────────────────────  │
│  Coming up                                                      │
│  Cat · Birthday       14 Apr   Budget £20                      │
│  LR · Birthday        02 May   Budget £150                     │
│  Josh · Birthday      15 Jun   Budget £100                     │
│  Christmas            25 Dec   Budget £1,128                   │
│                                                                 │
│  Done this year                                                 │
│  Cat · Christmas      ✓        Budget £100                     │
│  Mothers Day          ✓        Budget £115                     │
│                                                                 │
│  [ + Add person ]                                               │
```

Clicking any event row navigates to the detail for that person (breadcrumb: `← Gifts / Cat`).

#### Right Panel — By Person View

The "By person" toggle lists people with their combined budget and spend:

```
│  Gifts                                         [Upcoming ▾]    │
│  ─────────────────────────────────────────────────────────────  │
│  Cat        Budget £220                                        │
│  Josh       Budget £100                                        │
│  LR         Budget £150                                        │
│  Dex        Budget £160                                        │
│  Lorraine   Budget £50                                         │
│  ··· 20 more                                                    │
│                                                                 │
│  [ + Add person ]                                               │
```

#### Right Panel — Person Detail

Clicking a person shows their events:

```
│  ← Gifts / Cat                                                 │
│  ─────────────────────────────────────────────────────────────  │
│  Birthday     14 Apr    Budget £20                             │
│  Christmas    25 Dec    Budget £100   ✓                        │
│                                                                 │
│  Total  Budget £120                                            │
│                                                                 │
│  Notes:                                                         │
│                                                                 │
│  [ + Add event ]   [ Edit person ]                             │
```

Clicking an event row expands it inline (budget, notes). No additional panel depth is used.

#### Status Indicators (Purchases only)

| Symbol | Meaning |
|---|---|
| ✓ | Status: Done |
| ○ | Status: Not started or In progress |
| ⚠ | Scheduled cost exceeds budget |

#### Gifts — Event Types

When adding an event to a person, the event type is selected from a predefined list or defined as custom.

**Predefined (recurring annually):**

| Event | Date |
|---|---|
| Birthday | User sets day and month |
| Christmas | Fixed: 25 December |
| Mother's Day | UK date, auto-calculated annually |
| Father's Day | UK date, auto-calculated annually |
| Valentine's Day | Fixed: 14 February |
| Anniversary | User sets day and month |

**Custom:**
- User-defined name
- Recurrence: **Annual** (user sets day and month) or **One-off** (user sets specific date)
- Examples: Graduation, Wedding, New Baby

#### Gifts — Fields per Person

| Field | Notes |
|---|---|
| Name | |
| Notes | Optional free text about this person |

#### Gifts — Fields per Event

| Field | Notes |
|---|---|
| Event type | Predefined or Custom (with name) |
| Date | Day/month for annual events; full date for one-off custom events |
| Recurrence | Annual or One-off (custom events only) |
| Budget | |
| Notes | Optional |

Annual gift budget is a single manually-set figure. Estimated total is the sum of all event budgets for the current year (one-off events included only if they fall within the year).

---

## 5. Review Wizard

A full-screen focused mode for the annual (or ad-hoc) review of the waterfall. Triggered from the `[Review ▸]` button on the Overview page.

### Purpose

Walk the user through every section of the waterfall, surface stale items, and create a named snapshot at the end.

### Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  Annual Review — March 2026                           [✕ Exit]  │
│                                                                 │
│  ●────────●────────○────────○────────○────────○                  │
│  Income  Bills  Yearly  Discret.   Wealth  Summary              │
├─────────────────────────────────────────────────────────────────┤
│  (step content)                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Steps

**Step 1 — Income**
**Step 2 — Monthly Bills**
**Step 3 — Yearly Bills**
**Step 4 — Discretionary**
**Step 5 — Wealth**
**Step 6 — Summary**

Within each step, items are shown as cards. Stale items appear first, with their age clearly displayed. For each item, two actions are available:

```
┌─────────────────────────────────────────────────────────────────┐
│  Cat Salary                                    ⚠ 14 months     │
│  £3,708 / month · Last reviewed: Jan 2025                      │
│                                                                 │
│                    [ Update ]   [ Still correct ✓ ]            │
└─────────────────────────────────────────────────────────────────┘
```

- **Still correct**: one click; confirms value as current; resets staleness clock
- **Update**: expands an inline edit form within the card; no modal, no page change

Items that are not stale are shown below stale items, condensed, with a "confirm all remaining" shortcut.

### Exit and Resume

The wizard can be exited at any time. Partial progress is saved. On re-entry, the wizard resumes from the last incomplete step. Items already confirmed in the session retain their confirmed state.

### Step 5 — Wealth

Surfaces stale Wealth valuations across all asset classes. Uses the same card format:

```
┌─────────────────────────────────────────────────────────────────┐
│  Tandem ISA                                    ⚠ 14 months     │
│  £17,300 · Last updated: Jan 2025                               │
│                                                                 │
│          [ Update valuation ]   [ Still correct ✓ ]            │
└─────────────────────────────────────────────────────────────────┘
```

- **Still correct**: confirms the valuation as current; resets the staleness clock
- **Update valuation**: expands an inline form (new balance, valuation date)

Stale accounts appear first. Accounts with no staleness are shown condensed with a "confirm all remaining" shortcut.

### Step 6 — Summary

```
┌─────────────────────────────────────────────────────────────────┐
│  Summary                                                        │
│                                                                 │
│  Updated                                                        │
│  ├─ Cat Salary         £3,708 → £3,950    (+£242/mo)           │
│  ├─ Electric           £173   → £195      (+£22/mo)            │
│  └─ Nursery            £600   → £650      (+£50/mo)            │
│                                                                 │
│  Confirmed unchanged  (12 items)                                │
│                                                                 │
│  New surplus: £197 / month   (was £209)                        │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Save snapshot as:  [ March 2026 Review          ]      │   │
│  │                                  [ Save & finish ]      │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

The snapshot name is pre-populated with the month and year. It is editable. Saving creates the snapshot and returns the user to the Overview page with the timeline updated.

---

## 6. Snapshot System

### Creation Triggers

| Trigger | Behaviour |
|---|---|
| 1 January each year | Automatic snapshot: "January [Year] — Auto" |
| Review Wizard completed | Named snapshot with user-editable name |
| Significant value change | Prompt: "Save a snapshot before updating?" |
| Manual | User can save a snapshot at any time via a `[+ Save snapshot]` control adjacent to the timeline navigator on the Overview page. The name field is pre-populated with the current month and year, and is editable before saving. |

A "significant value change" is any change to an income source amount.

### Naming Rules

Snapshot names must be unique within a household. If a user enters a name already in use, the save field highlights with: *"A snapshot with this name already exists — choose a different name."* Auto-generated names (e.g. "January 2026 — Auto") are reserved and cannot be duplicated by user-created snapshots.

### Timeline Navigator

```
◂  Jan 2025  ···  Apr 2025  ···  Jan 2026  ···  [Now]  ▸
     ●               ●              ●
  Yr Review   Salary +£500     Yr Review
```

- Dots are clickable; unlabelled gaps are navigable with ◂ / ▸
- Clicking a dot loads the snapshot in read-only mode
- A banner clearly identifies snapshot view; all editing is disabled
- "Return to current ▸" exits snapshot view

### Per-Item History

Independent of snapshots. Every line item in the waterfall and every account on the Wealth page maintains a complete history of values with dates. The full all-time record is preserved in the database. The history graph displays the most recent 24 months (or since creation, whichever is shorter) — this display limit does not change when viewing a snapshot. When viewing a snapshot, the headline value in the right panel reflects the snapshot date, and a vertical marker on the graph indicates that date for orientation.

---

## 7. Mobile Experience

Not yet designed. See `backlog.md`.

---

## 8. Settings

Accessible via the top nav. Contains configuration that applies across the app.

| Setting | Description |
|---|---|
| **Income sources** | Add / edit / archive income sources |
| **Staleness thresholds** | Configure how long before each category of value is considered stale |
| **Surplus benchmark** | Set the % threshold for the surplus indicator (default: 10%) |
| **ISA tax year** | Confirm tax year start (default: 6 April for UK) |
| **Household** | Manage members, roles, and invitations |
| **Snapshot management** | View, rename, and delete snapshots |
| **Trust accounts** | Manage "held on behalf of" names |
| **Waterfall** | "Rebuild waterfall from scratch" — launches the Waterfall Creation Wizard after confirmation |

---

## 9. Waterfall Creation Wizard

A guided full-screen setup wizard for new users or users rebuilding from scratch. Full-screen; exempt from the two-panel layout rule.

### Entry Points

- **Overview empty state**: CTA "Set up your waterfall from scratch ▸" when the waterfall has no data
- **Settings → Waterfall**: "Rebuild waterfall from scratch" — requires confirmation before clearing existing data

### Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  Waterfall Setup                                      [✕ Exit]  │
│                                                                 │
│  ○────────○────────○────────○────────○────────○────────○        │
│  Household Income  Bills  Yearly  Discret. Savings  Summary     │
├─────────────────────────────────────────────────────────────────┤
│  (step content)                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Steps

**Step 1 — Household**: Confirm or add household members and their roles.

**Step 2 — Income**: Add income sources per person (salary, freelance, rental, etc.). Each source captures: name, amount, frequency, and owner.

**Step 3 — Monthly Bills**: Add fixed committed outgoings (mortgage, subscriptions, phone, etc.).

**Step 4 — Yearly Bills**: Add annual bills with due months. The ÷12 monthly contribution is calculated automatically.

**Step 5 — Discretionary**: Add spending categories and monthly budgets (food, petrol, takeaways, etc.).

**Step 6 — Savings**: Set savings allocations within Discretionary, and optionally link each allocation to a Wealth account.

**Step 7 — Summary**: Review the completed waterfall showing all layers and the resulting surplus. Option to save an opening snapshot named "Initial setup — [Month Year]" (editable).

### Exit and Resume

The wizard can be exited at any time. Partial progress is saved per step. On re-entry, the wizard resumes from where it left off. Saving is not required to preserve entered data within a session.

---

## 10. Household Management

Accessible via Settings → Household, and via the household switcher in the top navigation bar.

### Roles

| Role | Capabilities |
|---|---|
| **Owner** | View and edit all financial data; rename the household; invite and remove members; cancel and regenerate invites |
| **Member** | View and edit all financial data; cannot manage members or invites |

### Household Switcher

A dropdown in the top navigation bar lists all households the user belongs to. Selecting a household sets it as the active household; all pages immediately reflect that household's data.

### Creating a Household

Any user can create a new household from Settings. The creator becomes the owner. New households start with an empty waterfall, wealth picture, and planner.

### Inviting Members

Owners invite members by email address. The system generates a single-use invite link (valid for 24 hours) and displays it as both a QR code and a copyable URL. No email is sent by the app — the owner shares the link manually.

**New users** (no FinPlan account): click the invite link to create an account and join the household in a single flow. The email used to register must match the invited email.

**Existing users**: click the invite link and confirm joining. Their account email must match the invited address.

Pending invites are visible in household settings. Owners can cancel a pending invite or regenerate it (creates a new 24-hour link). Duplicate active invites to the same address are prevented.

Rate limit: 5 invites per hour per household.

### Removing Members

Owners can remove a member from the household. Removed members lose access immediately. Owners cannot remove themselves.

### Renaming a Household

Owners can rename the household from Settings → Household.

### Leaving a Household

Members can leave a household at any time. Owners cannot leave while they are the sole owner. Ownership transfer and household deletion are not yet implemented.
