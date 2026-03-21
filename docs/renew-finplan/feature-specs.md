# FinPlan — Feature Specifications

> Detailed specs for each section of the redesigned app. Read alongside `design-philosophy.md` for the UX principles and patterns that underpin these decisions.

---

## 1. Overview (The Waterfall)

The primary view of the app. Users land here by default. It is the only page most users will need during a routine monthly check.

### Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  finplan          Overview  Wealth  Planner  Settings    Josh ▾ │
├─────────────────────────────────────────────────────────────────┤
│  Overview                             March 2026   [Review ▸]  │
│  ◂  Jan 2025 ··· Apr 2025 ··· Jan 2026 ··· [Now]  ▸            │
│       ●               ●              ●                          │
│   Yr Review       Yr Review      Salary +£200                   │
├───────────────────────────┬─────────────────────────────────────┤
│                           │  (right panel — contextual)         │
│  ▼ INCOME        £8,856   │                                     │
│  ├─ Josh Salary  £5,148   │  Click any item to see its          │
│  └─ Cat Salary   £3,708   │  detail, history, and edit.         │
│                           │                                     │
│  ─────────────────────    │                                     │
│                           │                                     │
│  ▼ COMMITTED     £4,817   │                                     │
│  ├─ Monthly      £4,575   │                                     │
│  └─ Yearly (÷12)   £242 ⚠│                                     │
│                           │                                     │
│  ─────────────────────    │                                     │
│                           │                                     │
│  ▼ DISCRETIONARY £3,830   │                                     │
│  ├─ Food           £650   │                                     │
│  ├─ ▼ Savings    £1,000   │                                     │
│  │   ├─ Tandem     £700   │                                     │
│  │   └─ Trading    £300   │                                     │
│  ├─ Petrol         £100   │                                     │
│  └─ ··· 12 more          │                                     │
│                           │                                     │
│  ─────────────────────    │                                     │
│                           │                                     │
│  ▼ SURPLUS         £209   │                                     │
│  ├─ Unallocated    £209   │                                     │
│  └─ [Allocate to goal ▸] │                                     │
│                           │                                     │
└───────────────────────────┴─────────────────────────────────────┘
```

### Waterfall Layers

| Layer | Content | Notes |
|---|---|---|
| **Income** | All income sources (salary, freelance, rental, etc.) | Per person where relevant |
| **Committed — Monthly** | Fixed regular outgoings (mortgage, subscriptions, phone) | Cannot easily choose not to spend |
| **Committed — Yearly (÷12)** | Annual bills amortised to monthly average | Each bill has a due month; see Yearly Bills section |
| **Discretionary** | Chosen spending categories (food, petrol, takeaways, etc.) | Savings is a special sub-type here |
| **Surplus** | Income minus all committed and discretionary | First-class citizen; never buried |

### Surplus Indicator

When surplus falls below a configurable threshold (default: 10% of income), a subtle indicator appears with a tooltip:

> "A monthly surplus of around 10% of income is a common planning benchmark."

This is informational only. No recommendation is made.

### Right Panel — Item Detail

Clicking any line item in the waterfall populates the right panel:

```
┌──────────────────────────────────┐
│  Josh Salary                     │
│  £5,148 / month                  │
│  Last reviewed: Jan 2026  ✓      │
│                                  │
│  History (24 months)             │
│  £5.2k ┤          ╭──────────   │
│  £4.9k ┤    ╭─────╯              │
│  £4.5k ┤────╯                    │
│                                  │
│  [ Edit ]   [ Still correct ✓ ] │
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

Accessible from the Committed — Yearly row in the waterfall (right panel, or dedicated sub-view).

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
│  By liquidity:       │                                          │
│  Liquid     £47,311  │                                          │
│  Semi-liq  £162,922  │                                          │
│  Illiquid   £47,889  │                                          │
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
- **By liquidity**: secondary breakdown (liquid / semi-liquid / illiquid) — analytical only, not navigation
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
│  Planner                                         2026           │
├──────────────────────┬──────────────────────────────────────────┤
│                      │  (right panel — purchase list by default)│
│  PURCHASES         ● │                                          │
│  Budget    £6,000    │  ● London Trip        £1,000   In prog   │
│  Committed £10,110 ⚠ │  ● Kitchen repaint    £2,000   In prog   │
│  Spent      £5,172   │  ✓ Backdoor           £1,117   Done      │
│                      │  ● Bay window           £650   In prog   │
│  ───────────────────  │  ● Network cabling      £800   In prog  │
│                      │  ✓ sofas               £3,500   Done     │
│  GIFTS               │  ✓ Pillows               £160   Done     │
│  Budget    £2,400    │  ● Guttering             £300            │
│  Estimated £2,623 ⚠  │  ··· 11 more                            │
│  Spent     £1,180    │                                          │
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
│  Committed        Yes                                           │
│  Spent            £395.75                                       │
│  Status           In progress                                   │
│  Reason           Get it in before she starts school            │
│  Comment          Hotel booked 23/24 Jun                        │
│                                                                 │
│  Added: 03 Jan 2026                                             │
│  Spent £395.75 on 14 Feb 2026                                   │
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
| Committed for current year | Boolean | Drives "Estimated cost for year" total |
| Funding source | Multi-select | Savings, Bonus, Purchasing budget, Holiday budget, etc. |
| Spent | Currency | Actual amount paid |
| Status | Enum | Not started / In progress / Done |
| Reason | Text | Why we want this |
| Comment | Text | Practical notes (quotes, contacts, bookings) |

Budget summary: manually set yearly budget vs sum of estimated costs where committed = Yes (red if over).

### Gifts — Right Panel

Selecting Gifts in the left panel shows a people-and-events grid in the right panel. Birthdays and Christmas are shown as sub-sections. Clicking a person steps into their detail:

```
│  Gifts                                                          │
│  ─────────────────────────────────────────────────────────────  │
│  Birthdays           £856 spent  /  £1,272 budget              │
│  Cat      Budget £100   Spent £100  ✓                           │
│  Josh     Budget £100   Spent £0                                │
│  LR       Budget £150   Spent £150  ✓                           │
│  Dex      Budget £160   Spent £160  ✓                           │
│  Lorraine  Budget £50   Spent £38   ⚠ partial                  │
│  ··· 20 more                                                    │
│                                                                 │
│  Christmas           £324 spent  /  £1,128 budget              │
│  Cat      Budget £100   Spent £0                                │
│  Josh     Budget £100   Spent £0                                │
│  ··· 20 more                                                    │
│                                                                 │
│  Other                                                          │
│  Mothers Day  Budget £115   Spent £115  ✓                       │
│  Fathers Day   Budget £50   Spent £0                            │
│                                                                 │
│  [ + Add person ]                                               │
```

### Gifts — Fields per Person

| Field | Notes |
|---|---|
| Name | |
| Birthday budget | |
| Birthday spent | Highlighted green when spent ≥ budget |
| Christmas budget | |
| Christmas spent | |
| Notes | Optional free text |

Annual gift budget is a single manually-set figure. Estimated total is the sum of all birthday + Christmas budgets + Other events.

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
│  ●────────●────────○────────○────────○                          │
│  Income  Bills  Yearly  Discret.  Summary                       │
├─────────────────────────────────────────────────────────────────┤
│  (step content)                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Steps

**Step 1 — Income**
**Step 2 — Monthly Bills**
**Step 3 — Yearly Bills**
**Step 4 — Discretionary**
**Step 5 — Summary**

Within each step, items are shown as cards. Stale items appear first, with their age clearly displayed. For each item, two actions are available:

```
┌─────────────────────────────────────────────────────────────────┐
│  Cat Salary                                    ⚠ 14 months     │
│  £3,708 / month · Last reviewed: Jan 2025                      │
│                                                                 │
│                    [ ✓ Still correct ]   [ Update ]            │
└─────────────────────────────────────────────────────────────────┘
```

- **Still correct**: one click; confirms value as current; resets staleness clock
- **Update**: expands an inline edit form within the card; no modal, no page change

Items that are not stale are shown below stale items, condensed, with a "confirm all remaining" shortcut.

### Exit and Resume

The wizard can be exited at any time. Partial progress is saved. On re-entry, the wizard resumes from the last incomplete step. Items already confirmed in the session retain their confirmed state.

### Step 5 — Summary

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

A "significant value change" is any change to income sources or the mortgage/primary housing cost.

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

Independent of snapshots. Every line item in the waterfall and every account on the Wealth page maintains a complete history of values with dates. This history is always visible in the right panel detail view, regardless of whether the user is in snapshot mode.

---

## 7. Mobile Experience

### Layout

On mobile, the two-panel layout collapses to a single column of summary cards:

```
┌─────────────────────┐
│  finplan       Josh │
├─────────────────────┤
│  March 2026         │
│                     │
│  INCOME      £8,856 │ ▸
│  COMMITTED   £4,817 │ ▸  ⚠
│  DISCRETIONARY      │
│              £3,830 │ ▸
│  SURPLUS       £209 │ ▸
└─────────────────────┘
```

Tapping a card expands it to show the line items within that section. Tapping a line item opens a full-screen edit sheet with a number pad for quick value entry.

### Mobile Use Cases

Mobile is optimised for:
- Quick value updates ("this bill just went up by £3")
- Spot checks ("what is my current surplus?")
- Staleness acknowledgement ("still correct" on a single item)

Mobile is **not** designed for:
- Initial setup
- The Review Wizard (desktop only)
- Deep analysis or forecasting

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
