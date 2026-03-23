---
feature: yearly-bills-calendar
status: backlog
priority: high
deferred: false
phase: 7
implemented_date:
---

# Yearly Bills — Cashflow Calendar

## Intention

Annual bills are smoothed via a virtual pot model (÷12), but users need to see whether their monthly contributions will actually cover each bill when it falls due. The calendar makes timing and shortfalls visible before they happen.

## Description

Accessed from Committed → Yearly row, the cashflow calendar shows a 12-month progression of the virtual pot balance, deducting each bill at its due month. Shortfalls are highlighted and a NudgeCard offers mechanical options to resolve them.

## User Stories

- As a user, I want to see the timing of each annual bill so that I can understand when money leaves my pot.
- As a user, I want to see whether my monthly contributions are sufficient to cover each bill so that shortfalls are visible in advance.
- As a user, I want a nudge offering options when a shortfall is detected so that I know how to fix it arithmetically.

## Acceptance Criteria

- [ ] Accessible from Committed → Yearly row in the waterfall
- [ ] Shows 12-month progression of pot balance
- [ ] Each bill deduction is shown at the correct month with the bill name and amount
- [ ] Pot balance updates month-by-month as contributions accumulate and bills deduct
- [ ] Shortfall months are visually highlighted with amber `attention` token (never red — red is for app errors only)
- [ ] NudgeCard appears when a shortfall is detected, offering: increase monthly contribution or draw from savings
- [ ] NudgeCard is arithmetic-only — no recommendation about which option to choose

## Open Questions

- [x] Does the calendar operate on a fiscal year (Apr–Mar) or calendar year (Jan–Dec)? **Calendar year (Jan–Dec).**
- [x] Are bills shown at their exact due date, or rounded to the start of the month? **Month-level only** — bills are deducted for their `dueMonth`; no day precision.
- [x] Can the user add/edit yearly bills directly from this calendar view? **No** — navigate back to the waterfall to edit bills.

---

## Implementation

### Schema

```prisma
// YearlyBill — dueMonth determines which month the bill is deducted from the pot
model YearlyBill {
  id          String   @id @default(cuid())
  householdId String
  name        String
  amount      Float
  dueMonth    Int      // 1–12
  ...
}

// IncomeSource — one_off sources with expectedMonth appear as positive entries in the calendar
// frequency = one_off, expectedMonth = 1–12
```

### API

```
GET /api/waterfall/cashflow?year={n}   → CashflowMonth[] for the year (defaults to current year)
```

### Components

- `CashflowCalendar.tsx` — breadcrumb `← Committed / Yearly Bills`; header "Yearly Bills — {year} Cashflow · Monthly pot: £{avg}"; 12-month list; shortfall rows highlighted with amber `attention` token; NudgeCard when shortfall detected

### Notes

**CashflowMonth shape:**

```typescript
interface CashflowMonth {
  month: number; // 1–12
  year: number;
  contribution: number; // sum of all yearlyBills.amount / 12
  bills: { id: string; name: string; amount: number }[];
  oneOffIncome: { id: string; name: string; amount: number }[];
  potAfter: number; // prevPot + contribution + sum(oneOffIncome) - sum(bills)
  shortfall: boolean; // potAfter < 0
}
```

**Algorithm:**

1. Start pot = 0
2. For each month 1–12:
   - Add monthly contribution (sum of all yearlyBills / 12)
   - Add any IncomeSource where `frequency = one_off` and `expectedMonth = this month`
   - Deduct any YearlyBill where `dueMonth = this month`
   - Record `potAfter`; set `shortfall = potAfter < 0`
3. Pot balance carries forward into next month

**Shortfall NudgeCard text pattern:**

> "{month} looks tight — {n} bills land ({total} total). Your pot will have £{pot} by then.
> Options:
> · Increase your monthly contribution by £{x} to cover this
> · Draw £{abs(pot)} from existing savings when the bills fall due"

NudgeCard is arithmetic-only — one per shortfall month, no recommendations.
