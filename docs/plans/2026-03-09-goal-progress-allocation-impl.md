# Goal Progress Allocation Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace manual-only goal progress tracking with automatic progress calculation derived from account balances and income transactions, per goal type.

**Architecture:** Add `linkedAccountId` (FK to Account) and `incomePeriod` (enum) to the Goal model. Rewrite `getUserGoalsWithProgress()` to compute `calculatedProgress` per goal type from live account balances. Replace `currentAmount` with `calculatedProgress` in the API response shape. Add guided UX in GoalForm and progress source labels in GoalsPage.

**Tech Stack:** Prisma (PostgreSQL), Fastify, Zod, React + TanStack Query, Bun test runner (`bun:test`), `@prisma/client`

---

## Task 1: Prisma Schema — Add linkedAccountId and incomePeriod

**Files:**
- Modify: `apps/backend/prisma/schema.prisma`

**Step 1: Add IncomePeriod enum and new Goal fields**

Open `apps/backend/prisma/schema.prisma`. Add the enum before the `Goal` model (around line 275), and add two fields to `Goal` plus an inverse relation on `Account`.

Add after the `GoalStatus` enum (look for the block of enums near the top of the file — search for `enum GoalType`):

```prisma
enum IncomePeriod {
  month
  year
}
```

In the `Goal` model (line 275), add these two fields after `metadata`:
```prisma
  linkedAccountId  String?        @map("linked_account_id") @db.Uuid
  incomePeriod     IncomePeriod?  @map("income_period")
  linkedAccount    Account?       @relation("GoalLinkedAccount", fields: [linkedAccountId], references: [id], onDelete: SetNull)
```

In the `Account` model (line 128), add the inverse relation after `transactions Transaction[]`:
```prisma
  linkedGoals      Goal[]         @relation("GoalLinkedAccount")
```

**Step 2: Run migration**

```bash
cd apps/backend
npx prisma migrate dev --name goal_progress_allocation
```

Expected: Migration created and applied. Prisma client regenerated.

**Step 3: Verify Prisma client has new types**

```bash
npx prisma studio
```

Open Goals table — confirm `linked_account_id` and `income_period` columns exist (both nullable).

**Step 4: Commit**

```bash
git add apps/backend/prisma/schema.prisma apps/backend/prisma/migrations/
git commit -m "feat: add linkedAccountId and incomePeriod to Goal model"
```

---

## Task 2: Zod Schema — Add linkedAccountId and incomePeriod with validation

**Files:**
- Modify: `packages/shared/src/schemas/goal.schemas.ts`
- Modify: `packages/shared/src/schemas/goal.schemas.test.ts`

**Step 1: Write failing tests**

Open `packages/shared/src/schemas/goal.schemas.test.ts` and add at the end:

```typescript
describe('createGoalSchema — linkedAccountId and incomePeriod', () => {
  it('accepts debt_payoff goal with linkedAccountId', () => {
    const result = createGoalSchema.safeParse({
      name: 'Pay off credit card',
      type: 'debt_payoff',
      targetAmount: 5000,
      linkedAccountId: 'a0000000-0000-0000-0000-000000000001',
    });
    expect(result.success).toBe(true);
  });

  it('rejects debt_payoff goal without linkedAccountId', () => {
    const result = createGoalSchema.safeParse({
      name: 'Pay off credit card',
      type: 'debt_payoff',
      targetAmount: 5000,
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toContain('linkedAccountId');
  });

  it('accepts income goal with incomePeriod', () => {
    const result = createGoalSchema.safeParse({
      name: 'Earn £5k/month',
      type: 'income',
      targetAmount: 5000,
      incomePeriod: 'month',
    });
    expect(result.success).toBe(true);
  });

  it('rejects income goal without incomePeriod', () => {
    const result = createGoalSchema.safeParse({
      name: 'Earn £5k/month',
      type: 'income',
      targetAmount: 5000,
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toContain('incomePeriod');
  });

  it('accepts purchase goal without linkedAccountId (manual tracking)', () => {
    const result = createGoalSchema.safeParse({
      name: 'Holiday fund',
      type: 'purchase',
      targetAmount: 2000,
    });
    expect(result.success).toBe(true);
  });

  it('accepts savings goal without linkedAccountId', () => {
    const result = createGoalSchema.safeParse({
      name: 'Emergency fund',
      type: 'savings',
      targetAmount: 10000,
    });
    expect(result.success).toBe(true);
  });
});
```

**Step 2: Run tests to confirm they fail**

```bash
cd packages/shared
bun test src/schemas/goal.schemas.test.ts
```

Expected: The new `describe` block fails — fields don't exist yet.

**Step 3: Implement schema changes**

Open `packages/shared/src/schemas/goal.schemas.ts`.

After the `GoalStatusEnum` definition (line 23), add:

```typescript
/**
 * Income period enum
 */
export const IncomePeriodEnum = z.enum(['month', 'year']);
```

Replace `createGoalSchema` (lines 28–58) with:

```typescript
export const createGoalSchema = z.object({
  name: z.string().min(1, 'Goal name is required').max(200),
  description: z.string().max(1000).optional(),
  type: GoalTypeEnum,
  targetAmount: z.number({
    required_error: 'Target amount is required',
    invalid_type_error: 'Target amount must be a number',
  }).min(0, 'Target amount must be non-negative'),
  targetDate: z
    .string()
    .min(1)
    .or(z.date())
    .optional()
    .transform((val) => (val ? (typeof val === 'string' ? val : val.toISOString()) : undefined)),
  priority: PriorityEnum.default('medium'),
  icon: z.string().max(50).optional(),
  linkedAccountId: z
    .string()
    .uuid('Invalid account ID')
    .optional(),
  incomePeriod: IncomePeriodEnum.optional(),
  metadata: z
    .object({
      milestones: z
        .array(
          z.object({
            percentage: z.number().min(0).max(100),
            label: z.string(),
            reached: z.boolean().default(false),
          })
        )
        .optional(),
      notes: z.string().optional(),
    })
    .optional(),
}).superRefine((data, ctx) => {
  if (data.type === 'debt_payoff' && !data.linkedAccountId) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'A linked account is required for debt payoff goals',
      path: ['linkedAccountId'],
    });
  }
  if (data.type === 'income' && !data.incomePeriod) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'An income period (month or year) is required for income goals',
      path: ['incomePeriod'],
    });
  }
});
```

Replace `updateGoalSchema` (lines 63–77) with:

```typescript
export const updateGoalSchema = z.object({
  name: z.string().min(1, 'Goal name cannot be empty').max(200).optional(),
  description: z.string().max(1000).optional(),
  type: GoalTypeEnum.optional(),
  targetAmount: z.number().min(0, 'Target amount must be non-negative').optional(),
  targetDate: z
    .string()
    .or(z.date())
    .optional()
    .transform((val) => (val ? (typeof val === 'string' ? val : val.toISOString()) : undefined)),
  priority: PriorityEnum.optional(),
  status: GoalStatusEnum.optional(),
  icon: z.string().max(50).optional(),
  linkedAccountId: z
    .string()
    .uuid('Invalid account ID')
    .optional()
    .nullable(),
  incomePeriod: IncomePeriodEnum.optional().nullable(),
  metadata: z.record(z.any()).optional(),
});
```

At the bottom of the file, add the new type exports:

```typescript
export type IncomePeriod = z.infer<typeof IncomePeriodEnum>;
```

**Step 4: Run tests to confirm they pass**

```bash
cd packages/shared
bun test src/schemas/goal.schemas.test.ts
```

Expected: All tests pass including the new ones.

**Step 5: Commit**

```bash
git add packages/shared/src/schemas/goal.schemas.ts packages/shared/src/schemas/goal.schemas.test.ts
git commit -m "feat: add linkedAccountId and incomePeriod validation to goal schemas"
```

---

## Task 3: Backend Service — Update CreateGoalInput / UpdateGoalInput interfaces and createGoal/updateGoal methods

**Files:**
- Modify: `apps/backend/src/services/goal.service.ts`
- Modify: `apps/backend/src/services/goal.service.test.ts`

**Step 1: Write failing tests**

Open `apps/backend/src/services/goal.service.test.ts`. Add at the end of the file:

```typescript
describe('goalService.createGoal — linkedAccountId and incomePeriod', () => {
  it('saves linkedAccountId when provided', async () => {
    const accountId = 'a0000000-0000-0000-0000-000000000001';
    prismaMock.goal.create.mockResolvedValue(
      buildGoal({ linkedAccountId: accountId })
    );

    await goalService.createGoal('household-1', {
      name: 'Pay off loan',
      type: 'debt_payoff' as any,
      targetAmount: 5000,
      linkedAccountId: accountId,
    });

    expect(prismaMock.goal.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ linkedAccountId: accountId }),
      })
    );
  });

  it('saves incomePeriod when provided', async () => {
    prismaMock.goal.create.mockResolvedValue(
      buildGoal({ incomePeriod: 'month' })
    );

    await goalService.createGoal('household-1', {
      name: 'Monthly income',
      type: 'income' as any,
      targetAmount: 5000,
      incomePeriod: 'month',
    });

    expect(prismaMock.goal.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ incomePeriod: 'month' }),
      })
    );
  });
});
```

**Step 2: Run to confirm failure**

```bash
cd apps/backend
bun test src/services/goal.service.test.ts --grep "linkedAccountId and incomePeriod"
```

Expected: FAIL — TypeScript errors or fields not being passed through.

**Step 3: Update interfaces and createGoal/updateGoal**

In `apps/backend/src/services/goal.service.ts`:

Update `CreateGoalInput` interface (lines 6–22) to add:
```typescript
  linkedAccountId?: string;
  incomePeriod?: 'month' | 'year';
```

Update `UpdateGoalInput` interface (lines 24–34) to add:
```typescript
  linkedAccountId?: string | null;
  incomePeriod?: 'month' | 'year' | null;
```

In `createGoal()`, update the `prisma.goal.create` call's `data` object to include:
```typescript
      linkedAccountId: data.linkedAccountId,
      incomePeriod: data.incomePeriod,
```

In `updateGoal()`, update the `updateData` builder section to include:
```typescript
    if (data.linkedAccountId !== undefined) updateData.linkedAccountId = data.linkedAccountId;
    if (data.incomePeriod !== undefined) updateData.incomePeriod = data.incomePeriod;
```

**Step 4: Run tests to confirm they pass**

```bash
cd apps/backend
bun test src/services/goal.service.test.ts
```

Expected: All pass.

**Step 5: Commit**

```bash
git add apps/backend/src/services/goal.service.ts apps/backend/src/services/goal.service.test.ts
git commit -m "feat: pass linkedAccountId and incomePeriod through createGoal/updateGoal"
```

---

## Task 4: Backend Route — Validate linkedAccountId belongs to same household

**Files:**
- Modify: `apps/backend/src/services/goal.service.ts`
- Modify: `apps/backend/src/services/goal.service.test.ts`

**Step 1: Write failing test**

In `goal.service.test.ts`, add:

```typescript
describe('goalService.createGoal — household ownership check', () => {
  it('throws ValidationError if linkedAccountId belongs to different household', async () => {
    prismaMock.account.findFirst.mockResolvedValue(null); // no match for householdId

    await expect(
      goalService.createGoal('household-1', {
        name: 'Pay off loan',
        type: 'debt_payoff' as any,
        targetAmount: 5000,
        linkedAccountId: 'a0000000-0000-0000-0000-000000000001',
      })
    ).rejects.toThrow(ValidationError);
  });
});
```

**Step 2: Run to confirm failure**

```bash
bun test src/services/goal.service.test.ts --grep "household ownership check"
```

Expected: FAIL — no ownership check yet.

**Step 3: Add ownership validation to createGoal and updateGoal**

In `createGoal()`, add before the `prisma.goal.create` call:

```typescript
    // Validate linkedAccountId belongs to same household
    if (data.linkedAccountId) {
      const account = await prisma.account.findFirst({
        where: { id: data.linkedAccountId, householdId },
      });
      if (!account) {
        throw new ValidationError('Linked account not found or does not belong to this household');
      }
    }
```

In `updateGoal()`, add after the `existingGoal` lookup:

```typescript
    // Validate linkedAccountId belongs to same household if provided
    if (data.linkedAccountId) {
      const account = await prisma.account.findFirst({
        where: { id: data.linkedAccountId, householdId },
      });
      if (!account) {
        throw new ValidationError('Linked account not found or does not belong to this household');
      }
    }
```

**Step 4: Run tests to confirm they pass**

```bash
bun test src/services/goal.service.test.ts
```

Expected: All pass.

**Step 5: Commit**

```bash
git add apps/backend/src/services/goal.service.ts apps/backend/src/services/goal.service.test.ts
git commit -m "feat: validate linkedAccountId household ownership in goal service"
```

---

## Task 5: Backend Service — Rewrite getUserGoalsWithProgress with calculatedProgress

**Files:**
- Modify: `apps/backend/src/services/goal.service.ts`
- Modify: `apps/backend/src/services/goal.service.test.ts`

**Step 1: Write failing tests**

In `goal.service.test.ts`, add a helper and tests. First, at the top of the file (after existing imports), ensure:
```typescript
// The module mock for balance utils:
mock.module("../utils/balance.utils", () => ({
  calculateAccountBalances: mock(() => new Map()),
  endOfDay: (d: Date) => d,
}));
import { calculateAccountBalances } from "../utils/balance.utils";
```

Then add:

```typescript
describe('goalService.getUserGoalsWithProgress — calculatedProgress', () => {
  function buildGoalWithContributions(overrides: Record<string, any> = {}) {
    return {
      ...buildGoal(overrides),
      contributions: [],
      linkedAccountId: null,
      incomePeriod: null,
    };
  }

  it('computes savings progress from savings+isa account balances', async () => {
    prismaMock.goal.findMany.mockResolvedValue([
      buildGoalWithContributions({ type: 'savings', targetAmount: 1000 }),
    ]);
    prismaMock.account.findMany.mockResolvedValue([
      { id: 'acc-savings', type: 'savings', isActive: true },
      { id: 'acc-isa', type: 'isa', isActive: true },
      { id: 'acc-current', type: 'current', isActive: true },
    ]);
    (calculateAccountBalances as any).mockResolvedValue(
      new Map([['acc-savings', 300], ['acc-isa', 100], ['acc-current', 500]])
    );

    const results = await goalService.getUserGoalsWithProgress('household-1');
    expect(results[0].calculatedProgress).toBe(400); // 300 + 100, NOT 500 (current excluded)
    expect(results[0].progressPercentage).toBe(40);
  });

  it('computes debt_payoff progress as targetAmount minus linkedAccount balance', async () => {
    const accountId = 'acc-credit';
    prismaMock.goal.findMany.mockResolvedValue([
      buildGoalWithContributions({ type: 'debt_payoff', targetAmount: 10000, linkedAccountId: accountId }),
    ]);
    prismaMock.account.findMany.mockResolvedValue([
      { id: accountId, type: 'credit', isActive: true },
    ]);
    (calculateAccountBalances as any).mockResolvedValue(
      new Map([[accountId, 6000]])
    );

    const results = await goalService.getUserGoalsWithProgress('household-1');
    expect(results[0].calculatedProgress).toBe(4000); // 10000 - 6000
    expect(results[0].progressPercentage).toBe(40);
  });

  it('sets linkedAccountMissing=true when linkedAccount not found', async () => {
    prismaMock.goal.findMany.mockResolvedValue([
      buildGoalWithContributions({ type: 'debt_payoff', targetAmount: 10000, linkedAccountId: 'deleted-acc' }),
    ]);
    prismaMock.account.findMany.mockResolvedValue([]); // no accounts
    (calculateAccountBalances as any).mockResolvedValue(new Map());

    const results = await goalService.getUserGoalsWithProgress('household-1');
    expect(results[0].linkedAccountMissing).toBe(true);
    expect(results[0].calculatedProgress).toBe(0);
  });

  it('computes income progress from income transactions this month', async () => {
    prismaMock.goal.findMany.mockResolvedValue([
      buildGoalWithContributions({ type: 'income', targetAmount: 3000, incomePeriod: 'month' }),
    ]);
    prismaMock.account.findMany.mockResolvedValue([]);
    (calculateAccountBalances as any).mockResolvedValue(new Map());
    prismaMock.transaction.aggregate
      .mockResolvedValueOnce({ _sum: { amount: 1500 } }) // monthly income
      .mockResolvedValueOnce({ _sum: { amount: 18000 } }); // yearly income (not used here)

    const results = await goalService.getUserGoalsWithProgress('household-1');
    expect(results[0].calculatedProgress).toBe(1500);
    expect(results[0].progressPercentage).toBeCloseTo(50);
  });

  it('uses currentAmount for manual purchase goals (no linkedAccountId)', async () => {
    prismaMock.goal.findMany.mockResolvedValue([
      buildGoalWithContributions({ type: 'purchase', targetAmount: 2000, currentAmount: 500 }),
    ]);
    prismaMock.account.findMany.mockResolvedValue([]);
    (calculateAccountBalances as any).mockResolvedValue(new Map());

    const results = await goalService.getUserGoalsWithProgress('household-1');
    expect(results[0].calculatedProgress).toBe(500);
  });
});
```

**Step 2: Run to confirm failure**

```bash
bun test src/services/goal.service.test.ts --grep "calculatedProgress"
```

Expected: FAIL — `getUserGoalsWithProgress` doesn't return `calculatedProgress` yet.

**Step 3: Rewrite getUserGoalsWithProgress**

In `apps/backend/src/services/goal.service.ts`:

Add to the imports at the top:
```typescript
import { calculateAccountBalances, endOfDay } from '../utils/balance.utils';
import { startOfMonth, startOfYear } from 'date-fns';
```

Add a helper function above the `goalService` object:

```typescript
const ASSET_ACCOUNT_TYPES = ['current', 'savings', 'isa', 'stocks_and_shares_isa', 'investment', 'asset'];
const LIABILITY_ACCOUNT_TYPES = ['credit', 'loan', 'liability'];
const SAVINGS_ACCOUNT_TYPES = ['savings', 'isa'];
const INVESTMENT_ACCOUNT_TYPES = ['investment', 'stocks_and_shares_isa'];

function computeGoalProgress(
  goal: {
    type: GoalType;
    targetAmount: any;
    currentAmount: any;
    linkedAccountId: string | null;
    incomePeriod: string | null;
  },
  balanceMap: Map<string, number>,
  accountsByType: Map<string, number>, // type -> sum of balances
  incomeThisMonth: number,
  incomeThisYear: number
): { calculatedProgress: number; linkedAccountMissing: boolean } {
  const targetAmount = Number(goal.targetAmount);
  let calculatedProgress = 0;
  let linkedAccountMissing = false;

  switch (goal.type as GoalType) {
    case 'savings':
      calculatedProgress = SAVINGS_ACCOUNT_TYPES.reduce(
        (sum, t) => sum + (accountsByType.get(t) ?? 0), 0
      );
      break;

    case 'investment':
      calculatedProgress = INVESTMENT_ACCOUNT_TYPES.reduce(
        (sum, t) => sum + (accountsByType.get(t) ?? 0), 0
      );
      break;

    case 'net_worth': {
      const assets = ASSET_ACCOUNT_TYPES.reduce((sum, t) => sum + (accountsByType.get(t) ?? 0), 0);
      const liabilities = LIABILITY_ACCOUNT_TYPES.reduce((sum, t) => sum + (accountsByType.get(t) ?? 0), 0);
      calculatedProgress = assets - liabilities;
      break;
    }

    case 'debt_payoff': {
      if (!goal.linkedAccountId) {
        calculatedProgress = 0;
        break;
      }
      const linkedBalance = balanceMap.get(goal.linkedAccountId);
      if (linkedBalance === undefined) {
        linkedAccountMissing = true;
        calculatedProgress = 0;
      } else {
        calculatedProgress = Math.max(0, targetAmount - Math.abs(linkedBalance));
      }
      break;
    }

    case 'purchase': {
      if (goal.linkedAccountId) {
        const linkedBalance = balanceMap.get(goal.linkedAccountId);
        if (linkedBalance === undefined) {
          linkedAccountMissing = true;
          calculatedProgress = 0;
        } else {
          calculatedProgress = linkedBalance;
        }
      } else {
        calculatedProgress = Number(goal.currentAmount);
      }
      break;
    }

    case 'income':
      calculatedProgress = goal.incomePeriod === 'year' ? incomeThisYear : incomeThisMonth;
      break;
  }

  return { calculatedProgress, linkedAccountMissing };
}
```

Replace the `getUserGoalsWithProgress` method body with:

```typescript
  async getUserGoalsWithProgress(householdId: string) {
    // Fetch goals and accounts in parallel
    const [goals, accounts] = await Promise.all([
      prisma.goal.findMany({
        where: { householdId },
        orderBy: [{ priority: 'asc' }, { createdAt: 'desc' }],
        include: {
          contributions: {
            orderBy: { date: 'desc' },
            include: {
              transaction: {
                select: { id: true, name: true, amount: true, date: true },
              },
            },
          },
        },
      }),
      prisma.account.findMany({
        where: { householdId, isActive: true },
      }),
    ]);

    // Calculate balances for all active accounts
    const accountIds = accounts.map((a) => a.id);
    const balanceMap = accountIds.length > 0
      ? await calculateAccountBalances(accountIds)
      : new Map<string, number>();

    // Aggregate balances by account type
    const accountsByType = new Map<string, number>();
    for (const account of accounts) {
      const balance = balanceMap.get(account.id) ?? 0;
      accountsByType.set(account.type, (accountsByType.get(account.type) ?? 0) + balance);
    }

    // Fetch income transactions only if there are income goals
    const hasIncomeGoals = goals.some((g) => g.type === 'income');
    let incomeThisMonth = 0;
    let incomeThisYear = 0;

    if (hasIncomeGoals) {
      const now = new Date();
      const [monthResult, yearResult] = await Promise.all([
        prisma.transaction.aggregate({
          where: {
            householdId,
            type: 'income',
            date: { gte: startOfMonth(now), lte: endOfDay(now) },
          },
          _sum: { amount: true },
        }),
        prisma.transaction.aggregate({
          where: {
            householdId,
            type: 'income',
            date: { gte: startOfYear(now), lte: endOfDay(now) },
          },
          _sum: { amount: true },
        }),
      ]);
      incomeThisMonth = Number(monthResult._sum.amount) || 0;
      incomeThisYear = Number(yearResult._sum.amount) || 0;
    }

    const enhancedGoals = goals.map((goal) => {
      const { calculatedProgress, linkedAccountMissing } = computeGoalProgress(
        goal,
        balanceMap,
        accountsByType,
        incomeThisMonth,
        incomeThisYear
      );

      const targetAmount = Number(goal.targetAmount);
      const progressPercentage = targetAmount > 0
        ? Math.min((calculatedProgress / targetAmount) * 100, 100)
        : 0;

      // Days remaining
      const daysRemaining = goal.targetDate
        ? differenceInDays(new Date(goal.targetDate), new Date())
        : null;

      // Contribution-based averages (used for projections)
      const contributions = goal.contributions;
      let averageMonthlyContribution = 0;
      if (contributions.length > 0) {
        const totalContributed = contributions.reduce((sum, c) => sum + Number(c.amount), 0);
        const firstContribution = contributions[contributions.length - 1];
        if (firstContribution) {
          const monthsSinceFirst = Math.max(
            1,
            differenceInDays(new Date(), new Date(firstContribution.date)) / 30
          );
          averageMonthlyContribution = totalContributed / monthsSinceFirst;
        }
      }

      // Projections
      let projectedCompletionDate: string | null = null;
      let recommendedMonthlyContribution: number | null = null;
      let isOnTrack = false;

      if (targetAmount > calculatedProgress) {
        const remaining = targetAmount - calculatedProgress;

        if (averageMonthlyContribution > 0) {
          const monthsToComplete = remaining / averageMonthlyContribution;
          projectedCompletionDate = addMonths(new Date(), monthsToComplete).toISOString();

          if (goal.targetDate && daysRemaining !== null) {
            const monthsRemaining = daysRemaining / 30;
            isOnTrack = monthsToComplete <= monthsRemaining;
          }
        }

        if (goal.targetDate && daysRemaining !== null && daysRemaining > 0) {
          const monthsRemaining = Math.max(1, daysRemaining / 30);
          recommendedMonthlyContribution = remaining / monthsRemaining;

          if (averageMonthlyContribution > 0) {
            isOnTrack = averageMonthlyContribution >= recommendedMonthlyContribution;
          }
        }
      } else {
        isOnTrack = true;
      }

      // Update milestone status in metadata
      const metadata = (goal.metadata as any) || {};
      if (metadata.milestones) {
        metadata.milestones = metadata.milestones.map((milestone: any) => ({
          ...milestone,
          reached: progressPercentage >= milestone.percentage,
        }));
      }

      return {
        ...goal,
        targetAmount,
        calculatedProgress,
        linkedAccountMissing,
        contributions: contributions.map((c) => ({ ...c, amount: Number(c.amount) })),
        progressPercentage,
        daysRemaining,
        averageMonthlyContribution,
        projectedCompletionDate,
        recommendedMonthlyContribution,
        isOnTrack,
        metadata,
      };
    });

    return enhancedGoals;
  },
```

**Step 4: Run tests**

```bash
bun test src/services/goal.service.test.ts
```

Expected: All pass.

**Step 5: Commit**

```bash
git add apps/backend/src/services/goal.service.ts apps/backend/src/services/goal.service.test.ts
git commit -m "feat: rewrite getUserGoalsWithProgress to compute calculatedProgress per goal type"
```

---

## Task 6: Frontend Types — Update Goal and EnhancedGoal interfaces

**Files:**
- Modify: `apps/frontend/src/types/index.ts`

**Step 1: Update Goal interface**

In `apps/frontend/src/types/index.ts`, find the `Goal` interface (around line 418) and add the two new fields:

```typescript
export interface Goal {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  type: GoalType;
  targetAmount: number;
  currentAmount: number;          // kept for backward-compat (manual purchase goals only)
  linkedAccountId: string | null; // ADD THIS
  incomePeriod: 'month' | 'year' | null; // ADD THIS
  targetDate: string | null;
  priority: Priority;
  status: GoalStatus;
  icon: string | null;
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}
```

**Step 2: Update EnhancedGoal interface**

Replace the `EnhancedGoal` interface (around line 451):

```typescript
export interface EnhancedGoal extends Goal {
  contributions: GoalContribution[];
  calculatedProgress: number;        // replaces currentAmount as the source of truth for progress
  linkedAccountMissing?: boolean;    // true if linkedAccountId account no longer exists
  progressPercentage: number;
  daysRemaining: number | null;
  averageMonthlyContribution: number;
  projectedCompletionDate: string | null;
  recommendedMonthlyContribution: number | null;
  isOnTrack: boolean;
}
```

**Step 3: Verify TypeScript compiles**

```bash
cd apps/frontend
npx tsc --noEmit
```

Expected: Errors only where `currentAmount` is used in the UI (GoalsPage, GoalForm) — those will be fixed in the next tasks.

**Step 4: Commit**

```bash
git add apps/frontend/src/types/index.ts
git commit -m "feat: add linkedAccountId, incomePeriod to Goal; calculatedProgress to EnhancedGoal"
```

---

## Task 7: GoalsPage — Use calculatedProgress and add progress source labels

**Files:**
- Modify: `apps/frontend/src/pages/GoalsPage.tsx`

**Step 1: Replace currentAmount with calculatedProgress in summary stats**

In `GoalsPage.tsx`, find line 75:
```typescript
const totalSaved = filteredGoals.reduce((sum, goal) => sum + goal.currentAmount, 0);
```

Replace with:
```typescript
const totalSaved = filteredGoals.reduce((sum, goal) => sum + (goal.calculatedProgress ?? 0), 0);
```

**Step 2: Replace currentAmount with calculatedProgress in the goal card amount display**

Find (around line 311):
```typescript
{formatCurrency(goal.currentAmount)}
```

Replace with:
```typescript
{goal.linkedAccountMissing
  ? '—'
  : formatCurrency(goal.calculatedProgress ?? 0)
}
```

**Step 3: Add a progress source label and deleted account warning**

Add a helper function at the top of the component (after the imports, before `export default`):

```typescript
function getProgressSourceLabel(goal: EnhancedGoal): string {
  switch (goal.type) {
    case 'savings':
    case 'investment':
    case 'net_worth':
      return 'Auto-tracked from accounts';
    case 'debt_payoff':
    case 'purchase':
      return goal.linkedAccountId
        ? 'Auto-tracked from account'
        : 'Manually tracked';
    case 'income':
      return goal.incomePeriod === 'year' ? 'Auto-tracked (this year)' : 'Auto-tracked (this month)';
    default:
      return 'Manually tracked';
  }
}
```

In each goal card, find the area just below the progress bar (after the milestone markers, around line 300) and add:

```tsx
{/* Progress source label */}
{goal.linkedAccountMissing ? (
  <p className="text-xs text-destructive mt-1">
    ⚠ Linked account not found — progress unavailable
  </p>
) : (
  <p className="text-xs text-muted-foreground mt-1">
    {getProgressSourceLabel(goal)}
  </p>
)}
```

**Step 4: Verify TypeScript compiles**

```bash
cd apps/frontend
npx tsc --noEmit
```

Expected: No errors.

**Step 5: Commit**

```bash
git add apps/frontend/src/pages/GoalsPage.tsx
git commit -m "feat: use calculatedProgress in GoalsPage; add progress source labels and missing account warning"
```

---

## Task 8: GoalForm — Add guided journey (guidance banner + account selector + income period)

**Files:**
- Modify: `apps/frontend/src/components/goals/GoalForm.tsx`

**Step 1: Add new fields to form state**

In `GoalFormState` interface (around line 35), add:
```typescript
  linkedAccountId: string;
  incomePeriod: 'month' | 'year';
  purchaseTrackingMode: 'account' | 'manual';
```

In `getInitialFormData()`, add:
```typescript
    linkedAccountId: goal?.linkedAccountId ?? '',
    incomePeriod: (goal?.incomePeriod as 'month' | 'year') ?? 'month',
    purchaseTrackingMode: goal?.linkedAccountId ? 'account' : 'manual',
```

**Step 2: Add accounts query and goal type guidance map**

At the top of the `GoalForm` component body (after the existing `useState` calls), add:

```typescript
  const { data: accountsData } = useQuery({
    queryKey: ['accounts'],
    queryFn: () => accountService.getAccounts(),
  });
  const accounts = accountsData?.accounts ?? [];
```

Add the import at the top of the file:
```typescript
import { accountService } from '../../services/account.service';
import { useQuery } from '@tanstack/react-query';
```

Add a constant (outside the component):

```typescript
const GOAL_TYPE_GUIDANCE: Record<GoalType, string> = {
  savings: 'Progress is automatically calculated from your savings and ISA account balances.',
  investment: 'Progress is automatically calculated from your investment account balances.',
  net_worth: 'Progress is automatically calculated as total assets minus all liabilities.',
  debt_payoff: 'Link the liability account you want to pay off. Progress updates automatically.',
  purchase: 'Link a dedicated account to track automatically, or log contributions manually.',
  income: 'Income transactions are automatically counted for the selected period.',
};
```

**Step 3: Add guidance banner to form JSX**

After the goal type `<select>` block (after line ~163), add:

```tsx
{/* Guidance banner */}
<div className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-800 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-200">
  {GOAL_TYPE_GUIDANCE[formData.type]}
</div>
```

**Step 4: Add debt_payoff account selector**

After the guidance banner, add:

```tsx
{/* Debt payoff: required liability account selector */}
{formData.type === 'debt_payoff' && (
  <div className="space-y-2">
    <Label htmlFor="linkedAccountId">
      Linked Account <span className="text-destructive">*</span>
    </Label>
    <select
      id="linkedAccountId"
      required
      value={formData.linkedAccountId}
      onChange={(e) => setFormData({ ...formData, linkedAccountId: e.target.value })}
      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      <option value="">Select the account to pay off...</option>
      {accounts
        .filter((a) => ['credit', 'loan', 'liability'].includes(a.type))
        .map((a) => (
          <option key={a.id} value={a.id}>
            {a.name} ({a.type.replace('_', ' ')})
          </option>
        ))}
    </select>
  </div>
)}

{/* Purchase: optional account link or manual tracking */}
{formData.type === 'purchase' && (
  <div className="space-y-3">
    <div className="flex gap-3">
      <button
        type="button"
        onClick={() => setFormData({ ...formData, purchaseTrackingMode: 'account', linkedAccountId: '' })}
        className={`flex-1 rounded-md border px-3 py-2 text-sm transition-colors ${
          formData.purchaseTrackingMode === 'account'
            ? 'border-primary bg-primary/10 text-primary'
            : 'border-input hover:bg-muted'
        }`}
      >
        Link an account
      </button>
      <button
        type="button"
        onClick={() => setFormData({ ...formData, purchaseTrackingMode: 'manual', linkedAccountId: '' })}
        className={`flex-1 rounded-md border px-3 py-2 text-sm transition-colors ${
          formData.purchaseTrackingMode === 'manual'
            ? 'border-primary bg-primary/10 text-primary'
            : 'border-input hover:bg-muted'
        }`}
      >
        Track manually
      </button>
    </div>
    {formData.purchaseTrackingMode === 'account' && (
      <div className="space-y-2">
        <Label htmlFor="linkedAccountIdPurchase">Linked Account</Label>
        <select
          id="linkedAccountIdPurchase"
          value={formData.linkedAccountId}
          onChange={(e) => setFormData({ ...formData, linkedAccountId: e.target.value })}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <option value="">Select account...</option>
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name} ({a.type.replace(/_/g, ' ')})
            </option>
          ))}
        </select>
      </div>
    )}
  </div>
)}

{/* Income: period selector */}
{formData.type === 'income' && (
  <div className="space-y-2">
    <Label>Income Period <span className="text-destructive">*</span></Label>
    <div className="flex gap-3">
      {(['month', 'year'] as const).map((period) => (
        <button
          key={period}
          type="button"
          onClick={() => setFormData({ ...formData, incomePeriod: period })}
          className={`flex-1 rounded-md border px-3 py-2 text-sm capitalize transition-colors ${
            formData.incomePeriod === period
              ? 'border-primary bg-primary/10 text-primary'
              : 'border-input hover:bg-muted'
          }`}
        >
          {period === 'month' ? 'Monthly' : 'Annually'}
        </button>
      ))}
    </div>
  </div>
)}
```

**Step 5: Include new fields in submit payload**

In `handleSubmit`, update the `CreateGoalInput` payload:
```typescript
    const submitData: CreateGoalInput = {
      name: formData.name,
      description: formData.description || undefined,
      type: formData.type,
      targetAmount: Number(formData.targetAmount),
      targetDate: formData.targetDate || undefined,
      priority: formData.priority,
      icon: formData.icon,
      linkedAccountId: formData.linkedAccountId || undefined,
      incomePeriod: formData.type === 'income' ? formData.incomePeriod : undefined,
    };
```

In the edit mode payload:
```typescript
      const submitData: UpdateGoalInput = {
        // ... existing fields ...
        linkedAccountId: formData.linkedAccountId || null,
        incomePeriod: formData.type === 'income' ? formData.incomePeriod : null,
      };
```

Also update the edit mode display text in GoalForm that shows `goal.currentAmount` (around line 209):
```tsx
{goal && goal.type === 'purchase' && !goal.linkedAccountId && (
  <p className="text-xs text-muted-foreground">
    Current progress: £{(goal.currentAmount ?? 0).toLocaleString('en-GB', { minimumFractionDigits: 2 })}
  </p>
)}
```

**Step 6: Verify TypeScript compiles**

```bash
cd apps/frontend
npx tsc --noEmit
```

Expected: No errors.

**Step 7: Commit**

```bash
git add apps/frontend/src/components/goals/GoalForm.tsx
git commit -m "feat: add guided journey to GoalForm (guidance banners, account selector, income period)"
```

---

## Task 9: End-to-End Verification

**Manual verification checklist:**

1. **Savings goal:**
   - Create a goal: type=`savings`, target=£1,000
   - Ensure you have savings/ISA accounts with combined balance of £400
   - Goal card should show 40% progress, label "Auto-tracked from accounts"

2. **Debt payoff goal:**
   - Create a goal: type=`debt_payoff`, target=£10,000, link a credit account with £6,000 balance
   - Goal card should show 40% progress (£4,000 paid off)

3. **Purchase goal (linked):**
   - Create a goal: type=`purchase`, target=£2,000, link account=savings pot with £500
   - Goal card should show 25% progress, label "Auto-tracked from account"

4. **Purchase goal (manual):**
   - Create a goal: type=`purchase`, target=£1,000, select "Track manually"
   - Add a £250 contribution
   - Goal card should show 25% progress, label "Manually tracked"

5. **Investment goal:**
   - Goal with type=`investment` should show sum of investment/ISA accounts

6. **Net worth goal:**
   - Goal with type=`net_worth` should show all assets minus liabilities

7. **Income goal (monthly):**
   - Create goal: type=`income`, target=£3,000, period=Monthly
   - Add income transactions totalling £1,500 this month
   - Goal should show 50% progress, label "Auto-tracked (this month)"

8. **Deleted account:**
   - Create a debt_payoff goal linked to an account, then delete the account
   - Goal card should show warning: "Linked account not found — progress unavailable"

9. **Security (cross-household):**
   - Via API: POST /api/goals with linkedAccountId from a different household
   - Should return 400 (ValidationError)

**Run backend tests:**

```bash
cd apps/backend
bun test
```

Expected: All tests pass.

**Run frontend type check:**

```bash
cd apps/frontend
npx tsc --noEmit
```

Expected: No errors.
