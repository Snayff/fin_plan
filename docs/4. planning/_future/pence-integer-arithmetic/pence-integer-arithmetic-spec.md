---
feature: pence-integer-arithmetic
status: backlog
priority: medium
deferred: true
phase:
implemented_date:
---

# Pence-Integer Arithmetic

## Intention

All financial values in FinPlan are currently stored and calculated as floating-point numbers (pounds with decimal fractions). This introduces accumulated rounding errors in waterfall calculations (e.g. `annual / 12` across multiple income sources), amortisation schedules (compound rounding per month), and any sum-of-parts aggregation. Migrating to integer pence arithmetic eliminates this class of bug entirely and is the correct long-term approach for a financial application.

## Description

Store all monetary values in the database as integers (pence). Perform all arithmetic in integer pence. Convert to display pounds only at the presentation layer. A single `toGBP(pence: number): string` formatting utility handles display; a `toPence(pounds: number): number` utility handles input conversion.

This affects: income sources, committed bills, yearly bills, discretionary categories, savings allocations, wealth account values, ISA contributions, snapshots, planner purchases and budgets, and any other monetary column in the Prisma schema.

## Constraints

- **Database migration required** — every monetary column changes type from `Float` to `Int`. Prisma migration must multiply all existing values by 100.
- **Shared schemas updated** — all Zod schemas in `packages/shared` that accept or return monetary values must be updated. Input schemas should accept pounds (user-facing) and convert; response schemas return pence with display formatting at the component level.
- **Frontend display layer** — all currency display components receive pence and format via a shared `formatGBP(pence: number)` utility. No raw division by 100 scattered across components.
- **No mixed units** — after migration, no floating-point pounds may appear in calculation code. A lint rule or type alias (`type Pence = number`) should enforce this.
- **Interim `toGBP()` utility** — while this feature is pending, a `toGBP(n: number): number` rounding utility (2dp) is applied in waterfall and amortisation calculations to control drift.

## User Stories

- As a user, I want my surplus and waterfall figures to be arithmetically exact so that "income − committed − discretionary − savings = surplus" holds without rounding residual.
- As a developer, I want all monetary arithmetic to be in integers so that floating-point drift cannot accumulate in calculations.

## Acceptance Criteria

- [ ] All monetary Prisma columns are `Int` (pence)
- [ ] Prisma migration correctly converts existing float values (multiply × 100, round)
- [ ] All Zod input schemas accept pounds and convert to pence before persistence
- [ ] All Zod response schemas return pence; display components format via `formatGBP()`
- [ ] `formatGBP(pence)` and `toPence(pounds)` utilities exist in `packages/shared`
- [ ] No raw division by 100 outside of `formatGBP`
- [ ] Waterfall surplus invariant holds: `income − committed − discretionary − savings === surplus` (no rounding residual)
- [ ] Amortisation schedule final balance is exactly 0 pence on a standard loan

## Open Questions

- [ ] What precision do we use for percentage calculations (e.g. surplus % of income)? Return as a float percentage or integer basis points?
- [ ] ISA allowance (£20,000) and contribution tracking — stored as pence (2,000,000p)? Any display edge cases?
- [ ] Should the `Pence` type alias be a branded type (`type Pence = number & { __brand: 'pence' }`) to prevent accidental mixing with display values in TypeScript?
- [ ] How to handle user input (e.g. "£1,500.50") — parse at the form level, convert to pence before API call, or convert at the API boundary?
