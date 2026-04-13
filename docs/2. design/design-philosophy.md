# finplan — Design Philosophy

> This document captures the vision and 8 core principles that drive all design decisions in finplan. It establishes _why_ the app works the way it does. For the concrete rules that follow from these principles — UI specs, components, and interaction patterns — see `design-system.md`. For the non-negotiable invariants, see `design-anchors.md`.

---

## Vision

finplan is a **personal financial planning and awareness tool** for households. It is not a ledger, a bank replacement, or a financial advisor. Its job is to give users a clear, honest picture of where their money comes from, where it goes, and where it is heading — and to surface that picture in a way that is always up to date, historically traceable, and genuinely useful.

The closest analogue is a spreadsheet that a financially organised household might maintain: income at the top, committed spend below it, discretionary choices below that, and whatever is left at the bottom. finplan makes that structure digital, intelligent, and alive.

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

finplan tracks **what you intend**, not every transaction you make. Users reconcile actual spending through their bank app. finplan's role is to maintain the plan and make it easy to keep that plan current.

All language throughout the app must reflect this consistently. Use:

- "budgeted", "planned", "allocated", "expected"

Avoid:

- "spent", "paid", "charged"

Actual discretionary spend is not tracked in the waterfall. Users reconcile actual spending through their bank app. finplan holds the plan.

**Exception — the Gifts planner.** The Gifts planner is the only place in finplan that records actuals. Within it, "spent" is the correct word for an amount recorded against a planned gift. This exception is deliberate and narrowly scoped: it exists because gift-giving is a bounded, discrete, plan-and-reconcile activity that most households already track by hand. It does not open the door to transaction tracking anywhere else in the app, and it does not apply to the waterfall — the waterfall always shows the annual gift _budget_, never the sum of actuals.

### 3. Non-Advisory Guidance

finplan must not provide financial advice. It can — and should — surface useful information, benchmarks, and mechanical options. The distinction is:

| Acceptable                                                 | Not acceptable                             |
| ---------------------------------------------------------- | ------------------------------------------ |
| "A surplus of ~10% of income is a common benchmark"        | "You should increase your savings rate"    |
| "Redirecting £X to Zopa could earn ~£230 more per year"    | "We recommend moving your savings to Zopa" |
| "Your ISA allowance has £11,600 remaining before April"    | "You should use your ISA allowance"        |
| "June has two large bills — your pot may be short by £236" | "You need to save more for June"           |

Nudges present options and arithmetic. They do not recommend a course of action.

### 4. Calm by Default

finplan is a planning tool, not an alarm system. Visual signals should be informative without being urgent. The app should feel like a trusted financial companion, not a dashboard of warnings.

- Amber is the only attention signal — a gentle "noteworthy" marker, never an alarm
- Red is reserved exclusively for app errors (validation, system failures) — never for financial values
- Green is reserved exclusively for UI confirmations (saved, synced) — never for financial values
- Silence is approval — if something is fine, say nothing

### 5. Non-Judgemental

finplan does not colour-code financial positions as good or bad. Whether you have money or no money, the app shows the same neutral treatment — it helps, it does not judge.

- Financial values are never green (positive) or red (negative)
- Surplus is not celebrated; deficit is not punished
- The attention system (amber) highlights things worth a second look, not things that are wrong
- The app's job is to give you a clear picture, not to grade your finances

### 6. Accessibility Over Jargon

Financial terminology creates friction. Where a plain English equivalent exists, use it. "Savings", "Pensions", and "Property" are plain English. Asset groupings, liquidity labels, and UI copy must follow the same standard.

Where a term has a specific financial meaning — or a specific meaning within finplan — a tooltip is surfaced on hover. Tooltip definitions are maintained in `definitions.md` as a design reference.

Two mechanisms explain terms to users:

- **Contextual tooltips** — the primary mechanism. Interactive popovers on glossary terms (dotted underline, no colour change) showing the full definition with links to related concepts. Applied selectively in body text and descriptions, not headings or labels.
- **Dedicated Help page** — a searchable, browsable reference with a glossary of terms and concept explainers (visual examples, interactive elements, "Why it matters in finplan" context). Accessible via a top-level nav bar link.

### 7. Desktop-First

finplan is designed desktop-first. Desktop is the primary environment for setup, annual review, and deep analysis. Mobile is intended for quick edits and spot checks.

The mobile experience is not yet designed. See the backlog specs for scope. The Review Wizard and Waterfall Creation Wizard are desktop-only.

### 8. All Income is Net

All income entered in finplan is net — take-home pay after tax, National Insurance, and any other deductions. Gross income, tax calculations, and employer contributions are out of scope. Users enter what arrives in their account.

---

For navigation structure, page patterns, component specifications, and all concrete UI rules, see `_design-readme.md` to find the right doc.
