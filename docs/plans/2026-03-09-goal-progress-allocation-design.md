# Goal Progress Allocation Design

**Date:** 2026-03-09
**Status:** Approved

---

## Context

Goals currently track progress via manual `GoalContribution` records, using a `currentAmount` field updated by the user. This is workable for some goal types (e.g. saving for a purchase) but doesn't leverage the financial data already captured in Accounts and Transactions.

For goal types where progress *can* be inferred from account balances or transaction history (savings, net worth, investment, income), requiring manual contributions creates unnecessary friction and risks diverging from reality. This design introduces automatic, account-driven progress calculation per goal type, while preserving manual tracking where automation isn't possible.

---

## Goal Type → Progress Source Mapping

| Goal Type   | Progress Source                                             | Account Link      |
|-------------|-------------------------------------------------------------|-------------------|
| `savings`   | Sum of `savings` + `isa` account balances                   | None (aggregate)  |
| `investment`| Sum of `investment` + `stocks_and_shares_isa` balances      | None (aggregate)  |
| `net_worth` | Sum(all asset accounts) − Sum(credit + loan + liability)    | None (aggregate)  |
| `debt_payoff` | `targetAmount − \|linkedAccount.balance\|`               | **Required** (one liability) |
| `purchase`  | Linked account balance OR sum of GoalContributions          | Optional          |
| `income`    | Sum of `type='income'` transactions in current calendar period | None (transactions) |

**Asset account types** (positive contributors to net worth): `current`, `savings`, `isa`, `stocks_and_shares_isa`, `investment`, `asset`
**Liability account types** (negative contributors): `credit`, `loan`, `liability`

---

## Data Model Changes

### Prisma Schema (`apps/backend/prisma/schema.prisma`)

Add two new fields to the `Goal` model:

```prisma
linkedAccountId  String?   @db.Uuid          // For debt_payoff (required) and purchase (optional)
incomePeriod     IncomePeriod?               // For income goals only

enum IncomePeriod {
  month
  year
}
```

Add the relation on Goal:
```prisma
linkedAccount    Account?  @relation(fields: [linkedAccountId], references: [id])
```

Add inverse relation on Account:
```prisma
linkedGoals      Goal[]
```

### Zod Schemas (`packages/shared/src/schemas/goal.schemas.ts`)

- Add `linkedAccountId` (optional UUID) to `createGoalSchema` and `updateGoalSchema`
- Add `incomePeriod` (optional enum `'month' | 'year'`) to both schemas
- Add server-side refinements:
  - `debt_payoff` goals must have `linkedAccountId`
  - `income` goals must have `incomePeriod`

---

## Backend Service Changes

### `apps/backend/src/services/goal.service.ts`

**`getUserGoalsWithProgress()`** (main change):

1. Fetch all household accounts with current balances (reuse existing account service pattern)
2. Fetch all household transactions needed for income goals
3. Pre-compute aggregates once per request:
   - `savingsBalance` = sum of balances where `type IN ('savings', 'isa')`
   - `investmentBalance` = sum where `type IN ('investment', 'stocks_and_shares_isa')`
   - `netWorth` = sum(asset types) − sum(liability types)
4. Per goal, calculate `calculatedProgress`:
   - `savings` → `savingsBalance`
   - `investment` → `investmentBalance`
   - `net_worth` → `netWorth`
   - `debt_payoff` → `goal.targetAmount - Math.abs(linkedAccount.balance)`, floored at 0
   - `purchase` with `linkedAccountId` → `linkedAccount.balance`
   - `purchase` without `linkedAccountId` → sum of `GoalContribution.amount` (existing `currentAmount`)
   - `income` → sum of transactions where `type='income'` and date in current calendar month (if `incomePeriod='month'`) or current calendar year (if `incomePeriod='year'`)
5. `progressPercentage` = `(calculatedProgress / targetAmount) * 100`, capped at 100%

**Security — household ownership check:**
When creating/updating a goal with `linkedAccountId`, validate the account belongs to the same household as the goal. Return 403 if not.

**Deleted account handling:**
If `linkedAccountId` references a non-existent or inactive account, return `calculatedProgress: null` and include a `linkedAccountMissing: true` flag in the response.

### `apps/backend/src/routes/goal.routes.ts`

No structural changes — existing CRUD routes handle the new fields via the updated Zod schema validation.

---

## Frontend Type Changes

### `apps/frontend/src/types/index.ts`

**`Goal` base interface** — add:
```typescript
linkedAccountId: string | null;
incomePeriod: 'month' | 'year' | null;
```

**`EnhancedGoal` interface** — replace `currentAmount` with:
```typescript
calculatedProgress: number;           // replaces currentAmount
linkedAccountMissing?: boolean;       // true if linkedAccountId account no longer exists
```

---

## Frontend UI Changes

### `apps/frontend/src/components/goals/GoalForm.tsx`

**Contextual guidance banner** (shown below goal type selector):

| Goal Type    | Banner Text |
|--------------|-------------|
| `savings`    | "Progress is automatically calculated from your savings and ISA account balances." |
| `investment` | "Progress is automatically calculated from your investment account balances." |
| `net_worth`  | "Progress is automatically calculated as total assets minus liabilities." |
| `debt_payoff`| "Link the liability account you want to pay off. Progress updates automatically." |
| `purchase`   | "Link a dedicated account to track automatically, or log contributions manually." |
| `income`     | "We'll count income transactions for the selected period automatically." |

**Conditional fields:**
- `debt_payoff`: required account selector (filtered to `credit`, `loan`, `liability` types). Inline validation if not selected on submit.
- `purchase`: toggle between "Link an account" / "Track manually". Shows account selector (all types) if linked.
- `income`: required period selector (Monthly / Annually) alongside target amount field.

### `apps/frontend/src/pages/GoalsPage.tsx`

**Progress source indicator on goal cards:**
- Auto-calculated goals: small label "Auto-tracked from accounts"
- Linked account goals (`debt_payoff`, linked `purchase`): show linked account name + type chip
- Manual goals: "Manually tracked"
- Income goals: show "This month" or "This year" alongside progress

**Deleted account warning:**
- If `linkedAccountMissing: true`, show a warning banner on the card: "Linked account not found — progress unavailable"

**Progress bar:** uses `calculatedProgress / targetAmount` consistently across all goal types.

---

## Files to Modify

| File | Change |
|------|--------|
| `apps/backend/prisma/schema.prisma` | Add `linkedAccountId`, `incomePeriod`, `IncomePeriod` enum to Goal model |
| `apps/backend/prisma/migrations/` | New migration for Goal schema changes |
| `packages/shared/src/schemas/goal.schemas.ts` | Add `linkedAccountId`, `incomePeriod` to create/update schemas + refinements |
| `apps/backend/src/services/goal.service.ts` | Rewrite progress calculation in `getUserGoalsWithProgress()` |
| `apps/backend/src/routes/goal.routes.ts` | Minor: pass `linkedAccountId` validation through |
| `apps/frontend/src/types/index.ts` | Update `Goal`, `EnhancedGoal` interfaces |
| `apps/frontend/src/components/goals/GoalForm.tsx` | Add contextual banners, account selector, period selector |
| `apps/frontend/src/pages/GoalsPage.tsx` | Update progress display, add source indicator, deleted account warning |

---

## Verification

1. **Savings goal:** Create a goal with type `savings`, set target to £1,000. Add a savings account with balance £400. Goal should show 40% progress automatically.
2. **Debt payoff goal:** Create a `debt_payoff` goal linked to a credit account with balance £6,000, target £10,000. Should show 40% progress (£4,000 paid off).
3. **Purchase (linked):** Create a `purchase` goal linked to a savings account with £500 balance, target £2,000. Should show 25%.
4. **Purchase (manual):** Create a `purchase` goal without account link, add a contribution of £250 toward a £1,000 target. Should show 25%.
5. **Net worth goal:** Verify it correctly sums all asset accounts and subtracts liabilities.
6. **Income goal (monthly):** Create an income goal with target £3,000/month. Add income transactions this month totalling £1,500. Should show 50%.
7. **Deleted account:** Link a goal to an account, delete the account, verify the card shows the "Linked account not found" warning without crashing.
8. **Security:** Attempt to link a goal to an account from a different household (direct API call). Verify 403 response.
