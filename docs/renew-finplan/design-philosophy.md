# FinPlan — Design Philosophy

> This document captures the vision and 7 core principles that drive all design decisions in FinPlan. It establishes *why* the app works the way it does. For the concrete rules that follow from these principles — UI specs, components, and interaction patterns — see `design-system.md`. For the non-negotiable invariants, see `design-anchors.md`.

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
- "spent", "paid", "charged"

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

## Navigation Structure

Four top-level destinations, accessed via a top navigation bar (not a sidebar). All four pages use the two-panel layout (left panel: navigation/summary; right panel: contextual detail).

| Destination | Purpose |
|---|---|
| **Overview** | The waterfall. The primary view. |
| **Wealth** | Pensions, savings, investments, assets, net worth |
| **Planner** | Annual purchase list and gift budget — headings use the `brand` (purple/rose) token, distinct from the waterfall tier colours |
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
