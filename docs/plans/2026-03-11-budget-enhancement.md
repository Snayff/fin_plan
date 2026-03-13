# Budget Enhancement: Committed & Discretionary Spend — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Enhance the budget system to auto-populate committed spend from recurring rules and add a separate discretionary spend section with frequency-based quick-add.

**Architecture:** Add a `BudgetItemType` enum (`committed | discretionary`) and four nullable fields to `BudgetItem` (itemType, recurringRuleId, entryFrequency, entryAmount). A new `POST /budgets/:id/items/batch` endpoint replaces N individual calls when importing recurring rules. The frontend splits the budget detail page into Committed and Discretionary sections, and BudgetForm gains a two-step create flow.

**Tech Stack:** Prisma + PostgreSQL (backend), Fastify routes, Zod schemas (`packages/shared`), React + TanStack Query + shadcn/ui (frontend), Bun test runner.

---

## Task 1: Database Migration

**Files:**
- Modify: `apps/backend/prisma/schema.prisma`

### Step 1: Add enum and fields to schema

In `apps/backend/prisma/schema.prisma`, add the enum **before** the `BudgetPeriod` enum (around line 458):

```prisma
enum BudgetItemType {
  committed
  discretionary
}
```

Add four fields to the `BudgetItem` model (after the `notes` field, before the `budget` relation):

```prisma
itemType        BudgetItemType  @default(committed) @map("item_type")
recurringRuleId String?         @map("recurring_rule_id")
entryFrequency  String?         @map("entry_frequency")
entryAmount     Decimal?        @map("entry_amount") @db.Decimal(15, 2)
recurringRule   RecurringRule?  @relation(fields: [recurringRuleId], references: [id], onDelete: SetNull)
```

Add back-relation to `RecurringRule` model (after the `transactions` relation):

```prisma
budgetItems BudgetItem[]
```

### Step 2: Run migration

```bash
cd apps/backend
npx prisma migrate dev --name enhance_budget_item_type
```

Expected: Migration file created in `prisma/migrations/`, Prisma client regenerated. You should see "Your database is now in sync with your schema."

### Step 3: Verify client types

```bash
npx prisma generate
```

Expected: `@prisma/client` now exports `BudgetItemType` enum with values `committed` and `discretionary`.

### Step 4: Commit

```bash
git add apps/backend/prisma/schema.prisma apps/backend/prisma/migrations/
git commit -m "feat(db): add BudgetItemType enum and fields to BudgetItem"
```

---

## Task 2: Shared Schemas

**Files:**
- Modify: `packages/shared/src/schemas/budget.schemas.ts`
- Modify: `packages/shared/src/schemas/index.ts`

### Step 1: Write failing test

Add to `apps/backend/src/services/budget.service.test.ts` (at the top of the file, in a new describe block):

```typescript
describe("addBudgetItemSchema validation", () => {
  it("accepts itemType field", () => {
    const { addBudgetItemSchema } = require('@finplan/shared');
    const result = addBudgetItemSchema.parse({
      categoryId: "00000000-0000-0000-0000-000000000001",
      allocatedAmount: 100,
      itemType: "committed",
    });
    expect(result.itemType).toBe("committed");
  });

  it("accepts batch schema with array of items", () => {
    const { addBudgetItemsBatchSchema } = require('@finplan/shared');
    const result = addBudgetItemsBatchSchema.parse({
      items: [
        { categoryId: "00000000-0000-0000-0000-000000000001", allocatedAmount: 100, itemType: "committed" },
      ],
    });
    expect(result.items).toHaveLength(1);
  });
});
```

### Step 2: Run test to verify it fails

```bash
cd apps/backend
bun test src/services/budget.service.test.ts
```

Expected: FAIL — `addBudgetItemSchema` does not have `itemType`, `addBudgetItemsBatchSchema` does not exist.

### Step 3: Update `budget.schemas.ts`

Replace the entire file at `packages/shared/src/schemas/budget.schemas.ts`:

```typescript
import { z } from 'zod';

export const BudgetPeriodEnum = z.enum(['monthly', 'quarterly', 'annual', 'custom']);

export const BudgetItemTypeEnum = z.enum(['committed', 'discretionary']);

export const createBudgetSchema = z.object({
  name: z.string().min(1, 'Budget name is required').max(200),
  period: BudgetPeriodEnum,
  startDate: z
    .string()
    .min(1, 'Start date is required')
    .or(z.date())
    .transform((val) => (typeof val === 'string' ? val : val.toISOString())),
  endDate: z
    .string()
    .min(1, 'End date is required')
    .or(z.date())
    .transform((val) => (typeof val === 'string' ? val : val.toISOString())),
});

export const updateBudgetSchema = z.object({
  name: z.string().min(1, 'Budget name cannot be empty').max(200).optional(),
  period: BudgetPeriodEnum.optional(),
  startDate: z
    .string()
    .or(z.date())
    .optional()
    .transform((val) => (val ? (typeof val === 'string' ? val : val.toISOString()) : undefined)),
  endDate: z
    .string()
    .or(z.date())
    .optional()
    .transform((val) => (val ? (typeof val === 'string' ? val : val.toISOString()) : undefined)),
  isActive: z.boolean().optional(),
});

export const addBudgetItemSchema = z.object({
  categoryId: z.string().uuid('Invalid category ID'),
  allocatedAmount: z.number({
    required_error: 'Allocated amount is required',
    invalid_type_error: 'Allocated amount must be a number',
  }).min(0, 'Allocated amount must be non-negative'),
  notes: z.string().max(500).optional(),
  itemType: BudgetItemTypeEnum.optional().default('committed'),
  recurringRuleId: z.string().uuid().nullable().optional(),
  entryFrequency: z.string().nullable().optional(),
  entryAmount: z.number().positive().nullable().optional(),
});

export const updateBudgetItemSchema = z.object({
  allocatedAmount: z.number().min(0, 'Allocated amount must be non-negative').optional(),
  notes: z.string().max(500).optional(),
});

export const addBudgetItemsBatchSchema = z.object({
  items: z.array(addBudgetItemSchema).min(1, 'At least one item required').max(50, 'Maximum 50 items per batch'),
});

export type BudgetPeriod = z.infer<typeof BudgetPeriodEnum>;
export type BudgetItemType = z.infer<typeof BudgetItemTypeEnum>;
export type CreateBudgetInput = z.infer<typeof createBudgetSchema>;
export type UpdateBudgetInput = z.infer<typeof updateBudgetSchema>;
export type AddBudgetItemInput = z.infer<typeof addBudgetItemSchema>;
export type UpdateBudgetItemInput = z.infer<typeof updateBudgetItemSchema>;
export type AddBudgetItemsBatchInput = z.infer<typeof addBudgetItemsBatchSchema>;
```

### Step 4: Update `packages/shared/src/schemas/index.ts`

In the budget section (around line 103), add exports for the new types:

```typescript
// Budget schemas and types
export {
  createBudgetSchema,
  updateBudgetSchema,
  addBudgetItemSchema,
  updateBudgetItemSchema,
  addBudgetItemsBatchSchema,
  BudgetPeriodEnum,
  BudgetItemTypeEnum,
  type BudgetPeriod,
  type BudgetItemType,
  type CreateBudgetInput,
  type UpdateBudgetInput,
  type AddBudgetItemInput,
  type UpdateBudgetItemInput,
  type AddBudgetItemsBatchInput,
} from './budget.schemas';
```

### Step 5: Run test to verify it passes

```bash
cd apps/backend
bun test src/services/budget.service.test.ts
```

Expected: PASS

### Step 6: Commit

```bash
git add packages/shared/src/schemas/budget.schemas.ts packages/shared/src/schemas/index.ts apps/backend/src/services/budget.service.test.ts
git commit -m "feat(shared): add BudgetItemType enum and batch schema"
```

---

## Task 3: Backend Service — addBudgetItem and updateBudgetItem

**Files:**
- Modify: `apps/backend/src/services/budget.service.ts`

### Step 1: Write failing tests

Add to the `describe("budgetService.addBudgetItem")` block in `budget.service.test.ts` (look for it around line 100+):

```typescript
it("saves itemType, recurringRuleId, entryFrequency, entryAmount when provided", async () => {
  const mockBudget = buildBudget({ householdId: "household-1" });
  const mockCategory = buildCategory({ type: "expense" });
  const mockItem = buildBudgetItem({
    itemType: "committed",
    recurringRuleId: "rule-1",
    entryFrequency: "monthly",
    entryAmount: new Decimal(1200),
  });

  prismaMock.budget.findFirst.mockResolvedValue(mockBudget as any);
  prismaMock.category.findUnique.mockResolvedValue(mockCategory as any);
  prismaMock.budgetItem.create.mockResolvedValue({
    ...mockItem,
    category: { id: mockCategory.id, name: mockCategory.name, color: null, icon: null },
  } as any);

  const result = await budgetService.addBudgetItem("budget-1", "household-1", {
    categoryId: mockCategory.id,
    allocatedAmount: 1200,
    itemType: "committed",
    recurringRuleId: "rule-1",
    entryFrequency: "monthly",
    entryAmount: 1200,
  });

  expect(prismaMock.budgetItem.create).toHaveBeenCalledWith(
    expect.objectContaining({
      data: expect.objectContaining({
        itemType: "committed",
        recurringRuleId: "rule-1",
        entryFrequency: "monthly",
        entryAmount: 1200,
      }),
    })
  );
  expect(result.itemType).toBe("committed");
});
```

Add to `describe("budgetService.updateBudgetItem")`:

```typescript
it("nulls out entryFrequency and entryAmount when allocatedAmount is manually updated", async () => {
  const mockItem = buildBudgetItem({
    itemType: "discretionary",
    entryFrequency: "weekly",
    entryAmount: new Decimal(100),
    budget: { householdId: "household-1" },
  });

  prismaMock.budgetItem.findUnique.mockResolvedValue(mockItem as any);
  prismaMock.budgetItem.update.mockResolvedValue({
    ...mockItem,
    allocatedAmount: new Decimal(500),
    entryFrequency: null,
    entryAmount: null,
    category: { id: "cat-1", name: "Groceries", color: null, icon: null },
  } as any);

  await budgetService.updateBudgetItem("item-1", "household-1", { allocatedAmount: 500 });

  expect(prismaMock.budgetItem.update).toHaveBeenCalledWith(
    expect.objectContaining({
      data: expect.objectContaining({
        entryFrequency: null,
        entryAmount: null,
      }),
    })
  );
});
```

### Step 2: Run to verify failure

```bash
cd apps/backend
bun test src/services/budget.service.test.ts
```

Expected: FAIL — `itemType` not in create data, `entryFrequency`/`entryAmount` not nulled on update.

### Step 3: Update service interfaces and methods

In `apps/backend/src/services/budget.service.ts`, update the interfaces and methods:

```typescript
import { prisma } from '../config/database';
import { BudgetItemType, BudgetPeriod } from '@prisma/client';
import { NotFoundError, ValidationError } from '../utils/errors';

export interface AddBudgetItemInput {
  categoryId: string;
  allocatedAmount: number;
  notes?: string;
  itemType?: BudgetItemType;
  recurringRuleId?: string | null;
  entryFrequency?: string | null;
  entryAmount?: number | null;
}

export interface UpdateBudgetItemInput {
  allocatedAmount?: number;
  notes?: string;
}
```

Update the `addBudgetItem` create call (replace the `prisma.budgetItem.create` call):

```typescript
const item = await prisma.budgetItem.create({
  data: {
    budgetId,
    categoryId: data.categoryId,
    allocatedAmount: data.allocatedAmount,
    notes: data.notes,
    itemType: data.itemType ?? 'committed',
    recurringRuleId: data.recurringRuleId ?? null,
    entryFrequency: data.entryFrequency ?? null,
    entryAmount: data.entryAmount ?? null,
  },
  include: {
    category: {
      select: { id: true, name: true, color: true, icon: true },
    },
  },
});
```

Update the `updateBudgetItem` prisma call to null out entry metadata when amount is manually changed:

```typescript
const updatedItem = await prisma.budgetItem.update({
  where: { id: itemId },
  data: {
    ...(data.allocatedAmount !== undefined && {
      allocatedAmount: data.allocatedAmount,
      // Null out frequency metadata — it's now stale (user overrode the calculated amount)
      entryFrequency: null,
      entryAmount: null,
    }),
    ...(data.notes !== undefined && { notes: data.notes }),
  },
  include: {
    category: {
      select: { id: true, name: true, color: true, icon: true },
    },
  },
});
```

Also update the return value in `addBudgetItem` to include new fields:

```typescript
return {
  ...item,
  allocatedAmount: Number(item.allocatedAmount),
  rolloverAmount: item.rolloverAmount ? Number(item.rolloverAmount) : null,
  entryAmount: item.entryAmount ? Number(item.entryAmount) : null,
};
```

Same for `updateBudgetItem` return:

```typescript
return {
  ...updatedItem,
  allocatedAmount: Number(updatedItem.allocatedAmount),
  rolloverAmount: updatedItem.rolloverAmount ? Number(updatedItem.rolloverAmount) : null,
  entryAmount: updatedItem.entryAmount ? Number(updatedItem.entryAmount) : null,
};
```

Also update the fixtures file `apps/backend/src/test/fixtures/index.ts` — extend `buildBudgetItem` to include new fields:

```typescript
export function buildBudgetItem(overrides: Record<string, any> = {}) {
  const id = nextId();
  return {
    id,
    budgetId: "budget-1",
    categoryId: "category-1",
    allocatedAmount: 500,
    carryover: false,
    rolloverAmount: null,
    notes: null,
    itemType: "committed" as const,
    recurringRuleId: null,
    entryFrequency: null,
    entryAmount: null,
    ...overrides,
  };
}
```

### Step 4: Run tests to verify pass

```bash
cd apps/backend
bun test src/services/budget.service.test.ts
```

Expected: PASS (all existing tests + new ones)

### Step 5: Commit

```bash
git add apps/backend/src/services/budget.service.ts apps/backend/src/test/fixtures/index.ts apps/backend/src/services/budget.service.test.ts
git commit -m "feat(budget): thread itemType and entry metadata through addBudgetItem/updateBudgetItem"
```

---

## Task 4: Backend Service — getBudgetWithTracking (include new fields + groupItemType)

**Files:**
- Modify: `apps/backend/src/services/budget.service.ts`

### Step 1: Write failing test

Add to `describe("budgetService.getBudgetWithTracking")` in `budget.service.test.ts`:

```typescript
it("includes itemType and recurringRuleId on items in categoryGroups", async () => {
  const mockBudget = buildBudget({ householdId: "household-1" });
  const mockItem = buildBudgetItem({
    categoryId: "cat-1",
    itemType: "committed",
    recurringRuleId: "rule-1",
    category: { id: "cat-1", name: "Utilities", color: null, icon: null },
  });
  prismaMock.budget.findFirst.mockResolvedValue({ ...mockBudget, budgetItems: [mockItem] } as any);
  prismaMock.transaction.findMany.mockResolvedValue([]);
  prismaMock.transaction.aggregate.mockResolvedValue({ _sum: { amount: null } } as any);

  const result = await budgetService.getBudgetWithTracking(mockBudget.id, "household-1");

  const group = result.categoryGroups[0];
  expect(group.items[0].itemType).toBe("committed");
  expect(group.items[0].recurringRuleId).toBe("rule-1");
  expect(group.groupItemType).toBe("committed");
});

it("sets groupItemType to 'discretionary' when all items are discretionary", async () => {
  const mockBudget = buildBudget({ householdId: "household-1" });
  const mockItem = buildBudgetItem({
    categoryId: "cat-1",
    itemType: "discretionary",
    category: { id: "cat-1", name: "Groceries", color: null, icon: null },
  });
  prismaMock.budget.findFirst.mockResolvedValue({ ...mockBudget, budgetItems: [mockItem] } as any);
  prismaMock.transaction.findMany.mockResolvedValue([]);
  prismaMock.transaction.aggregate.mockResolvedValue({ _sum: { amount: null } } as any);

  const result = await budgetService.getBudgetWithTracking(mockBudget.id, "household-1");

  expect(result.categoryGroups[0].groupItemType).toBe("discretionary");
});
```

### Step 2: Run to verify failure

```bash
cd apps/backend
bun test src/services/budget.service.test.ts
```

Expected: FAIL — `itemType`, `recurringRuleId`, `groupItemType` are undefined.

### Step 3: Update `getBudgetWithTracking`

In `budget.service.ts`, update the `categoryMap` type to include new item fields, and update the group building loop.

In the `budgetItems` include inside `prisma.budget.findFirst`, no changes needed — Prisma will include new fields automatically.

Update the item type in the `categoryMap` definition (find the `Map<string, { ... items: Array<{...}> }>` type around line 176):

```typescript
items: Array<{
  id: string;
  budgetId: string;
  categoryId: string;
  allocatedAmount: number;
  carryover: boolean;
  rolloverAmount: number | null;
  notes: string | null;
  itemType: string;
  recurringRuleId: string | null;
  entryFrequency: string | null;
  entryAmount: number | null;
  category: { id: string; name: string; color: string | null; icon: string | null };
}>;
```

Update the item push (around line 212) to include new fields:

```typescript
categoryMap.get(categoryId)!.items.push({
  ...item,
  allocatedAmount: Number(item.allocatedAmount),
  rolloverAmount: item.rolloverAmount ? Number(item.rolloverAmount) : null,
  entryAmount: item.entryAmount ? Number(item.entryAmount) : null,
  itemType: item.itemType,
  recurringRuleId: item.recurringRuleId,
  entryFrequency: item.entryFrequency,
});
```

Update the `categoryGroups` map (around line 220) to compute `groupItemType`:

```typescript
const categoryGroups = Array.from(categoryMap.values()).map((group) => {
  const allocated = group.items.reduce((sum, item) => sum + item.allocatedAmount, 0);
  const spent = spentByCategory.get(group.categoryId) || 0;
  const remaining = allocated - spent;
  const percentUsed = allocated > 0 ? (spent / allocated) * 100 : 0;

  // Determine the type of this group (all committed, all discretionary, or mixed)
  const types = new Set(group.items.map((item) => item.itemType));
  const groupItemType = types.size === 1 ? (types.values().next().value as 'committed' | 'discretionary') : 'mixed';

  return {
    ...group,
    allocated,
    spent,
    remaining,
    percentUsed: Math.min(percentUsed, 100),
    isOverBudget: spent > allocated,
    groupItemType,
  };
});
```

### Step 4: Run tests to verify pass

```bash
cd apps/backend
bun test src/services/budget.service.test.ts
```

Expected: PASS

### Step 5: Commit

```bash
git add apps/backend/src/services/budget.service.ts apps/backend/src/services/budget.service.test.ts
git commit -m "feat(budget): include itemType, recurringRuleId and groupItemType in getBudgetWithTracking"
```

---

## Task 5: Backend Service — addBudgetItemsBatch

**Files:**
- Modify: `apps/backend/src/services/budget.service.ts`

### Step 1: Write failing test

Add a new describe block in `budget.service.test.ts`:

```typescript
describe("budgetService.addBudgetItemsBatch", () => {
  it("creates multiple budget items in a transaction", async () => {
    const mockBudget = buildBudget({ householdId: "household-1" });
    const mockCategory = buildCategory({ type: "expense" });
    const mockItem1 = buildBudgetItem({ itemType: "committed", categoryId: mockCategory.id });
    const mockItem2 = buildBudgetItem({ itemType: "committed", categoryId: mockCategory.id });

    prismaMock.budget.findFirst.mockResolvedValue(mockBudget as any);
    prismaMock.category.findUnique.mockResolvedValue(mockCategory as any);
    prismaMock.$transaction.mockImplementation(async (cb: any) => cb(prismaMock));
    prismaMock.budgetItem.create
      .mockResolvedValueOnce({ ...mockItem1, category: { id: mockCategory.id, name: mockCategory.name, color: null, icon: null } } as any)
      .mockResolvedValueOnce({ ...mockItem2, category: { id: mockCategory.id, name: mockCategory.name, color: null, icon: null } } as any);

    const result = await budgetService.addBudgetItemsBatch("budget-1", "household-1", [
      { categoryId: mockCategory.id, allocatedAmount: 500, itemType: "committed" },
      { categoryId: mockCategory.id, allocatedAmount: 300, itemType: "committed" },
    ]);

    expect(result.items).toHaveLength(2);
    expect(prismaMock.budgetItem.create).toHaveBeenCalledTimes(2);
  });

  it("throws NotFoundError if budget does not belong to household", async () => {
    prismaMock.budget.findFirst.mockResolvedValue(null);

    await expect(
      budgetService.addBudgetItemsBatch("budget-1", "household-1", [
        { categoryId: "cat-1", allocatedAmount: 100, itemType: "committed" },
      ])
    ).rejects.toThrow("Budget not found");
  });
});
```

### Step 2: Run to verify failure

```bash
cd apps/backend
bun test src/services/budget.service.test.ts
```

Expected: FAIL — `addBudgetItemsBatch` does not exist.

### Step 3: Add `addBudgetItemsBatch` to service

Add this method to the `budgetService` object in `budget.service.ts` (after `addBudgetItem`):

```typescript
/**
 * Add multiple budget items in a single transaction (batch import from recurring rules)
 */
async addBudgetItemsBatch(budgetId: string, householdId: string, items: AddBudgetItemInput[]) {
  // Verify budget ownership once
  const budget = await prisma.budget.findFirst({
    where: { id: budgetId, householdId },
  });

  if (!budget) {
    throw new NotFoundError('Budget not found');
  }

  // Verify all categories are expense categories
  const categoryIds = [...new Set(items.map((item) => item.categoryId))];
  const categories = await prisma.category.findMany({
    where: { id: { in: categoryIds } },
  });

  const categoryMap = new Map(categories.map((c) => [c.id, c]));
  for (const item of items) {
    const category = categoryMap.get(item.categoryId);
    if (!category) throw new ValidationError(`Category ${item.categoryId} not found`);
    if (category.type !== 'expense') throw new ValidationError(`Category "${category.name}" must be an expense category`);
  }

  // Create all items in a single DB transaction
  const createdItems = await prisma.$transaction(
    items.map((item) =>
      prisma.budgetItem.create({
        data: {
          budgetId,
          categoryId: item.categoryId,
          allocatedAmount: item.allocatedAmount,
          notes: item.notes,
          itemType: item.itemType ?? 'committed',
          recurringRuleId: item.recurringRuleId ?? null,
          entryFrequency: item.entryFrequency ?? null,
          entryAmount: item.entryAmount ?? null,
        },
        include: {
          category: {
            select: { id: true, name: true, color: true, icon: true },
          },
        },
      })
    )
  );

  return {
    items: createdItems.map((item) => ({
      ...item,
      allocatedAmount: Number(item.allocatedAmount),
      rolloverAmount: item.rolloverAmount ? Number(item.rolloverAmount) : null,
      entryAmount: item.entryAmount ? Number(item.entryAmount) : null,
    })),
  };
},
```

### Step 4: Run tests to verify pass

```bash
cd apps/backend
bun test src/services/budget.service.test.ts
```

Expected: PASS

### Step 5: Commit

```bash
git add apps/backend/src/services/budget.service.ts apps/backend/src/services/budget.service.test.ts
git commit -m "feat(budget): add addBudgetItemsBatch service method"
```

---

## Task 6: Backend Route — Batch Endpoint

**Files:**
- Modify: `apps/backend/src/routes/budget.routes.ts`

### Step 1: Add the route

In `budget.routes.ts`, import the new schema and add the route **before** the existing `POST /budgets/:id/items` route (to avoid route conflict):

Add to imports:

```typescript
import {
  createBudgetSchema,
  updateBudgetSchema,
  addBudgetItemSchema,
  addBudgetItemsBatchSchema,
  updateBudgetItemSchema,
} from '@finplan/shared';
```

Add the new route (place it before the existing `POST /budgets/:id/items` handler):

```typescript
// Batch add items to a budget (used for importing recurring rules)
fastify.post('/budgets/:id/items/batch', { preHandler: [authMiddleware] }, async (request, reply) => {
  const householdId = request.householdId!;
  const { id } = request.params as { id: string };
  const validatedData = addBudgetItemsBatchSchema.parse(request.body);

  const result = await budgetService.addBudgetItemsBatch(id, householdId, validatedData.items);
  return reply.status(201).send(result);
});
```

### Step 2: Run all backend tests

```bash
cd apps/backend
bun test
```

Expected: All tests pass. No import or route registration errors.

### Step 3: Commit

```bash
git add apps/backend/src/routes/budget.routes.ts
git commit -m "feat(budget): add POST /budgets/:id/items/batch route"
```

---

## Task 7: Frontend Types

**Files:**
- Modify: `apps/frontend/src/types/index.ts`

### Step 1: Add shared type imports

At the top of `apps/frontend/src/types/index.ts`, add to the import block from `@finplan/shared`:

```typescript
BudgetItemType as SharedBudgetItemType,
AddBudgetItemsBatchInput as SharedAddBudgetItemsBatchInput,
```

Add re-exports after the existing budget type re-exports (around line 75):

```typescript
export type BudgetItemType = SharedBudgetItemType;
export type AddBudgetItemsBatchInput = SharedAddBudgetItemsBatchInput;
```

### Step 2: Extend `BudgetItem` interface

Replace the existing `BudgetItem` interface (around line 485) with:

```typescript
export interface BudgetItem {
  id: string;
  budgetId: string;
  categoryId: string;
  allocatedAmount: number;
  carryover: boolean;
  rolloverAmount: number | null;
  notes: string | null;
  itemType: BudgetItemType;
  recurringRuleId: string | null;
  entryFrequency: string | null;
  entryAmount: number | null;
  category: {
    id: string;
    name: string;
    color: string | null;
    icon: string | null;
  };
}
```

### Step 3: Extend `CategoryBudgetGroup` interface

Replace the existing `CategoryBudgetGroup` interface (around line 514):

```typescript
export interface CategoryBudgetGroup {
  categoryId: string;
  categoryName: string;
  categoryColor: string | null;
  categoryIcon: string | null;
  items: BudgetItem[];
  allocated: number;
  spent: number;
  remaining: number;
  percentUsed: number;
  isOverBudget: boolean;
  groupItemType: 'committed' | 'discretionary' | 'mixed';
}
```

### Step 4: Verify TypeScript compiles

```bash
cd apps/frontend
npx tsc --noEmit
```

Expected: No errors (or only pre-existing errors).

### Step 5: Commit

```bash
git add apps/frontend/src/types/index.ts
git commit -m "feat(frontend): extend BudgetItem and CategoryBudgetGroup types for committed/discretionary"
```

---

## Task 8: Frontend Utility — convertToPeriodTotal

**Files:**
- Modify: `apps/frontend/src/lib/utils.ts`

### Step 1: Add the utility function

Append to `apps/frontend/src/lib/utils.ts`:

```typescript
import type { BudgetPeriod, RecurringFrequency } from '../types';

const PERIOD_DAYS: Record<BudgetPeriod, number> = {
  monthly: 365.25 / 12,   // 30.4375
  quarterly: 365.25 / 4,  // 91.3125
  annual: 365.25,
  custom: 365.25 / 12,    // fallback — caller should use actual days for custom
};

const FREQUENCY_DAYS: Record<RecurringFrequency, number> = {
  daily: 1,
  weekly: 7,
  biweekly: 14,
  monthly: 365.25 / 12,
  quarterly: 365.25 / 4,
  annually: 365.25,
  custom: 1,  // fallback
};

/**
 * Convert a per-frequency amount to the equivalent budget period total.
 * E.g. £100/week in a monthly budget = £100 × (30.4375 / 7) = £434.82
 */
export function convertToPeriodTotal(
  amount: number,
  entryFrequency: RecurringFrequency,
  budgetPeriod: BudgetPeriod
): number {
  const periodDays = PERIOD_DAYS[budgetPeriod];
  const frequencyDays = FREQUENCY_DAYS[entryFrequency];
  return Math.round(amount * (periodDays / frequencyDays) * 100) / 100;
}

export const FREQUENCY_LABELS: Record<RecurringFrequency, string> = {
  daily: 'Daily',
  weekly: 'Weekly',
  biweekly: 'Fortnightly',
  monthly: 'Monthly',
  quarterly: 'Quarterly',
  annually: 'Annually',
  custom: 'Custom',
};
```

### Step 2: Verify TypeScript compiles

```bash
cd apps/frontend
npx tsc --noEmit
```

Expected: No new errors.

### Step 3: Commit

```bash
git add apps/frontend/src/lib/utils.ts
git commit -m "feat(frontend): add convertToPeriodTotal utility and FREQUENCY_LABELS"
```

---

## Task 9: Frontend Service — addBudgetItemsBatch

**Files:**
- Modify: `apps/frontend/src/services/budget.service.ts`

### Step 1: Add import and method

In `apps/frontend/src/services/budget.service.ts`, add to the existing imports:

```typescript
import type {
  CreateBudgetInput,
  UpdateBudgetInput,
  AddBudgetItemInput,
  AddBudgetItemsBatchInput,
  UpdateBudgetItemInput,
  BudgetSummary,
  EnhancedBudget,
  BudgetItem,
} from '../types';
```

Add a new response interface:

```typescript
interface BudgetItemsBatchResponse {
  items: BudgetItem[];
}
```

Add the new method to `budgetService`:

```typescript
/**
 * Batch add multiple items to a budget (used for importing recurring rules)
 */
async addBudgetItemsBatch(budgetId: string, data: AddBudgetItemsBatchInput): Promise<BudgetItemsBatchResponse> {
  return apiClient.post<BudgetItemsBatchResponse>(`/api/budgets/${budgetId}/items/batch`, data);
},
```

### Step 2: Verify TypeScript compiles

```bash
cd apps/frontend
npx tsc --noEmit
```

Expected: No new errors.

### Step 3: Commit

```bash
git add apps/frontend/src/services/budget.service.ts
git commit -m "feat(frontend): add addBudgetItemsBatch service method"
```

---

## Task 10: RecurringRulesStep Component (Budget Creation Step 2)

**Files:**
- Create: `apps/frontend/src/components/budgets/RecurringRulesStep.tsx`

This component renders inside the BudgetForm modal when a new budget is created. It shows active expense recurring rules as a checklist and fires a batch import on confirm.

### Step 1: Create the component

Create `apps/frontend/src/components/budgets/RecurringRulesStep.tsx`:

```tsx
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { recurringService } from '../../services/recurring.service';
import { categoryService } from '../../services/category.service';
import { budgetService } from '../../services/budget.service';
import { convertToPeriodTotal, formatCurrency, FREQUENCY_LABELS } from '../../lib/utils';
import { showError, showSuccess } from '../../lib/toast';
import type { BudgetPeriod, RecurringFrequency } from '../../types';
import { Button } from '../ui/button';

interface RecurringRulesStepProps {
  budgetId: string;
  budgetPeriod: BudgetPeriod;
  onComplete: () => void;
  onSkip: () => void;
}

export default function RecurringRulesStep({ budgetId, budgetPeriod, onComplete, onSkip }: RecurringRulesStepProps) {
  const queryClient = useQueryClient();
  const [selectedRuleIds, setSelectedRuleIds] = useState<Set<string>>(new Set());

  const { data: rulesData, isLoading: isLoadingRules } = useQuery({
    queryKey: ['recurring-rules'],
    queryFn: () => recurringService.getRecurringRules(),
  });

  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoryService.getCategories(),
  });

  // Filter to active expense recurring rules that have a categoryId
  const importableRules = (rulesData?.recurringRules ?? []).filter(
    (rule) =>
      rule.isActive &&
      rule.templateTransaction.type === 'expense' &&
      rule.templateTransaction.categoryId
  );

  const categoryMap = new Map(
    (categoriesData?.categories ?? []).map((c) => [c.id, c])
  );

  const importMutation = useMutation({
    mutationFn: () => {
      const selected = importableRules.filter((r) => selectedRuleIds.has(r.id));
      const items = selected.map((rule) => ({
        categoryId: rule.templateTransaction.categoryId!,
        allocatedAmount: convertToPeriodTotal(
          rule.templateTransaction.amount,
          rule.frequency as RecurringFrequency,
          budgetPeriod
        ),
        itemType: 'committed' as const,
        recurringRuleId: rule.id,
        entryFrequency: rule.frequency,
        entryAmount: rule.templateTransaction.amount,
      }));
      return budgetService.addBudgetItemsBatch(budgetId, { items });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      queryClient.invalidateQueries({ queryKey: ['budget', budgetId] });
      showSuccess('Recurring commitments imported successfully!');
      onComplete();
    },
    onError: (error: Error) => {
      showError(error.message || 'Failed to import recurring rules');
    },
  });

  const toggleRule = (ruleId: string) => {
    setSelectedRuleIds((prev) => {
      const next = new Set(prev);
      if (next.has(ruleId)) next.delete(ruleId);
      else next.add(ruleId);
      return next;
    });
  };

  const selectAll = () => setSelectedRuleIds(new Set(importableRules.map((r) => r.id)));
  const selectNone = () => setSelectedRuleIds(new Set());

  if (isLoadingRules) {
    return <div className="py-8 text-center text-muted-foreground">Loading recurring rules...</div>;
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">Import Regular Bills</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Select recurring expenses to add as committed spend in your budget.
          Amounts are converted to your budget period ({budgetPeriod}).
        </p>
      </div>

      {importableRules.length === 0 ? (
        <div className="py-6 text-center text-muted-foreground border border-dashed rounded-md">
          No active recurring expense rules found. You can add them later from the budget page.
        </div>
      ) : (
        <>
          <div className="flex gap-2 text-sm">
            <button type="button" onClick={selectAll} className="text-primary hover:underline">Select all</button>
            <span className="text-muted-foreground">·</span>
            <button type="button" onClick={selectNone} className="text-primary hover:underline">Clear</button>
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {importableRules.map((rule) => {
              const category = rule.templateTransaction.categoryId
                ? categoryMap.get(rule.templateTransaction.categoryId)
                : null;
              const periodTotal = convertToPeriodTotal(
                rule.templateTransaction.amount,
                rule.frequency as RecurringFrequency,
                budgetPeriod
              );
              const isSelected = selectedRuleIds.has(rule.id);

              return (
                <label
                  key={rule.id}
                  className={`flex items-start gap-3 p-3 rounded-md border cursor-pointer transition-colors ${
                    isSelected ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleRule(rule.id)}
                    className="mt-0.5"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {category && (
                        <span
                          className="inline-block h-2.5 w-2.5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: category.color || '#94a3b8' }}
                        />
                      )}
                      <span className="font-medium text-sm truncate">{rule.templateTransaction.name}</span>
                    </div>
                    {category && (
                      <p className="text-xs text-muted-foreground">{category.name}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatCurrency(rule.templateTransaction.amount)} / {FREQUENCY_LABELS[rule.frequency as RecurringFrequency] ?? rule.frequency}
                      {' '}
                      <span className="text-foreground font-medium">→ {formatCurrency(periodTotal)}</span>
                    </p>
                  </div>
                </label>
              );
            })}
          </div>
        </>
      )}

      <div className="flex justify-between pt-2">
        <Button type="button" variant="ghost" onClick={onSkip}>
          Skip
        </Button>
        <Button
          type="button"
          onClick={() => importMutation.mutate()}
          disabled={selectedRuleIds.size === 0 || importMutation.isPending}
        >
          {importMutation.isPending
            ? 'Importing...'
            : `Import ${selectedRuleIds.size > 0 ? `${selectedRuleIds.size} ` : ''}Selected`}
        </Button>
      </div>
    </div>
  );
}
```

### Step 2: Verify TypeScript compiles

```bash
cd apps/frontend
npx tsc --noEmit
```

Expected: No errors.

### Step 3: Commit

```bash
git add apps/frontend/src/components/budgets/RecurringRulesStep.tsx
git commit -m "feat(frontend): add RecurringRulesStep component for budget creation"
```

---

## Task 11: BudgetForm — Two-Step Create Flow

**Files:**
- Modify: `apps/frontend/src/components/budgets/BudgetForm.tsx`

### Step 1: Update BudgetForm

The form needs a `step` state that advances from `'details'` to `'recurring'` after a successful create, holding the new budget ID. Edit `BudgetForm.tsx`:

Add imports at the top:

```tsx
import { useNavigate } from 'react-router-dom';
import RecurringRulesStep from './RecurringRulesStep';
```

Add state (after existing `const [errors, ...]`):

```tsx
const navigate = useNavigate();
const [step, setStep] = useState<'details' | 'recurring'>('details');
const [createdBudgetId, setCreatedBudgetId] = useState<string | null>(null);
const [createdBudgetPeriod, setCreatedBudgetPeriod] = useState<BudgetPeriod>('monthly');
```

Replace the `submitMutation` `onSuccess` handler:

```tsx
onSuccess: (data) => {
  queryClient.invalidateQueries({ queryKey: ['budgets'] });
  if (budget?.id) {
    queryClient.invalidateQueries({ queryKey: ['budget', budget.id] });
  }

  if (isEditMode) {
    showSuccess('Budget updated successfully!');
    onSuccess?.();
    return;
  }

  // On create: advance to step 2 (recurring rules import)
  showSuccess('Budget created!');
  setCreatedBudgetId((data as any).budget.id);
  setCreatedBudgetPeriod(formData.period);
  setStep('recurring');
},
```

Wrap the return JSX to conditionally render step 2. Replace the `return (` block entirely:

```tsx
if (step === 'recurring' && createdBudgetId) {
  return (
    <RecurringRulesStep
      budgetId={createdBudgetId}
      budgetPeriod={createdBudgetPeriod}
      onComplete={() => {
        onSuccess?.();
        navigate(`/budget/${createdBudgetId}`);
      }}
      onSkip={() => {
        onSuccess?.();
        navigate(`/budget/${createdBudgetId}`);
      }}
    />
  );
}

return (
  // ... existing form JSX unchanged ...
);
```

### Step 2: Verify TypeScript compiles

```bash
cd apps/frontend
npx tsc --noEmit
```

Expected: No errors.

### Step 3: Manual test

- Start the dev server: `npm run dev` (from repo root or `apps/frontend`)
- Create a new budget → form completes → step 2 appears with recurring rule checklist
- Select rules → "Import Selected" → navigates to budget detail with committed items
- Create another budget → "Skip" → navigates to empty budget detail

### Step 4: Commit

```bash
git add apps/frontend/src/components/budgets/BudgetForm.tsx
git commit -m "feat(frontend): add two-step budget creation flow with recurring rules import"
```

---

## Task 12: ImportRecurringDialog Component

**Files:**
- Create: `apps/frontend/src/components/budgets/ImportRecurringDialog.tsx`

This dialog is shown from the budget detail page's Committed section header. It reuses the same checklist UI as `RecurringRulesStep` but shows only rules not already imported.

### Step 1: Create the component

Create `apps/frontend/src/components/budgets/ImportRecurringDialog.tsx`:

```tsx
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { recurringService } from '../../services/recurring.service';
import { categoryService } from '../../services/category.service';
import { budgetService } from '../../services/budget.service';
import { convertToPeriodTotal, formatCurrency, FREQUENCY_LABELS } from '../../lib/utils';
import { showError, showSuccess } from '../../lib/toast';
import type { BudgetPeriod, RecurringFrequency } from '../../types';
import { Button } from '../ui/button';
import Modal from '../ui/Modal';

interface ImportRecurringDialogProps {
  isOpen: boolean;
  onClose: () => void;
  budgetId: string;
  budgetPeriod: BudgetPeriod;
  existingRecurringRuleIds: Set<string>;
}

export default function ImportRecurringDialog({
  isOpen,
  onClose,
  budgetId,
  budgetPeriod,
  existingRecurringRuleIds,
}: ImportRecurringDialogProps) {
  const queryClient = useQueryClient();
  const [selectedRuleIds, setSelectedRuleIds] = useState<Set<string>>(new Set());

  const { data: rulesData, isLoading } = useQuery({
    queryKey: ['recurring-rules'],
    queryFn: () => recurringService.getRecurringRules(),
    enabled: isOpen,
  });

  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoryService.getCategories(),
    enabled: isOpen,
  });

  const importableRules = (rulesData?.recurringRules ?? []).filter(
    (rule) =>
      rule.isActive &&
      rule.templateTransaction.type === 'expense' &&
      rule.templateTransaction.categoryId &&
      !existingRecurringRuleIds.has(rule.id)
  );

  const categoryMap = new Map(
    (categoriesData?.categories ?? []).map((c) => [c.id, c])
  );

  const importMutation = useMutation({
    mutationFn: () => {
      const selected = importableRules.filter((r) => selectedRuleIds.has(r.id));
      const items = selected.map((rule) => ({
        categoryId: rule.templateTransaction.categoryId!,
        allocatedAmount: convertToPeriodTotal(
          rule.templateTransaction.amount,
          rule.frequency as RecurringFrequency,
          budgetPeriod
        ),
        itemType: 'committed' as const,
        recurringRuleId: rule.id,
        entryFrequency: rule.frequency,
        entryAmount: rule.templateTransaction.amount,
      }));
      return budgetService.addBudgetItemsBatch(budgetId, { items });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budget', budgetId] });
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      showSuccess('Recurring commitments imported!');
      setSelectedRuleIds(new Set());
      onClose();
    },
    onError: (error: Error) => {
      showError(error.message || 'Failed to import');
    },
  });

  const toggleRule = (ruleId: string) => {
    setSelectedRuleIds((prev) => {
      const next = new Set(prev);
      if (next.has(ruleId)) next.delete(ruleId);
      else next.add(ruleId);
      return next;
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Import Regular Bills">
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Add recurring expense rules as committed spend. Amounts are converted to {budgetPeriod} totals.
        </p>

        {isLoading ? (
          <div className="py-6 text-center text-muted-foreground">Loading...</div>
        ) : importableRules.length === 0 ? (
          <div className="py-6 text-center text-muted-foreground border border-dashed rounded-md">
            All active recurring expense rules are already included in this budget.
          </div>
        ) : (
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {importableRules.map((rule) => {
              const category = rule.templateTransaction.categoryId
                ? categoryMap.get(rule.templateTransaction.categoryId)
                : null;
              const periodTotal = convertToPeriodTotal(
                rule.templateTransaction.amount,
                rule.frequency as RecurringFrequency,
                budgetPeriod
              );
              const isSelected = selectedRuleIds.has(rule.id);

              return (
                <label
                  key={rule.id}
                  className={`flex items-start gap-3 p-3 rounded-md border cursor-pointer transition-colors ${
                    isSelected ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleRule(rule.id)}
                    className="mt-0.5"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {category && (
                        <span
                          className="inline-block h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: category.color || '#94a3b8' }}
                        />
                      )}
                      <span className="font-medium text-sm truncate">{rule.templateTransaction.name}</span>
                    </div>
                    {category && <p className="text-xs text-muted-foreground">{category.name}</p>}
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatCurrency(rule.templateTransaction.amount)} / {FREQUENCY_LABELS[rule.frequency as RecurringFrequency] ?? rule.frequency}
                      {' '}<span className="text-foreground font-medium">→ {formatCurrency(periodTotal)}</span>
                    </p>
                  </div>
                </label>
              );
            })}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            onClick={() => importMutation.mutate()}
            disabled={selectedRuleIds.size === 0 || importMutation.isPending}
          >
            {importMutation.isPending ? 'Importing...' : `Import ${selectedRuleIds.size > 0 ? selectedRuleIds.size : ''} Selected`}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
```

### Step 2: Verify TypeScript compiles

```bash
cd apps/frontend
npx tsc --noEmit
```

Expected: No errors.

### Step 3: Commit

```bash
git add apps/frontend/src/components/budgets/ImportRecurringDialog.tsx
git commit -m "feat(frontend): add ImportRecurringDialog for budget detail page"
```

---

## Task 13: BudgetDetailPage — Committed & Discretionary Sections + Quick-Add

**Files:**
- Modify: `apps/frontend/src/pages/BudgetDetailPage.tsx`

This is the largest change. Replace the single "Category Groups" section with two named sections, add the discretionary quick-add row, and wire up the ImportRecurringDialog.

### Step 1: Add new imports and state

At the top of `BudgetDetailPage.tsx`, add imports:

```tsx
import ImportRecurringDialog from '../components/budgets/ImportRecurringDialog';
import { convertToPeriodTotal, FREQUENCY_LABELS } from '../lib/utils';
import type { RecurringFrequency } from '../types';
```

Add new state (after the existing state declarations):

```tsx
const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);

// Discretionary quick-add state
const [discretionaryCategoryId, setDiscretionaryCategoryId] = useState('');
const [discretionaryAmount, setDiscretionaryAmount] = useState('');
const [discretionaryFrequency, setDiscretionaryFrequency] = useState<RecurringFrequency>('monthly');
```

### Step 2: Add computed values (after the existing `availableCategories` useMemo)

```tsx
// Split category groups into committed and discretionary sections
const committedGroups = useMemo(
  () => (budget?.categoryGroups ?? []).filter((g) => g.groupItemType !== 'discretionary'),
  [budget?.categoryGroups]
);

const discretionaryGroups = useMemo(
  () => (budget?.categoryGroups ?? []).filter((g) => g.groupItemType === 'discretionary'),
  [budget?.categoryGroups]
);

// Set of recurringRuleIds already in this budget (for ImportRecurringDialog deduplication)
const existingRecurringRuleIds = useMemo(
  () =>
    new Set(
      (budget?.categoryGroups ?? [])
        .flatMap((g) => g.items)
        .map((item) => item.recurringRuleId)
        .filter((id): id is string => id !== null)
    ),
  [budget?.categoryGroups]
);

// Computed live preview of period total for discretionary quick-add
const discretionaryPreview = useMemo(() => {
  const amount = Number(discretionaryAmount);
  if (!amount || !discretionaryCategoryId) return null;
  return convertToPeriodTotal(amount, discretionaryFrequency, budget?.period ?? 'monthly');
}, [discretionaryAmount, discretionaryFrequency, discretionaryCategoryId, budget?.period]);
```

### Step 3: Add discretionary add handler

Add alongside the existing `handleAddItem`:

```tsx
const handleAddDiscretionaryItem = () => {
  if (!discretionaryCategoryId) {
    showError('Please select a category');
    return;
  }
  const amount = Number(discretionaryAmount);
  if (!Number.isFinite(amount) || amount <= 0) {
    showError('Please enter a valid amount');
    return;
  }
  const periodTotal = convertToPeriodTotal(amount, discretionaryFrequency, budget?.period ?? 'monthly');
  addItemMutation.mutate({
    categoryId: discretionaryCategoryId,
    allocatedAmount: periodTotal,
    itemType: 'discretionary',
    entryFrequency: discretionaryFrequency,
    entryAmount: amount,
  });
  // Reset quick-add state on success (handled in addItemMutation.onSuccess)
};
```

Update `addItemMutation.onSuccess` to also reset discretionary state:

```tsx
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: ['budget', budgetId] });
  queryClient.invalidateQueries({ queryKey: ['budgets'] });
  showSuccess('Budget item added successfully!');
  setAddingCategoryId(null);
  setAddAmount('');
  setAddNotes('');
  // Reset discretionary quick-add
  setDiscretionaryCategoryId('');
  setDiscretionaryAmount('');
  setDiscretionaryFrequency('monthly');
},
```

### Step 4: Replace the "Category Groups" section in JSX

Replace the `<section>` block titled "Category Groups" (around line 352) with two sections. Keep the existing category card rendering logic — just split it into two sections with the committed section getting an "Import Recurring" button:

```tsx
{/* COMMITTED SPEND SECTION */}
<section className="space-y-4">
  <div className="flex items-center justify-between">
    <h2 className="text-2xl font-semibold text-foreground">Committed Spend</h2>
    <Button variant="outline" size="sm" onClick={() => setIsImportDialogOpen(true)}>
      Import Regular Bills
    </Button>
  </div>

  {committedGroups.length === 0 ? (
    <Card>
      <CardContent className="p-6 text-center space-y-3">
        <p className="text-muted-foreground">No committed spend yet.</p>
        <Button variant="outline" size="sm" onClick={() => setIsImportDialogOpen(true)}>
          Import from recurring rules
        </Button>
      </CardContent>
    </Card>
  ) : (
    <div className="space-y-4">
      {committedGroups.map((group) => renderCategoryGroup(group))}
    </div>
  )}
</section>

{/* DISCRETIONARY SPEND SECTION */}
<section className="space-y-4">
  <h2 className="text-2xl font-semibold text-foreground">Discretionary Spend</h2>

  {/* Quick-add row */}
  <Card>
    <CardContent className="p-4 space-y-3">
      <p className="text-sm font-medium text-foreground">Add discretionary spend</p>
      <div className="grid gap-2 grid-cols-1 sm:grid-cols-[1fr_100px_130px_auto]">
        <select
          value={discretionaryCategoryId}
          onChange={(e) => setDiscretionaryCategoryId(e.target.value)}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <option value="">Select category...</option>
          {expenseCategories.map((cat) => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>

        <div className="relative">
          <span className="absolute left-3 top-2 text-muted-foreground">£</span>
          <Input
            type="number"
            min="0"
            step="0.01"
            value={discretionaryAmount}
            onChange={(e) => setDiscretionaryAmount(e.target.value)}
            className="pl-8"
            placeholder="0.00"
          />
        </div>

        <select
          value={discretionaryFrequency}
          onChange={(e) => setDiscretionaryFrequency(e.target.value as RecurringFrequency)}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          {(['weekly', 'biweekly', 'monthly', 'quarterly', 'annually'] as RecurringFrequency[]).map((freq) => (
            <option key={freq} value={freq}>{FREQUENCY_LABELS[freq]}</option>
          ))}
        </select>

        <Button
          onClick={handleAddDiscretionaryItem}
          disabled={addItemMutation.isPending || !discretionaryCategoryId || !discretionaryAmount}
        >
          Add
        </Button>
      </div>

      {discretionaryPreview !== null && (
        <p className="text-sm text-muted-foreground">
          → <span className="font-medium text-foreground">{formatCurrency(discretionaryPreview)}</span> per {budget?.period ?? 'month'}
        </p>
      )}
    </CardContent>
  </Card>

  {discretionaryGroups.length > 0 && (
    <div className="space-y-4">
      {discretionaryGroups.map((group) => renderCategoryGroup(group))}
    </div>
  )}
</section>
```

### Step 5: Extract `renderCategoryGroup` helper

To avoid duplicating the category group card JSX (which is currently inline in the map), extract it into a function above the `return` statement:

```tsx
const renderCategoryGroup = (group: typeof budget.categoryGroups[0]) => (
  <Card key={group.categoryId}>
    <CardContent className="p-6 space-y-4">
      {/* ... exact same JSX as the current group.map() callback ... */}
      {/* Include the stale indicator logic here — see Task 14 */}
    </CardContent>
  </Card>
);
```

For now, copy the existing category card JSX verbatim. The stale indicator will be added in Task 14.

### Step 6: Add ImportRecurringDialog to JSX

Add before the closing `</div>` of the page (alongside the existing `<Modal>` and `<ConfirmDialog>`):

```tsx
{budget && (
  <ImportRecurringDialog
    isOpen={isImportDialogOpen}
    onClose={() => setIsImportDialogOpen(false)}
    budgetId={budgetId}
    budgetPeriod={budget.period}
    existingRecurringRuleIds={existingRecurringRuleIds}
  />
)}
```

### Step 7: Verify TypeScript compiles

```bash
cd apps/frontend
npx tsc --noEmit
```

Expected: No errors.

### Step 8: Manual test

- Open an existing budget → see "Committed Spend" and "Discretionary Spend" sections
- Click "Import Regular Bills" → ImportRecurringDialog opens, shows unimported rules
- Add a discretionary item → select category + amount + weekly → preview shows period total → click Add → item appears in Discretionary section with sub-label
- Verify "Available Categories" section still appears below

### Step 9: Commit

```bash
git add apps/frontend/src/pages/BudgetDetailPage.tsx
git commit -m "feat(frontend): split budget detail into Committed/Discretionary sections with quick-add"
```

---

## Task 14: Stale Rule Indicator on Committed Items

**Files:**
- Modify: `apps/frontend/src/pages/BudgetDetailPage.tsx`

When a recurring rule's amount has changed since a committed item was imported, show a yellow "Rule updated" badge with a Sync button on that item row.

### Step 1: Fetch recurring rules on budget detail page

In `BudgetDetailPage.tsx`, add a query for recurring rules (after the existing categories query):

```tsx
const { data: recurringRulesData } = useQuery({
  queryKey: ['recurring-rules'],
  queryFn: () => recurringService.getRecurringRules(),
});
```

Add import at top:

```tsx
import { recurringService } from '../services/recurring.service';
```

### Step 2: Build a map of rule ID → computed period total

Add inside `BudgetDetailPage` (before the return):

```tsx
// Map of ruleId → expected period total (for stale detection)
const ruleExpectedAmounts = useMemo(() => {
  const map = new Map<string, number>();
  if (!budget || !recurringRulesData?.recurringRules) return map;
  for (const rule of recurringRulesData.recurringRules) {
    map.set(
      rule.id,
      convertToPeriodTotal(
        rule.templateTransaction.amount,
        rule.frequency as RecurringFrequency,
        budget.period
      )
    );
  }
  return map;
}, [recurringRulesData?.recurringRules, budget?.period]);
```

### Step 3: Add syncItemMutation

```tsx
const syncItemMutation = useMutation({
  mutationFn: ({ itemId, allocatedAmount, entryAmount, entryFrequency }: {
    itemId: string;
    allocatedAmount: number;
    entryAmount: number;
    entryFrequency: string;
  }) =>
    budgetService.updateBudgetItem(budgetId, itemId, { allocatedAmount }),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['budget', budgetId] });
    queryClient.invalidateQueries({ queryKey: ['budgets'] });
    showSuccess('Budget item synced with recurring rule!');
  },
  onError: (error: Error) => {
    showError(error.message || 'Failed to sync item');
  },
});
```

### Step 4: Add stale indicator to item rows in `renderCategoryGroup`

Inside the item row rendering (the non-editing state, inside the `group.items.map()`), add stale detection and badge. After the existing `{formatCurrency(item.allocatedAmount)}` display, add:

```tsx
{/* Stale rule indicator — only show for committed items with a linked rule and non-null entryFrequency */}
{(() => {
  if (!item.recurringRuleId || item.entryFrequency === null) return null;
  const expected = ruleExpectedAmounts.get(item.recurringRuleId);
  if (expected === undefined) return null;
  const isStale = Math.abs(expected - item.allocatedAmount) > 0.01;
  if (!isStale) return null;

  return (
    <div className="flex items-center gap-1 mt-1">
      <span className="inline-flex items-center rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800">
        Rule updated
      </span>
      <Button
        variant="ghost"
        size="sm"
        className="h-6 px-2 text-xs text-yellow-700 hover:text-yellow-900"
        onClick={() =>
          syncItemMutation.mutate({
            itemId: item.id,
            allocatedAmount: expected,
            entryAmount: ruleExpectedAmounts.get(item.recurringRuleId!)!,
            entryFrequency: item.entryFrequency!,
          })
        }
        disabled={syncItemMutation.isPending}
      >
        Sync
      </Button>
    </div>
  );
})()}
```

Also add sub-label for discretionary items (showing original entry frequency/amount). In the same item row, after the stale indicator block:

```tsx
{/* Entry metadata sub-label for discretionary items */}
{item.entryFrequency && item.entryAmount && item.itemType === 'discretionary' && (
  <p className="text-xs text-muted-foreground mt-0.5">
    {formatCurrency(item.entryAmount)} / {FREQUENCY_LABELS[item.entryFrequency as RecurringFrequency] ?? item.entryFrequency}
  </p>
)}
```

### Step 5: Verify TypeScript compiles

```bash
cd apps/frontend
npx tsc --noEmit
```

Expected: No errors.

### Step 6: Manual test

- Edit a recurring rule amount in the Recurring Rules page
- Go to a budget that has a committed item linked to that rule
- Verify the yellow "Rule updated" badge appears
- Click "Sync" → badge disappears, amount updates
- For discretionary items, verify "£100 / Weekly" sub-label appears under the item

### Step 7: Commit

```bash
git add apps/frontend/src/pages/BudgetDetailPage.tsx
git commit -m "feat(frontend): add stale rule indicator and discretionary sub-label to budget items"
```

---

## Final: Run All Tests

```bash
cd apps/backend
bun test
```

Expected: All existing and new tests pass.

---

## Verification Checklist

- [ ] Create a budget → step 2 shows recurring rules checklist → select rules → batch imported as committed items
- [ ] Skip import on create → budget detail loads → Committed section shows empty state with "Import Regular Bills" nudge
- [ ] Import Regular Bills on existing budget → dialog shows only unimported rules → batch imports
- [ ] Add discretionary item → £100/week → live preview → add → appears in Discretionary section with "£100 / Weekly" sub-label
- [ ] Inline edit a committed item's amount → sub-label disappears (entryFrequency nulled)
- [ ] Edit a recurring rule amount → return to budget detail → "Rule updated" badge on linked item → Sync → badge gone
- [ ] Budget totalAllocated includes both committed and discretionary items (no regressions)
- [ ] Delete a recurring rule → budget item `recurringRuleId` goes null (SetNull) → item remains, no badge
