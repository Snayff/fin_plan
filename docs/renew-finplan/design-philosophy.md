# FinPlan — Design Philosophy

> This document captures the vision, core principles, and UX patterns agreed during the initial design session (March 2026). It should be treated as a north star for all implementation decisions.

---

## Vision

FinPlan is a **personal financial planning and awareness tool** for households. It is not a ledger, a bank replacement, or a financial advisor. Its job is to give users a clear, honest picture of where their money comes from, where it goes, and where it is heading — and to surface that picture in a way that is always up to date, historically traceable, and genuinely useful.

The closest analogue is a spreadsheet that a financially organised household might maintain: income at the top, committed spend below it, discretionary choices below that, and whatever is left at the bottom. FinPlan makes that structure digital, intelligent, and alive.

---

## Core Principles

### 1. The Waterfall is the Mental Model

Users think about money as a cascade:

```
Income
  → minus Committed spend (bills, contracts, obligations)
  → minus Discretionary spend (choices you make each month)
  = Surplus (what is left to save or invest)
```

Every design decision should reinforce this mental model. The waterfall is not a feature — it is the identity of the app.

### 2. Plan, Not Ledger

FinPlan tracks **what you intend**, not every transaction you make. Users reconcile actual spending through their bank app. FinPlan's role is to maintain the plan and make it easy to keep that plan current.

All language throughout the app must reflect this consistently. Use:
- "budgeted", "planned", "allocated", "expected"

Avoid:
- "spent", "paid", "charged" (unless recording actual figures in Planner)

Actual discretionary spend is not tracked in the waterfall. Users reconcile actual spending through their bank app. FinPlan holds the plan.

### 3. Non-Advisory Guidance

FinPlan must not provide financial advice. It can — and should — surface useful information, benchmarks, and mechanical options. The distinction is:

| Acceptable | Not acceptable |
|---|---|
| "A surplus of ~10% of income is a common benchmark" | "You should increase your savings rate" |
| "Redirecting £X to Zopa could earn ~£230 more per year" | "We recommend moving your savings to Zopa" |
| "Your ISA allowance has £11,600 remaining before April" | "You should use your ISA allowance" |
| "June has two large bills — your pot may be short by £236" | "You need to save more for June" |

Nudges present options and arithmetic. They do not recommend a course of action.

### 4. Calm by Default

FinPlan is a planning tool, not an alarm system. Visual signals should be informative without being urgent. The app should feel like a trusted financial companion, not a dashboard of warnings.

- Use subtle colour signals (green/amber) rather than red alerts where possible
- Reserve strong visual emphasis for genuine shortfalls or over-budget states
- Silence is approval — if something is fine, say nothing

### 5. Accessibility Over Jargon

Financial terminology creates friction. Where a plain English equivalent exists, use it. "Savings", "Pensions", and "Property" are plain English. Asset groupings, liquidity labels, and UI copy must follow the same standard.

Where a term has a specific financial meaning — or a specific meaning within FinPlan — a tooltip is surfaced on hover. Tooltip definitions are maintained in `definitions.md`. No discrete in-app glossary is provided; contextual tooltips are the only mechanism for explaining terms.

### 6. Desktop-First

FinPlan is designed desktop-first. Desktop is the primary environment for setup, annual review, and deep analysis. Mobile is intended for quick edits and spot checks.

The mobile experience is not yet designed. See `backlog.md` for scope. The Review Wizard and Waterfall Creation Wizard are desktop-only.

### 7. All Income is Net

All income entered in FinPlan is net — take-home pay after tax, National Insurance, and any other deductions. Gross income, tax calculations, and employer contributions are out of scope. Users enter what arrives in their account.

---

## UX Patterns

### The Two-Panel Layout

Every page in FinPlan uses a consistent two-panel layout:

```
┌──────────────────────┬──────────────────────────────────────────┐
│                      │                                          │
│  LEFT PANEL          │  RIGHT PANEL                             │
│  Static              │  Contextual                              │
│  Navigation/summary  │  Detail for selected item                │
│                      │                                          │
└──────────────────────┴──────────────────────────────────────────┘
```

**Left panel rules:**
- Always visible; never replaced or navigated away from
- Contains only fixed structural categories and summary totals
- Categories are preset and hardcoded to the section (not user-defined nav)
- Clicking a category selects it; the selected state is visually indicated (●)

**Right panel rules:**
- Empty (or a placeholder prompt) until something is selected
- Updates contextually based on left panel selection
- Supports one level of internal depth (e.g. category list → item detail), navigated within the right panel itself using a breadcrumb (`← Category / Item`)
- Never triggers a full page navigation

This pattern applies to: Overview (waterfall), Wealth, and Planner. The Review Wizard and Waterfall Creation Wizard are full-screen focused modes and are exempt.

### Button Pairs

In every button pair, the rightmost button is always the affirmative action:

- `[ Edit ]   [ Still correct ✓ ]` — not the reverse
- `[ Update ]   [ Still correct ✓ ]` — not the reverse

This applies throughout the app, including the Review Wizard and all right panel detail views.

### Empty States

Every empty state must include a clear call to action. A blank view is never an acceptable end state:

- **Overview waterfall (no data)**: CTA to launch the Waterfall Creation Wizard
- **Right panel (nothing selected)**: muted placeholder prompt — "Select any item to see its detail"
- **Any list with no entries**: an inline "Add first item" action

Silence is approval only when data exists. When it does not, the app guides the user forward.

### Staleness Signals

Every value in FinPlan has a `lastReviewedAt` timestamp. When a value has not been confirmed or updated within a configurable threshold, it is considered stale.

Staleness is communicated through:
- A subtle dot or icon next to the value (⚠ or amber indicator)
- The age of the last review shown in the detail panel ("Last reviewed: 14 months ago")
- Stale items surfacing first in the Review Wizard

Thresholds are configurable per category (e.g. salary: 12 months, energy bills: 6 months). Defaults are provided.

Staleness is informational — never blocking. The user is never prevented from proceeding because a value is stale.

### Nudges

Nudges are short, non-advisory prompts that surface when there is a mechanical action available to the user. They appear in the right panel, contextually, only when relevant.

Rules:
- Only nudge when there is a gap or opportunity to act on
- Never nudge when everything is already optimised (silence = approval)
- One nudge at a time; do not stack multiple nudges in a panel
- Phrase nudges as information + arithmetic, not recommendations

### Snapshots (Historical Waterfall)

The waterfall always shows the current plan. Historical states are preserved as named snapshots.

Snapshots are created:
- Automatically at the start of each calendar year
- When a Review Wizard session is completed
- Prompted when a significant value changes ("Save a snapshot before updating?")

Snapshots appear as dots on a timeline navigator at the top of the Overview page. Clicking a dot loads that snapshot in read-only mode with a clear "Viewing: [snapshot name]" banner.

Snapshot names must be unique within a household. If a user enters a name already in use, the save field is highlighted with a validation message. Auto-generated names (e.g. "January 2026 — Auto") are reserved and cannot be duplicated by user-created snapshots.

Per-item history (a graph of how an individual value has changed over time) is always available in the right panel detail view, independent of snapshots. The history graph always shows the full all-time record — it is never truncated in snapshot mode. When viewing a snapshot, the headline value in the right panel reflects the snapshot date, and the history graph shows a vertical marker at that date for orientation.

### Liquidity Classification

Assets are classified into three liquidity tiers for analytical purposes:

| Tier | Description | Examples |
|---|---|---|
| Cash & Savings | Accessible immediately | Cash, savings accounts, ISAs |
| Investments & Pensions | Accessible with delay or restrictions | Pensions, stocks & shares, investment accounts |
| Property & Vehicles | Not readily convertible to cash | Property equity, vehicles, physical assets |

Liquidity tiers are **not** used as primary navigation. Users navigate by asset class (Savings, Pensions, Property, etc.). Liquidity is surfaced as a secondary analytical breakdown in the Wealth page summary.

### Trust Savings (Held on Behalf Of)

Some savings are managed by the household but legally owned by a third party (e.g. a child's Junior ISA, or funds held for a dependant). These are:
- Tracked with the same features as household savings (history, staleness, contributions)
- Clearly labelled "Held on behalf of [Name]"
- Excluded from household net worth calculations
- Displayed in a ring-fenced section below the main Wealth summary

### Asset Valuation

Assets are recorded at **equity value**, not total value. This avoids the need to separately track associated debt (e.g. mortgage balance against property value, or finance balance against a vehicle). The user enters what they own outright.

Every valuation update requires a **valuation date**, which defaults to today but can be set to any past date. This ensures the history graph accurately reflects when a value was true, not when it was entered.

### Savings ↔ Waterfall Linkage

Monthly savings allocations are defined in the waterfall (under Discretionary → Savings). Each allocation can optionally be linked to a specific account on the Wealth page. When linked:

- The Wealth page uses the contribution rate for forward projections
- The system can check ISA annual allowance limits per account
- Rate optimisation nudges can compare contribution rates across linked accounts

Linking is optional. Both pages function independently without it.

The ISA annual allowance is tracked per person, not per account. Where a person holds multiple ISA accounts, contributions are summed against a single person-level annual limit. Household members each have independent allowance tracking.

---

## Navigation Structure

Four top-level destinations, accessed via a top navigation bar (not a sidebar):

| Destination | Purpose |
|---|---|
| **Overview** | The waterfall. The primary view. |
| **Wealth** | Pensions, savings, investments, assets, net worth |
| **Planner** | Annual purchase list and gift budget |
| **Settings** | Categories, income sources, household, staleness thresholds |

Overview is the default landing page. All other destinations are secondary — useful when you need to dig in, but not where you spend most of your time.

Household management (multi-user, invites) follows the existing pattern and is accessible via Settings or the user menu.

---

## Multiple Households

Users may belong to multiple households. Common use cases:
- One household for joint finances, one for personal finances
- A household representing a dependant's finances (with the user as trustee)

Each household has its own independent waterfall, wealth picture, and planner. The user switches between households via the household switcher in the top navigation bar. The active household is always visible in the header.

Full household management details — roles, invitations, and member management — are specified in `feature-specs.md` Section 10.

---

## Waterfall Creation Wizard

A guided full-screen setup wizard for new users, or for users who want to rebuild from scratch. It follows the same full-screen convention as the Review Wizard and is exempt from the two-panel layout rule.

**Entry points:**
- Overview empty state CTA (when the waterfall has no data)
- Settings → "Rebuild waterfall from scratch" (requires confirmation before clearing existing data)

**Steps:**
1. **Household** — confirm or add household members
2. **Income** — add income sources per person (salary, freelance, rental, etc.)
3. **Monthly bills** — add fixed committed outgoings
4. **Yearly bills** — add annual bills with due months
5. **Discretionary** — add spending categories and budgets
6. **Savings** — set savings allocations and optionally link to Wealth accounts
7. **Summary** — review the completed waterfall; option to save an opening snapshot

On completion, the user is offered an opening snapshot named "Initial setup — [Month Year]." The wizard can be exited and resumed at any step; partial progress is preserved.
