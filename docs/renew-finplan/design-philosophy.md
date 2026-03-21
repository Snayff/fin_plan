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
  = Surplus (what is left to save, invest, or allocate to goals)
```

Every design decision should reinforce this mental model. The waterfall is not a feature — it is the identity of the app.

### 2. Plan, Not Ledger

FinPlan tracks **what you intend**, not every transaction you make. Users reconcile actual spending through their bank app. FinPlan's role is to maintain the plan and make it easy to keep that plan current.

All language throughout the app must reflect this consistently. Use:
- "budgeted", "planned", "allocated", "expected"

Avoid:
- "spent", "paid", "charged" (unless recording actual figures in Planner)

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

Financial terminology creates friction. Where a plain English equivalent exists, use it. "Semi-liquid assets" is not plain English. "Savings", "Pensions", and "Property" are.

### 6. Mobile and Desktop are Different Jobs

- **Desktop**: the primary environment for setup, yearly review, and deep analysis
- **Mobile**: quick edits and spot checks ("this bill just went up by £3")

The app is designed desktop-first. Mobile collapses the layout into summary cards with tap-to-expand and inline editing via number pad. The Review Wizard is desktop-first; mobile offers lightweight ad-hoc edits only.

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

This pattern applies to: Overview (waterfall), Wealth, and Planner. The Review Wizard is a full-screen focused mode and is exempt.

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

Per-item history (a graph of how an individual value has changed over time) is always available in the right panel detail view, independent of snapshots.

### Liquidity Classification

Assets are classified into three liquidity tiers for analytical purposes:

| Tier | Description | Examples |
|---|---|---|
| Liquid | Accessible immediately | Cash, savings accounts, ISAs |
| Semi-liquid | Accessible with delay or restrictions | Pensions, stocks & shares, investment accounts |
| Illiquid | Not readily convertible to cash | Property equity, vehicles, physical assets |

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

Each household has its own independent waterfall, wealth picture, and planner. The user switches between households via the top navigation user menu.
