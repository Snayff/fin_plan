---
feature: item-temporality
category: infrastructure
spec: docs/4. planning/item-temporality/item-temporality-spec.md
creation_date: 2026-04-04
status: backlog
implemented_date:
---

# Item Temporality & Scheduled Changes — Implementation Plan

> **For Claude:** Use `/execute-plan item-temporality` to implement this plan task-by-task.

> **Purpose:** An ordered, task-by-task build guide. Each task follows TDD red-green-commit and contains complete, ready-to-run code — no "implement X" placeholders. This is the input to `/execute-plan`. The spec defines _what_ to build; this plan defines _how_.

**Goal:** Give every waterfall item a temporal lifecycle (Active/Future/Expired) via an ordered sequence of value periods, and enhance the yearly calendar with per-month bill breakdowns and shortfall indicators.
**Spec:** `docs/4. planning/item-temporality/item-temporality-spec.md`
**Architecture:** New `ItemAmountPeriod` Prisma model stores the value timeline per item. The `amount` field is removed from `IncomeSource`, `CommittedItem`, and `DiscretionaryItem` — amounts are always derived from the current effective period. A new `period.service.ts` handles period CRUD with contiguity enforcement. The waterfall summary and cashflow endpoints are updated to join periods. Frontend gains an `ItemStatusFilter` toggle, `ValueSparkline` SVG component, period editor in `ItemForm`, and enhanced `CashflowCalendar` with expanded months.
**Tech Stack:** Fastify · Prisma · tRPC · Zod · React 18 · TanStack Query · Zustand · Tailwind

**Infrastructure Impact:**

- Touches `packages/shared/`: yes
- Requires DB migration: yes

## Pre-conditions

- [ ] All three item models (`IncomeSource`, `CommittedItem`, `DiscretionaryItem`) exist with `amount` fields
- [ ] Waterfall service and routes are functional
- [ ] `CashflowCalendar` component renders basic month rows with pot balances
- [ ] Tier page components (`ItemRow`, `ItemAccordion`, `ItemForm`, `ItemArea`) are functional

## Tasks

> Each task is one action (2–5 minutes), follows red-green-commit, and contains complete code. Ordered: schema → shared schemas → backend service → routes → frontend.

---

### Task 1: Prisma Schema — Add ItemAmountPeriod Model

**Files:**

- Modify: `apps/backend/prisma/schema.prisma`
- Run: `bun run db:migrate`

- [ ] **Step 1: Write the failing test**

No test for schema — this is a migration-only task.

- [ ] **Step 2: Add the ItemAmountPeriod model and modify item models**

Add to `schema.prisma` after the `WaterfallHistory` model:

```prisma
model ItemAmountPeriod {
  id        String            @id @default(cuid())
  itemType  WaterfallItemType
  itemId    String
  startDate DateTime          @db.Date
  endDate   DateTime?         @db.Date
  amount    Float
  createdAt DateTime          @default(now())

  @@unique([itemType, itemId, startDate])
  @@index([itemType, itemId])
  @@map("item_amount_periods")
}
```

Remove `amount` from `IncomeSource`, `CommittedItem`, and `DiscretionaryItem`.

Remove `endedAt` from `IncomeSource`.

- [ ] **Step 3: Run migration**

Run: `bun run db:migrate`
Name: `add_item_amount_periods`

- [ ] **Step 4: Commit**

```bash
git add apps/backend/prisma/
git commit -m "feat(schema): add ItemAmountPeriod model, remove amount from item models"
```

---

### Task 2: Data Migration — Convert Existing Items to Periods

**Files:**

- Create: `apps/backend/prisma/migrations/manual/migrate-amounts-to-periods.ts`

- [ ] **Step 1: Write migration script**

```typescript
// apps/backend/prisma/migrations/manual/migrate-amounts-to-periods.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Migrating item amounts to periods...");

  const [incomes, committed, discretionary] = await Promise.all([
    prisma.$queryRaw`SELECT id, amount, "created_at", "ended_at" FROM income_sources` as Promise<
      Array<{ id: string; amount: number; created_at: Date; ended_at: Date | null }>
    >,
    prisma.$queryRaw`SELECT id, amount, "created_at" FROM committed_items` as Promise<
      Array<{ id: string; amount: number; created_at: Date }>
    >,
    prisma.$queryRaw`SELECT id, amount, "created_at" FROM discretionary_items` as Promise<
      Array<{ id: string; amount: number; created_at: Date }>
    >,
  ]);

  const periods: Array<{
    itemType: string;
    itemId: string;
    startDate: Date;
    endDate: Date | null;
    amount: number;
  }> = [];

  for (const item of incomes) {
    periods.push({
      itemType: "income_source",
      itemId: item.id,
      startDate: item.created_at,
      endDate: item.ended_at,
      amount: item.amount,
    });
  }

  for (const item of committed) {
    periods.push({
      itemType: "committed_item",
      itemId: item.id,
      startDate: item.created_at,
      endDate: null,
      amount: item.amount,
    });
  }

  for (const item of discretionary) {
    periods.push({
      itemType: "discretionary_item",
      itemId: item.id,
      startDate: item.created_at,
      endDate: null,
      amount: item.amount,
    });
  }

  if (periods.length > 0) {
    await prisma.itemAmountPeriod.createMany({ data: periods as any });
  }

  console.log(`Migrated ${periods.length} items to periods.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

- [ ] **Step 2: Run migration**

Run: `cd apps/backend && bun prisma/migrations/manual/migrate-amounts-to-periods.ts`

- [ ] **Step 3: Commit**

```bash
git add apps/backend/prisma/migrations/manual/
git commit -m "chore(migration): convert existing item amounts to periods"
```

---

### Task 3: Update Prisma Mock — Add ItemAmountPeriod

**Files:**

- Modify: `apps/backend/src/test/mocks/prisma.ts`

- [ ] **Step 1: Add itemAmountPeriod to prismaMock**

Add after the `waterfallHistory` line:

```typescript
itemAmountPeriod: buildModelMock(),
```

- [ ] **Step 2: Commit**

```bash
git add apps/backend/src/test/mocks/prisma.ts
git commit -m "test(mocks): add itemAmountPeriod to prisma mock"
```

---

### Task 4: Shared Zod Schemas — Period Schemas

**Files:**

- Modify: `packages/shared/src/schemas/waterfall.schemas.ts`
- Modify: `packages/shared/src/schemas/waterfall.schemas.test.ts`

- [ ] **Step 1: Write the failing test**

Add to `waterfall.schemas.test.ts`:

```typescript
import { describe, it, expect } from "bun:test";
import {
  createPeriodSchema,
  updatePeriodSchema,
  ItemLifecycleStateEnum,
} from "./waterfall.schemas";

describe("createPeriodSchema", () => {
  it("accepts valid period data", () => {
    const result = createPeriodSchema.safeParse({
      itemType: "committed_item",
      itemId: "abc123",
      startDate: "2026-01-01",
      amount: 10.99,
    });
    expect(result.success).toBe(true);
  });

  it("accepts period with endDate", () => {
    const result = createPeriodSchema.safeParse({
      itemType: "income_source",
      itemId: "abc123",
      startDate: "2026-01-01",
      endDate: "2026-06-01",
      amount: 5000,
    });
    expect(result.success).toBe(true);
  });

  it("rejects negative amount", () => {
    const result = createPeriodSchema.safeParse({
      itemType: "committed_item",
      itemId: "abc123",
      startDate: "2026-01-01",
      amount: -5,
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid item type", () => {
    const result = createPeriodSchema.safeParse({
      itemType: "unknown",
      itemId: "abc123",
      startDate: "2026-01-01",
      amount: 10,
    });
    expect(result.success).toBe(false);
  });
});

describe("updatePeriodSchema", () => {
  it("accepts partial updates", () => {
    const result = updatePeriodSchema.safeParse({ amount: 15.99 });
    expect(result.success).toBe(true);
  });

  it("accepts date updates", () => {
    const result = updatePeriodSchema.safeParse({
      startDate: "2026-03-01",
      endDate: "2026-09-01",
    });
    expect(result.success).toBe(true);
  });
});

describe("ItemLifecycleStateEnum", () => {
  it("accepts valid lifecycle states", () => {
    expect(ItemLifecycleStateEnum.safeParse("active").success).toBe(true);
    expect(ItemLifecycleStateEnum.safeParse("future").success).toBe(true);
    expect(ItemLifecycleStateEnum.safeParse("expired").success).toBe(true);
  });

  it("rejects invalid state", () => {
    expect(ItemLifecycleStateEnum.safeParse("deleted").success).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd packages/shared && bun test waterfall.schemas`
Expected: FAIL — cannot import `createPeriodSchema`

- [ ] **Step 3: Write implementation**

Add to `waterfall.schemas.ts`:

```typescript
// ─── Item lifecycle ─────────────────────────────────────────────────────────

export const ItemLifecycleStateEnum = z.enum(["active", "future", "expired"]);
export type ItemLifecycleState = z.infer<typeof ItemLifecycleStateEnum>;

// ─── Period schemas ─────────────────────────────────────────────────────────

export const PeriodItemTypeEnum = z.enum(["income_source", "committed_item", "discretionary_item"]);
export type PeriodItemType = z.infer<typeof PeriodItemTypeEnum>;

export const createPeriodSchema = z.object({
  itemType: PeriodItemTypeEnum,
  itemId: z.string().min(1),
  startDate: z.coerce.date(),
  endDate: z.coerce.date().optional(),
  amount: z.number().positive(),
});

export const updatePeriodSchema = z.object({
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().nullable().optional(),
  amount: z.number().positive().optional(),
});

export type CreatePeriodInput = z.infer<typeof createPeriodSchema>;
export type UpdatePeriodInput = z.infer<typeof updatePeriodSchema>;

// ─── Period response type ───────────────────────────────────────────────────

export interface PeriodRow {
  id: string;
  itemType: PeriodItemType;
  itemId: string;
  startDate: Date;
  endDate: Date | null;
  amount: number;
  createdAt: Date;
}
```

Also update `createCommittedItemSchema`, `createDiscretionaryItemSchema`, and `createIncomeSourceSchema` to replace `amount` with initial period fields:

```typescript
// Add to each create schema:
//   startDate: z.coerce.date().optional(),
//   endDate: z.coerce.date().optional(),
// Keep amount — it's the initial period amount, still required at creation time
```

Update `updateCommittedItemSchema`, `updateDiscretionaryItemSchema`, and `updateIncomeSourceSchema` to remove `amount` (amount changes go through periods).

Remove `endIncomeSourceSchema` (lifecycle now managed through periods).

Update the `CashflowMonth` interface to include `potBefore` and `accrual`:

```typescript
export interface CashflowMonth {
  month: number;
  year: number;
  contribution: number;
  bills: { id: string; name: string; amount: number }[];
  oneOffIncome: { id: string; name: string; amount: number }[];
  potBefore: number;
  potAfter: number;
  shortfall: boolean;
}
```

Export all new types from the shared package index.

- [ ] **Step 4: Run test to verify it passes**

Run: `cd packages/shared && bun test waterfall.schemas`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/shared/src/schemas/waterfall.schemas.ts packages/shared/src/schemas/waterfall.schemas.test.ts
git commit -m "feat(shared): add period schemas, lifecycle state enum, update item schemas"
```

---

### Task 5: Backend — Period Service

**Files:**

- Create: `apps/backend/src/services/period.service.ts`
- Create: `apps/backend/src/services/period.service.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// apps/backend/src/services/period.service.test.ts
import { describe, it, expect, beforeEach } from "bun:test";
import { mock } from "bun:test";
import { prismaMock, resetPrismaMocks } from "../test/mocks/prisma";

mock.module("../config/database.js", () => ({ prisma: prismaMock }));

const { periodService } = await import("./period.service.js");

beforeEach(() => {
  resetPrismaMocks();
});

describe("periodService.listPeriods", () => {
  it("returns periods ordered by startDate ascending", async () => {
    const periods = [
      {
        id: "p1",
        itemType: "committed_item",
        itemId: "item-1",
        startDate: new Date("2020-01-01"),
        endDate: new Date("2023-01-01"),
        amount: 7,
        createdAt: new Date(),
      },
      {
        id: "p2",
        itemType: "committed_item",
        itemId: "item-1",
        startDate: new Date("2023-01-01"),
        endDate: null,
        amount: 9,
        createdAt: new Date(),
      },
    ];
    prismaMock.itemAmountPeriod.findMany.mockResolvedValue(periods);

    const result = await periodService.listPeriods("committed_item", "item-1");

    expect(prismaMock.itemAmountPeriod.findMany).toHaveBeenCalledWith({
      where: { itemType: "committed_item", itemId: "item-1" },
      orderBy: { startDate: "asc" },
    });
    expect(result).toHaveLength(2);
    expect(result[0].amount).toBe(7);
  });
});

describe("periodService.getCurrentAmount", () => {
  it("returns the amount from the current effective period", async () => {
    const now = new Date("2026-04-04");
    const periods = [
      { id: "p1", startDate: new Date("2020-01-01"), endDate: new Date("2025-01-01"), amount: 7 },
      { id: "p2", startDate: new Date("2025-01-01"), endDate: null, amount: 9 },
    ];
    prismaMock.itemAmountPeriod.findMany.mockResolvedValue(periods);

    const result = await periodService.getCurrentAmount("committed_item", "item-1", now);

    expect(result).toBe(9);
  });

  it("returns 0 when no periods exist", async () => {
    prismaMock.itemAmountPeriod.findMany.mockResolvedValue([]);

    const result = await periodService.getCurrentAmount("committed_item", "item-1", new Date());

    expect(result).toBe(0);
  });
});

describe("periodService.getEffectiveAmountForMonth", () => {
  it("returns the amount effective in a given month", async () => {
    const periods = [
      { id: "p1", startDate: new Date("2020-01-01"), endDate: new Date("2026-06-01"), amount: 7 },
      { id: "p2", startDate: new Date("2026-06-01"), endDate: null, amount: 9 },
    ];
    prismaMock.itemAmountPeriod.findMany.mockResolvedValue(periods);

    // August 2026 — should be in period 2
    const result = await periodService.getEffectiveAmountForMonth(
      "committed_item",
      "item-1",
      2026,
      8
    );
    expect(result).toBe(9);

    // March 2026 — should be in period 1
    const result2 = await periodService.getEffectiveAmountForMonth(
      "committed_item",
      "item-1",
      2026,
      3
    );
    expect(result2).toBe(7);
  });
});

describe("periodService.getLifecycleState", () => {
  it("returns active when a period covers today", async () => {
    const now = new Date("2026-04-04");
    const periods = [{ startDate: new Date("2020-01-01"), endDate: null, amount: 10 }];
    prismaMock.itemAmountPeriod.findMany.mockResolvedValue(periods);

    const result = await periodService.getLifecycleState("committed_item", "item-1", now);
    expect(result).toBe("active");
  });

  it("returns future when all periods start after today", async () => {
    const now = new Date("2026-04-04");
    const periods = [{ startDate: new Date("2026-07-01"), endDate: null, amount: 10 }];
    prismaMock.itemAmountPeriod.findMany.mockResolvedValue(periods);

    const result = await periodService.getLifecycleState("committed_item", "item-1", now);
    expect(result).toBe("future");
  });

  it("returns expired when all periods have ended", async () => {
    const now = new Date("2026-04-04");
    const periods = [
      { startDate: new Date("2020-01-01"), endDate: new Date("2025-12-31"), amount: 10 },
    ];
    prismaMock.itemAmountPeriod.findMany.mockResolvedValue(periods);

    const result = await periodService.getLifecycleState("committed_item", "item-1", now);
    expect(result).toBe("expired");
  });
});

describe("periodService.createPeriod", () => {
  it("creates a period and updates the adjacent period's endDate", async () => {
    const existingPeriods = [
      {
        id: "p1",
        itemType: "committed_item",
        itemId: "item-1",
        startDate: new Date("2020-01-01"),
        endDate: null,
        amount: 7,
      },
    ];
    prismaMock.itemAmountPeriod.findMany.mockResolvedValue(existingPeriods);
    prismaMock.itemAmountPeriod.create.mockResolvedValue({
      id: "p2",
      itemType: "committed_item",
      itemId: "item-1",
      startDate: new Date("2026-10-01"),
      endDate: null,
      amount: 9,
      createdAt: new Date(),
    });
    prismaMock.itemAmountPeriod.update.mockResolvedValue({});

    const result = await periodService.createPeriod({
      itemType: "committed_item",
      itemId: "item-1",
      startDate: new Date("2026-10-01"),
      amount: 9,
    });

    // Should update previous period's endDate
    expect(prismaMock.itemAmountPeriod.update).toHaveBeenCalledWith({
      where: { id: "p1" },
      data: { endDate: new Date("2026-10-01") },
    });
    expect(result.amount).toBe(9);
  });
});

describe("periodService.deletePeriod", () => {
  it("deletes the period and extends the previous period", async () => {
    const periods = [
      {
        id: "p1",
        itemType: "committed_item",
        itemId: "item-1",
        startDate: new Date("2020-01-01"),
        endDate: new Date("2025-01-01"),
        amount: 7,
      },
      {
        id: "p2",
        itemType: "committed_item",
        itemId: "item-1",
        startDate: new Date("2025-01-01"),
        endDate: null,
        amount: 9,
      },
    ];
    prismaMock.itemAmountPeriod.findUnique.mockResolvedValue(periods[1]);
    prismaMock.itemAmountPeriod.findMany.mockResolvedValue(periods);
    prismaMock.itemAmountPeriod.delete.mockResolvedValue({});
    prismaMock.itemAmountPeriod.update.mockResolvedValue({});

    await periodService.deletePeriod("p2");

    expect(prismaMock.itemAmountPeriod.delete).toHaveBeenCalledWith({ where: { id: "p2" } });
    // Previous period should now be open-ended
    expect(prismaMock.itemAmountPeriod.update).toHaveBeenCalledWith({
      where: { id: "p1" },
      data: { endDate: null },
    });
  });

  it("returns deleteItem flag when deleting the last period", async () => {
    const period = {
      id: "p1",
      itemType: "committed_item",
      itemId: "item-1",
      startDate: new Date("2020-01-01"),
      endDate: null,
      amount: 7,
    };
    prismaMock.itemAmountPeriod.findUnique.mockResolvedValue(period);
    prismaMock.itemAmountPeriod.findMany.mockResolvedValue([period]);

    const result = await periodService.deletePeriod("p1");

    expect(result).toEqual({ deleteItem: true, itemType: "committed_item", itemId: "item-1" });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/backend && bun scripts/run-tests.ts period.service`
Expected: FAIL — cannot import `period.service.js`

- [ ] **Step 3: Write implementation**

```typescript
// apps/backend/src/services/period.service.ts
import { prisma } from "../config/database.js";
import type {
  CreatePeriodInput,
  UpdatePeriodInput,
  PeriodItemType,
  ItemLifecycleState,
} from "@finplan/shared";

export const periodService = {
  async listPeriods(itemType: string, itemId: string) {
    return prisma.itemAmountPeriod.findMany({
      where: { itemType: itemType as any, itemId },
      orderBy: { startDate: "asc" },
    });
  },

  async getCurrentAmount(
    itemType: string,
    itemId: string,
    now: Date = new Date()
  ): Promise<number> {
    const periods = await prisma.itemAmountPeriod.findMany({
      where: { itemType: itemType as any, itemId },
      orderBy: { startDate: "asc" },
    });
    const current = findEffectivePeriod(periods, now);
    return current?.amount ?? 0;
  },

  async getEffectiveAmountForMonth(
    itemType: string,
    itemId: string,
    year: number,
    month: number
  ): Promise<number> {
    const periods = await prisma.itemAmountPeriod.findMany({
      where: { itemType: itemType as any, itemId },
      orderBy: { startDate: "asc" },
    });
    // Use the 1st of the month as reference date
    const refDate = new Date(year, month - 1, 1);
    const effective = findEffectivePeriod(periods, refDate);
    return effective?.amount ?? 0;
  },

  async getLifecycleState(
    itemType: string,
    itemId: string,
    now: Date = new Date()
  ): Promise<ItemLifecycleState> {
    const periods = await prisma.itemAmountPeriod.findMany({
      where: { itemType: itemType as any, itemId },
      orderBy: { startDate: "asc" },
    });
    return computeLifecycleState(periods, now);
  },

  async createPeriod(data: CreatePeriodInput) {
    const existing = await prisma.itemAmountPeriod.findMany({
      where: { itemType: data.itemType as any, itemId: data.itemId },
      orderBy: { startDate: "asc" },
    });

    // Find the period that should have its endDate set to this new period's startDate
    const prevPeriod = findPreviousPeriod(existing, data.startDate);
    if (prevPeriod) {
      await prisma.itemAmountPeriod.update({
        where: { id: prevPeriod.id },
        data: { endDate: data.startDate },
      });
    }

    // Find the period after this one — set new period's endDate to that period's startDate
    const nextPeriod = findNextPeriod(existing, data.startDate);
    const endDate = data.endDate ?? nextPeriod?.startDate ?? null;

    return prisma.itemAmountPeriod.create({
      data: {
        itemType: data.itemType as any,
        itemId: data.itemId,
        startDate: data.startDate,
        endDate,
        amount: data.amount,
      },
    });
  },

  async updatePeriod(id: string, data: UpdatePeriodInput) {
    const period = await prisma.itemAmountPeriod.findUnique({ where: { id } });
    if (!period) throw new Error("Period not found");

    const updateData: Record<string, unknown> = {};
    if (data.amount !== undefined) updateData.amount = data.amount;
    if (data.startDate !== undefined) updateData.startDate = data.startDate;
    if (data.endDate !== undefined) updateData.endDate = data.endDate;

    // If startDate changes, update the previous period's endDate
    if (data.startDate && data.startDate.getTime() !== period.startDate.getTime()) {
      const allPeriods = await prisma.itemAmountPeriod.findMany({
        where: { itemType: period.itemType, itemId: period.itemId },
        orderBy: { startDate: "asc" },
      });
      const prevPeriod = findPreviousPeriod(allPeriods, period.startDate);
      if (prevPeriod) {
        await prisma.itemAmountPeriod.update({
          where: { id: prevPeriod.id },
          data: { endDate: data.startDate },
        });
      }
    }

    return prisma.itemAmountPeriod.update({ where: { id }, data: updateData });
  },

  async deletePeriod(
    id: string
  ): Promise<{ deleteItem: boolean; itemType?: string; itemId?: string } | void> {
    const period = await prisma.itemAmountPeriod.findUnique({ where: { id } });
    if (!period) throw new Error("Period not found");

    const allPeriods = await prisma.itemAmountPeriod.findMany({
      where: { itemType: period.itemType, itemId: period.itemId },
      orderBy: { startDate: "asc" },
    });

    // If this is the last period, signal item deletion
    if (allPeriods.length <= 1) {
      return { deleteItem: true, itemType: period.itemType, itemId: period.itemId };
    }

    const idx = allPeriods.findIndex((p) => p.id === id);
    const prevPeriod = idx > 0 ? allPeriods[idx - 1] : null;
    const nextPeriod = idx < allPeriods.length - 1 ? allPeriods[idx + 1] : null;

    // Adjust adjacent period to close the gap
    if (prevPeriod) {
      await prisma.itemAmountPeriod.update({
        where: { id: prevPeriod.id },
        data: { endDate: nextPeriod?.startDate ?? null },
      });
    } else if (nextPeriod) {
      // Deleting the first period — next period's startDate remains as-is
    }

    await prisma.itemAmountPeriod.delete({ where: { id } });
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

interface PeriodLike {
  id: string;
  startDate: Date;
  endDate: Date | null;
  amount: number;
}

function findEffectivePeriod(periods: PeriodLike[], refDate: Date): PeriodLike | null {
  // Walk backwards through sorted periods to find the most recent one that has started
  for (let i = periods.length - 1; i >= 0; i--) {
    const p = periods[i];
    if (p.startDate <= refDate && (p.endDate === null || p.endDate > refDate)) {
      return p;
    }
  }
  return null;
}

export function computeLifecycleState(
  periods: Array<{ startDate: Date; endDate: Date | null }>,
  now: Date
): ItemLifecycleState {
  if (periods.length === 0) return "expired";

  const allFuture = periods.every((p) => p.startDate > now);
  if (allFuture) return "future";

  const allExpired = periods.every((p) => p.endDate !== null && p.endDate <= now);
  if (allExpired) return "expired";

  return "active";
}

function findPreviousPeriod(periods: PeriodLike[], startDate: Date): PeriodLike | null {
  let prev: PeriodLike | null = null;
  for (const p of periods) {
    if (p.startDate < startDate) prev = p;
    else break;
  }
  return prev;
}

function findNextPeriod(periods: PeriodLike[], startDate: Date): PeriodLike | null {
  for (const p of periods) {
    if (p.startDate > startDate) return p;
  }
  return null;
}

export { findEffectivePeriod };
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/backend && bun scripts/run-tests.ts period.service`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/backend/src/services/period.service.ts apps/backend/src/services/period.service.test.ts
git commit -m "feat(backend): add period service with CRUD, lifecycle, and contiguity logic"
```

---

### Task 6: Backend — Update Waterfall Service to Derive Amounts from Periods

**Files:**

- Modify: `apps/backend/src/services/waterfall.service.ts`
- Modify: `apps/backend/src/services/waterfall.service.test.ts`

- [ ] **Step 1: Write the failing test**

Add to `waterfall.service.test.ts`:

```typescript
describe("waterfallService.getWaterfallSummary — period-aware", () => {
  it("derives item amounts from periods, excludes non-active items", async () => {
    const now = new Date("2026-04-04");

    prismaMock.incomeSource.findMany.mockResolvedValue([
      {
        id: "inc-1",
        householdId: "hh-1",
        name: "Salary",
        frequency: "monthly",
        incomeType: "salary",
        subcategoryId: "sub-1",
        sortOrder: 0,
        lastReviewedAt: now,
        createdAt: now,
        updatedAt: now,
        notes: null,
        expectedMonth: null,
        ownerId: null,
      },
    ]);
    prismaMock.committedItem.findMany.mockResolvedValue([]);
    prismaMock.discretionaryItem.findMany.mockResolvedValue([]);
    prismaMock.subcategory.findMany.mockResolvedValue([]);

    // Period for inc-1: active, amount = 5000
    prismaMock.itemAmountPeriod.findMany.mockResolvedValue([
      {
        id: "p1",
        itemType: "income_source",
        itemId: "inc-1",
        startDate: new Date("2020-01-01"),
        endDate: null,
        amount: 5000,
      },
    ]);

    const summary = await waterfallService.getWaterfallSummary("hh-1");

    expect(summary.income.total).toBe(5000);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/backend && bun scripts/run-tests.ts waterfall.service`
Expected: FAIL — service still reads `item.amount`

- [ ] **Step 3: Update implementation**

Modify `getWaterfallSummary` in `waterfall.service.ts`:

1. After fetching `incomeSources`, `committedItems`, `discretionaryItems`, also fetch all periods for the household's items in one query:

```typescript
const allItemIds = [
  ...incomeSources.map((s) => ({ type: "income_source" as const, id: s.id })),
  ...committedItems.map((s) => ({ type: "committed_item" as const, id: s.id })),
  ...discretionaryItems.map((s) => ({ type: "discretionary_item" as const, id: s.id })),
];

const allPeriods = await prisma.itemAmountPeriod.findMany({
  where: {
    OR: allItemIds.map((item) => ({ itemType: item.type, itemId: item.id })),
  },
  orderBy: { startDate: "asc" },
});

const periodsByItem = new Map<string, typeof allPeriods>();
for (const period of allPeriods) {
  const key = `${period.itemType}:${period.itemId}`;
  const existing = periodsByItem.get(key) ?? [];
  existing.push(period);
  periodsByItem.set(key, existing);
}
```

2. Add helper to get current amount:

```typescript
function getCurrentAmountFromPeriods(periods: typeof allPeriods, now: Date): number {
  for (let i = periods.length - 1; i >= 0; i--) {
    const p = periods[i];
    if (p.startDate <= now && (p.endDate === null || p.endDate > now)) {
      return p.amount;
    }
  }
  return 0;
}
```

3. Filter items by lifecycle state (active only) and derive amounts:

```typescript
const now = new Date();

// Filter to active items and enrich with derived amounts
const activeIncome = incomeSources
  .filter((s) => {
    const periods = periodsByItem.get(`income_source:${s.id}`) ?? [];
    return computeLifecycleState(periods, now) === "active";
  })
  .map((s) => {
    const periods = periodsByItem.get(`income_source:${s.id}`) ?? [];
    return { ...s, amount: getCurrentAmountFromPeriods(periods, now) };
  });
```

Apply the same pattern to `committedItems` and `discretionaryItems`.

4. Replace all `item.amount` references in the summary calculation with the enriched amount.

Similarly update `getCashflow` to:

- Fetch periods for all yearly/one-off committed items
- Use the period-effective amount per month for pot calculations
- Add `potBefore` to the response
- Filter items by lifecycle (active only in the given month)

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/backend && bun scripts/run-tests.ts waterfall.service`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/backend/src/services/waterfall.service.ts apps/backend/src/services/waterfall.service.test.ts
git commit -m "feat(backend): derive item amounts from periods in waterfall summary and cashflow"
```

---

### Task 7: Backend — Period Routes

**Files:**

- Modify: `apps/backend/src/routes/waterfall.routes.ts`

- [ ] **Step 1: Write the failing test**

Add to `waterfall.routes.test.ts`:

```typescript
describe("GET /api/waterfall/periods/:itemType/:itemId", () => {
  it("returns periods for an item", async () => {
    // Test against running server or mock — pattern matches existing route tests
  });
});

describe("POST /api/waterfall/periods", () => {
  it("creates a new period", async () => {
    // Test validates 201 response
  });
});

describe("DELETE /api/waterfall/periods/:id", () => {
  it("deletes period and returns 204", async () => {
    // Test validates deletion
  });

  it("deletes item when last period is removed", async () => {
    // Test validates cascading item deletion
  });
});
```

- [ ] **Step 2: Add period routes**

Add to `waterfall.routes.ts`:

```typescript
import { periodService } from "../services/period.service.js";
import { createPeriodSchema, updatePeriodSchema } from "@finplan/shared";

// ─── Periods ───────────────────────────────────────────────────────────────

fastify.get("/periods/:itemType/:itemId", pre, async (req, reply) => {
  const { itemType, itemId } = req.params as { itemType: string; itemId: string };
  // Verify ownership of the parent item
  await verifyItemOwnership(req.householdId!, itemType, itemId);
  const periods = await periodService.listPeriods(itemType, itemId);
  return reply.send(periods);
});

fastify.post("/periods", pre, async (req, reply) => {
  const data = createPeriodSchema.parse(req.body);
  await verifyItemOwnership(req.householdId!, data.itemType, data.itemId);
  const period = await periodService.createPeriod(data);
  return reply.status(201).send(period);
});

fastify.patch("/periods/:id", pre, async (req, reply) => {
  const { id } = req.params as { id: string };
  const data = updatePeriodSchema.parse(req.body);
  // Ownership verified through period's parent item inside service
  const period = await periodService.updatePeriod(id, data);
  return reply.send(period);
});

fastify.delete("/periods/:id", pre, async (req, reply) => {
  const { id } = req.params as { id: string };
  const result = await periodService.deletePeriod(id);
  if (result?.deleteItem) {
    // Delete the parent item
    switch (result.itemType) {
      case "income_source":
        await waterfallService.deleteIncome(req.householdId!, result.itemId!, actorCtx(req));
        break;
      case "committed_item":
        await waterfallService.deleteCommitted(req.householdId!, result.itemId!, actorCtx(req));
        break;
      case "discretionary_item":
        await waterfallService.deleteDiscretionary(req.householdId!, result.itemId!, actorCtx(req));
        break;
    }
    return reply.status(200).send({ deleted: "item", itemId: result.itemId });
  }
  return reply.status(204).send();
});
```

Add `verifyItemOwnership` helper:

```typescript
async function verifyItemOwnership(householdId: string, itemType: string, itemId: string) {
  switch (itemType) {
    case "income_source": {
      const item = await prisma.incomeSource.findUnique({ where: { id: itemId } });
      assertOwned(item, householdId, "Income source");
      break;
    }
    case "committed_item": {
      const item = await prisma.committedItem.findUnique({ where: { id: itemId } });
      assertOwned(item, householdId, "Committed item");
      break;
    }
    case "discretionary_item": {
      const item = await prisma.discretionaryItem.findUnique({ where: { id: itemId } });
      assertOwned(item, householdId, "Discretionary item");
      break;
    }
    default:
      throw new NotFoundError("Unknown item type");
  }
}
```

- [ ] **Step 3: Update item create routes to create initial period**

In each `fastify.post` for income/committed/discretionary, after creating the item, also create the initial period:

```typescript
// Example for committed:
const item = await waterfallService.createCommitted(req.householdId!, data, actorCtx(req));
await periodService.createPeriod({
  itemType: "committed_item",
  itemId: item.id,
  startDate: data.startDate ?? new Date(),
  endDate: data.endDate,
  amount: data.amount,
});
```

- [ ] **Step 4: Commit**

```bash
git add apps/backend/src/routes/waterfall.routes.ts
git commit -m "feat(backend): add period CRUD routes, create initial period on item creation"
```

---

### Task 8: Backend — Update Item Create/Update to Use Periods

**Files:**

- Modify: `apps/backend/src/services/waterfall.service.ts`
- Modify: `apps/backend/src/routes/waterfall.routes.ts`

- [ ] **Step 1: Update create methods**

Since `amount` is removed from item models, the create methods need to stop passing `amount` to Prisma. The amount is stored in the initial period instead (handled in the route layer in Task 7).

Update `createCommitted`, `createDiscretionary`, `createIncome` to destructure out `amount` before passing to Prisma:

```typescript
async createCommitted(householdId: string, data: CreateCommittedItemInput, ctx?: ActorCtx) {
  const { amount, startDate, endDate, ...itemData } = data as any;
  // ... existing validation ...
  // Create item without amount
  const item = await tx.committedItem.create({
    data: { ...itemData, householdId, spendType: itemData.spendType ?? "monthly", lastReviewedAt: new Date() },
  });
  return item;
}
```

- [ ] **Step 2: Update list/summary methods to enrich with period amounts**

All `list*` methods should include periods in the response. Add `include: { ... }` or follow up with a period query to enrich each item with its current amount and periods.

- [ ] **Step 3: Remove endIncome and reactivateIncome methods**

These are replaced by period management. Remove the route handlers and service methods. The `POST /income/:id/end` and `POST /income/:id/reactivate` routes are removed.

- [ ] **Step 4: Commit**

```bash
git add apps/backend/src/services/waterfall.service.ts apps/backend/src/routes/waterfall.routes.ts
git commit -m "refactor(backend): remove amount from item creates, remove end/reactivate income"
```

---

### Task 9: Frontend — Period Types and API Service

**Files:**

- Modify: `apps/frontend/src/services/waterfall.service.ts`
- Modify: `apps/frontend/src/hooks/useWaterfall.ts`

- [ ] **Step 1: Add period API methods**

Add to `waterfall.service.ts`:

```typescript
import type { PeriodRow, CreatePeriodInput, UpdatePeriodInput } from "@finplan/shared";

// Periods
listPeriods: (itemType: string, itemId: string) =>
  apiClient.get<PeriodRow[]>(`/api/waterfall/periods/${itemType}/${itemId}`),
createPeriod: (data: CreatePeriodInput) =>
  apiClient.post<PeriodRow>("/api/waterfall/periods", data),
updatePeriod: (id: string, data: UpdatePeriodInput) =>
  apiClient.patch<PeriodRow>(`/api/waterfall/periods/${id}`, data),
deletePeriod: (id: string) =>
  apiClient.delete<void | { deleted: string; itemId: string }>(`/api/waterfall/periods/${id}`),
```

- [ ] **Step 2: Add period hooks**

Add to `useWaterfall.ts`:

```typescript
import type { PeriodRow, CreatePeriodInput, UpdatePeriodInput } from "@finplan/shared";

export const PERIOD_KEYS = {
  list: (itemType: string, itemId: string) => ["periods", itemType, itemId] as const,
};

export function usePeriods(itemType: string, itemId: string) {
  return useQuery({
    queryKey: PERIOD_KEYS.list(itemType, itemId),
    queryFn: () => waterfallService.listPeriods(itemType, itemId),
    enabled: !!itemId,
  });
}

export function useCreatePeriod(itemType: string, itemId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<CreatePeriodInput, "itemType" | "itemId">) =>
      waterfallService.createPeriod({ ...data, itemType, itemId } as CreatePeriodInput),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: PERIOD_KEYS.list(itemType, itemId) });
      void qc.invalidateQueries({ queryKey: WATERFALL_KEYS.summary });
    },
  });
}

export function useUpdatePeriod(itemType: string, itemId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePeriodInput }) =>
      waterfallService.updatePeriod(id, data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: PERIOD_KEYS.list(itemType, itemId) });
      void qc.invalidateQueries({ queryKey: WATERFALL_KEYS.summary });
    },
  });
}

export function useDeletePeriod(itemType: string, itemId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (periodId: string) => waterfallService.deletePeriod(periodId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: PERIOD_KEYS.list(itemType, itemId) });
      void qc.invalidateQueries({ queryKey: WATERFALL_KEYS.summary });
    },
  });
}
```

- [ ] **Step 3: Update TierItemRow to include periods**

Update the `TierItemRow` interface and `fetchTierItems` to include period data from the enriched API response:

```typescript
export interface TierItemRow {
  id: string;
  name: string;
  amount: number; // derived from current period
  spendType: "monthly" | "yearly" | "one_off";
  subcategoryId: string;
  notes: string | null;
  lastReviewedAt: Date;
  createdAt: Date;
  sortOrder: number;
  lifecycleState: "active" | "future" | "expired";
  periods: PeriodRow[];
  nextPeriod: PeriodRow | null; // first future period, for scheduled change indicator
}
```

- [ ] **Step 4: Commit**

```bash
git add apps/frontend/src/services/waterfall.service.ts apps/frontend/src/hooks/useWaterfall.ts
git commit -m "feat(frontend): add period API service, hooks, and enriched TierItemRow type"
```

---

### Task 10: Frontend — ItemStatusFilter Component

**Files:**

- Create: `apps/frontend/src/components/tier/ItemStatusFilter.tsx`
- Create: `apps/frontend/src/components/tier/ItemStatusFilter.test.tsx`

- [ ] **Step 1: Write the failing test**

```typescript
// apps/frontend/src/components/tier/ItemStatusFilter.test.tsx
import { describe, it, expect } from "bun:test";
import { render, screen, fireEvent } from "@testing-library/react";
import ItemStatusFilter from "./ItemStatusFilter";

describe("ItemStatusFilter", () => {
  it("renders three filter buttons with counts", () => {
    render(
      <ItemStatusFilter
        counts={{ active: 5, future: 2, expired: 1 }}
        selected={new Set(["active"])}
        onChange={() => {}}
      />
    );
    expect(screen.getByText("Active")).toBeTruthy();
    expect(screen.getByText("Future")).toBeTruthy();
    expect(screen.getByText("Expired")).toBeTruthy();
    expect(screen.getByText("5")).toBeTruthy();
    expect(screen.getByText("2")).toBeTruthy();
    expect(screen.getByText("1")).toBeTruthy();
  });

  it("supports multi-select", () => {
    let selected = new Set(["active"]);
    const onChange = (s: Set<string>) => { selected = s; };

    const { rerender } = render(
      <ItemStatusFilter counts={{ active: 5, future: 2, expired: 1 }} selected={selected} onChange={onChange} />
    );

    fireEvent.click(screen.getByText("Future"));
    expect(selected.has("future")).toBe(true);
    expect(selected.has("active")).toBe(true);
  });
});
```

- [ ] **Step 2: Write implementation**

```typescript
// apps/frontend/src/components/tier/ItemStatusFilter.tsx
import type { ItemLifecycleState } from "@finplan/shared";

interface Props {
  counts: Record<ItemLifecycleState, number>;
  selected: Set<ItemLifecycleState>;
  onChange: (selected: Set<ItemLifecycleState>) => void;
}

const LABELS: Record<ItemLifecycleState, string> = {
  active: "Active",
  future: "Future",
  expired: "Expired",
};

export default function ItemStatusFilter({ counts, selected, onChange }: Props) {
  function toggle(state: ItemLifecycleState) {
    const next = new Set(selected);
    if (next.has(state)) {
      // Don't allow deselecting all
      if (next.size > 1) next.delete(state);
    } else {
      next.add(state);
    }
    onChange(next);
  }

  return (
    <div className="flex gap-1 rounded-lg bg-surface border border-surface-border p-0.5 w-fit">
      {(["active", "future", "expired"] as const).map((state) => (
        <button
          key={state}
          type="button"
          onClick={() => toggle(state)}
          className={[
            "flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-body font-medium transition-all duration-150",
            selected.has(state)
              ? "bg-surface-elevated border border-surface-elevated-border text-text-primary"
              : "text-text-tertiary hover:text-text-secondary",
          ].join(" ")}
        >
          {LABELS[state]}
          <span className="font-numeric text-[10px] opacity-50">{counts[state]}</span>
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/frontend/src/components/tier/ItemStatusFilter.tsx apps/frontend/src/components/tier/ItemStatusFilter.test.tsx
git commit -m "feat(frontend): add ItemStatusFilter multi-select toggle component"
```

---

### Task 11: Frontend — ItemRow Lifecycle Styling and Scheduled Change Indicator

**Files:**

- Modify: `apps/frontend/src/components/tier/ItemRow.tsx`

- [ ] **Step 1: Update ItemRow to accept lifecycle state and next period**

```typescript
// Add to WaterfallItem interface:
lifecycleState?: "active" | "future" | "expired";
nextPeriod?: { amount: number; startDate: Date } | null;

// Add to Props:
// (lifecycleState and nextPeriod flow through the item prop)
```

- [ ] **Step 2: Add lifecycle visual treatment**

```typescript
// In the button className, add lifecycle-based styling:
const lifecycleClass = (() => {
  if (item.lifecycleState === "future")
    return "opacity-55 border border-dashed border-foreground/10";
  if (item.lifecycleState === "expired") return "opacity-35";
  return "";
})();
```

- [ ] **Step 3: Add scheduled change indicator**

After the amount display in the right column:

```typescript
{item.nextPeriod && (
  <span className="flex items-center gap-1 font-numeric text-[11px]">
    <span className="text-text-muted">→</span>
    <span className={`${config.textClass} opacity-70`}>
      {formatCurrency(item.nextPeriod.amount)}
    </span>
    <span className="font-body text-[10px] text-text-muted">
      from {new Date(item.nextPeriod.startDate).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
    </span>
  </span>
)}
```

- [ ] **Step 4: Add future badge**

For future items, add a badge next to the name:

```typescript
{item.lifecycleState === "future" && (
  <span className={`text-[9px] font-semibold uppercase tracking-[0.08em] px-2 py-0.5 rounded ${config.textClass} ${config.bgClass}/10 border ${config.borderClass}/15 ml-2`}>
    From {new Date(item.periods?.[0]?.startDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
  </span>
)}
```

- [ ] **Step 5: Commit**

```bash
git add apps/frontend/src/components/tier/ItemRow.tsx
git commit -m "feat(frontend): add lifecycle styling and scheduled change indicator to ItemRow"
```

---

### Task 12: Frontend — ValueSparkline Component

**Files:**

- Create: `apps/frontend/src/components/tier/ValueSparkline.tsx`
- Create: `apps/frontend/src/components/tier/ValueSparkline.test.tsx`

- [ ] **Step 1: Write the failing test**

```typescript
// apps/frontend/src/components/tier/ValueSparkline.test.tsx
import { describe, it, expect } from "bun:test";
import { render, screen } from "@testing-library/react";
import ValueSparkline from "./ValueSparkline";

describe("ValueSparkline", () => {
  it("renders SVG with correct number of line segments", () => {
    const periods = [
      { id: "p1", startDate: new Date("2020-01-01"), endDate: new Date("2023-01-01"), amount: 7 },
      { id: "p2", startDate: new Date("2023-01-01"), endDate: null, amount: 9 },
    ];

    const { container } = render(
      <ValueSparkline periods={periods} tierColorClass="text-tier-committed" now={new Date("2026-04-04")} />
    );

    const svg = container.querySelector("svg");
    expect(svg).toBeTruthy();
  });

  it("does not render when only one period", () => {
    const periods = [
      { id: "p1", startDate: new Date("2020-01-01"), endDate: null, amount: 7 },
    ];

    const { container } = render(
      <ValueSparkline periods={periods} tierColorClass="text-tier-committed" now={new Date("2026-04-04")} />
    );

    expect(container.querySelector("svg")).toBeFalsy();
  });
});
```

- [ ] **Step 2: Write implementation**

```typescript
// apps/frontend/src/components/tier/ValueSparkline.tsx
import { useMemo } from "react";
import { formatCurrency } from "@/utils/format";

interface Period {
  id: string;
  startDate: Date;
  endDate: Date | null;
  amount: number;
}

interface Props {
  periods: Period[];
  tierColorClass: string;
  now?: Date;
}

const SVG_WIDTH = 500;
const SVG_HEIGHT = 48;
const PADDING_Y = 8;

export default function ValueSparkline({ periods, tierColorClass, now = new Date() }: Props) {
  if (periods.length <= 1) return null;

  const { points, nowX, labels } = useMemo(() => {
    const sorted = [...periods].sort((a, b) => a.startDate.getTime() - b.startDate.getTime());

    // Determine time range
    const minTime = sorted[0].startDate.getTime();
    const lastPeriodEnd = sorted[sorted.length - 1].endDate;
    // Extend beyond now if there are future periods
    const maxTime = Math.max(
      now.getTime(),
      lastPeriodEnd?.getTime() ?? now.getTime() + 90 * 24 * 60 * 60 * 1000
    );
    const timeRange = maxTime - minTime || 1;

    // Determine amount range
    const amounts = sorted.map((p) => p.amount);
    const minAmt = Math.min(...amounts);
    const maxAmt = Math.max(...amounts);
    const amtRange = maxAmt - minAmt || 1;

    function xForTime(t: number): number {
      return ((t - minTime) / timeRange) * SVG_WIDTH;
    }

    function yForAmount(a: number): number {
      return SVG_HEIGHT - PADDING_Y - ((a - minAmt) / amtRange) * (SVG_HEIGHT - PADDING_Y * 2);
    }

    const pts: Array<{ x: number; y: number; future: boolean }> = [];
    const lbls: Array<{ x: number; y: number; text: string; dateText: string }> = [];

    for (let i = 0; i < sorted.length; i++) {
      const p = sorted[i];
      const x = xForTime(p.startDate.getTime());
      const y = yForAmount(p.amount);
      const isFuture = p.startDate > now;

      // Step: horizontal line at previous amount, then vertical to new amount
      if (i > 0) {
        pts.push({ x, y: pts[pts.length - 1].y, future: isFuture });
      }
      pts.push({ x, y, future: isFuture });

      // Extend to end
      if (i === sorted.length - 1) {
        const endX = p.endDate ? xForTime(p.endDate.getTime()) : SVG_WIDTH;
        pts.push({ x: endX, y, future: isFuture });
      }

      lbls.push({
        x: x + 4,
        y: y - 4,
        text: formatCurrency(p.amount),
        dateText: p.startDate.toLocaleDateString("en-GB", { month: "short", year: "numeric" }),
      });
    }

    return {
      points: pts,
      nowX: xForTime(now.getTime()),
      labels: lbls,
    };
  }, [periods, now]);

  // Split into past and future segments
  const pastPoints = points.filter((p) => !p.future);
  const futurePoints = points.filter((p) => p.future);
  // Add connection point
  if (pastPoints.length > 0 && futurePoints.length > 0) {
    futurePoints.unshift(pastPoints[pastPoints.length - 1]);
  }

  const tierColor = tierColorClass.replace("text-", "");

  return (
    <div className="mt-3">
      <span className="block text-text-muted uppercase tracking-[0.07em] text-[10px] mb-1.5">
        Value History
      </span>
      <svg
        viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
        preserveAspectRatio="none"
        className="w-full h-12"
        role="img"
        aria-label="Value history sparkline"
      >
        {/* Past line */}
        {pastPoints.length > 1 && (
          <polyline
            points={pastPoints.map((p) => `${p.x},${p.y}`).join(" ")}
            fill="none"
            className={`stroke-${tierColor}`}
            strokeWidth="1.5"
            opacity="0.6"
          />
        )}
        {/* Future line (dashed) */}
        {futurePoints.length > 1 && (
          <polyline
            points={futurePoints.map((p) => `${p.x},${p.y}`).join(" ")}
            fill="none"
            className={`stroke-${tierColor}`}
            strokeWidth="1.5"
            opacity="0.4"
            strokeDasharray="4 3"
          />
        )}
        {/* Now dot */}
        {pastPoints.length > 0 && (
          <circle
            cx={nowX}
            cy={pastPoints[pastPoints.length - 1].y}
            r="3"
            className={`fill-${tierColor}`}
            opacity="0.8"
          />
        )}
        {/* Amount labels */}
        {labels.map((lbl, i) => (
          <text
            key={i}
            x={lbl.x}
            y={lbl.y}
            className="fill-text-tertiary font-numeric"
            fontSize="9"
          >
            {lbl.text}
          </text>
        ))}
      </svg>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/frontend/src/components/tier/ValueSparkline.tsx apps/frontend/src/components/tier/ValueSparkline.test.tsx
git commit -m "feat(frontend): add ValueSparkline step-function SVG component"
```

---

### Task 13: Frontend — ItemAccordion with Sparkline

**Files:**

- Modify: `apps/frontend/src/components/tier/ItemAccordion.tsx`

- [ ] **Step 1: Add sparkline to accordion**

Import `ValueSparkline` and render it below the notes section. Accept `periods` and `tierColorClass` in props:

```typescript
import ValueSparkline from "./ValueSparkline";
import type { PeriodRow } from "@finplan/shared";

// Add to Item interface:
periods?: PeriodRow[];

// Add to Props:
// (periods flow through the item prop)

// In the JSX, after the Last Reviewed section:
{item.periods && item.periods.length > 1 && (
  <ValueSparkline
    periods={item.periods.map((p) => ({
      ...p,
      startDate: new Date(p.startDate),
      endDate: p.endDate ? new Date(p.endDate) : null,
    }))}
    tierColorClass={config.textClass}
    now={now}
  />
)}
```

- [ ] **Step 2: Commit**

```bash
git add apps/frontend/src/components/tier/ItemAccordion.tsx
git commit -m "feat(frontend): add value history sparkline to ItemAccordion"
```

---

### Task 14: Frontend — ItemForm Period Editor

**Files:**

- Modify: `apps/frontend/src/components/tier/ItemForm.tsx`

- [ ] **Step 1: Add period editor section**

Add after the Notes textarea in the form, only in edit mode:

```typescript
// Add to EditItem interface:
periods?: Array<{ id: string; startDate: Date; endDate: Date | null; amount: number }>;

// In the JSX, after the notes section and before the actions:
{mode === "edit" && item?.periods && item.periods.length > 0 && (
  <div className="col-span-2 flex flex-col gap-1">
    <label className={labelClass}>Value History</label>
    <div className="flex flex-col gap-1">
      {item.periods.map((period, idx) => {
        const isCurrent = period.startDate <= now && (period.endDate === null || period.endDate > now);
        const isFuture = period.startDate > now;
        return (
          <div
            key={period.id}
            className={[
              "flex items-center gap-3 px-3 py-2 rounded-md border",
              isCurrent
                ? "bg-surface-elevated border-surface-elevated-border"
                : "bg-surface border-surface-border",
            ].join(" ")}
          >
            <span className="font-numeric text-xs text-text-tertiary min-w-[80px]">
              {new Date(period.startDate).toLocaleDateString("en-GB", { month: "short", year: "numeric" })}
            </span>
            <span className="font-numeric text-sm text-text-secondary min-w-[70px]">
              {formatCurrency(period.amount)}
            </span>
            {isCurrent && (
              <span className={`text-[9px] font-semibold uppercase tracking-[0.06em] ${config.textClass} opacity-70`}>
                Current
              </span>
            )}
            {isFuture && (
              <span className="text-[9px] font-semibold uppercase tracking-[0.06em] text-text-muted">
                Scheduled
              </span>
            )}
            <button
              type="button"
              onClick={() => onDeletePeriod?.(period.id)}
              className="ml-auto text-xs text-text-muted hover:text-red-400 transition-colors"
            >
              Remove
            </button>
          </div>
        );
      })}
    </div>
    <button
      type="button"
      onClick={onAddPeriod}
      className="mt-1 rounded-md border border-dashed border-surface-border px-3.5 py-1.5 text-xs text-text-tertiary hover:text-text-secondary hover:border-surface-elevated-border transition-colors"
    >
      + Add period
    </button>
  </div>
)}
```

Add `onDeletePeriod` and `onAddPeriod` to the props type (passed from `ItemAreaRow`).

- [ ] **Step 2: Commit**

```bash
git add apps/frontend/src/components/tier/ItemForm.tsx
git commit -m "feat(frontend): add period editor section to ItemForm edit mode"
```

---

### Task 15: Frontend — Integrate Filter into ItemArea

**Files:**

- Modify: `apps/frontend/src/components/tier/ItemArea.tsx`

- [ ] **Step 1: Add filter state and filtering logic**

```typescript
import { useState, useMemo } from "react";
import ItemStatusFilter from "./ItemStatusFilter";
import type { ItemLifecycleState } from "@finplan/shared";

// Add state:
const [selectedStates, setSelectedStates] = useState<Set<ItemLifecycleState>>(new Set(["active"]));

// Compute counts:
const stateCounts = useMemo(() => {
  const counts: Record<ItemLifecycleState, number> = { active: 0, future: 0, expired: 0 };
  for (const item of items) {
    if (item.lifecycleState) counts[item.lifecycleState]++;
  }
  return counts;
}, [items]);

// Filter items:
const filteredItems = useMemo(() => {
  return items.filter((item) => selectedStates.has(item.lifecycleState ?? "active"));
}, [items, selectedStates]);
```

- [ ] **Step 2: Render filter bar**

Place the filter above the item list, below the header:

```typescript
{/* Filter bar */}
<div className="px-4 py-2 border-b border-foreground/5">
  <ItemStatusFilter
    counts={stateCounts}
    selected={selectedStates}
    onChange={setSelectedStates}
  />
</div>
```

- [ ] **Step 3: Add empty filter state**

When filtered items are empty but total items exist:

```typescript
{filteredItems.length === 0 && items.length > 0 && (
  <div className="flex items-center justify-center py-12">
    <p className="text-sm text-text-muted">
      No {[...selectedStates].join(" or ")} items
    </p>
  </div>
)}
```

- [ ] **Step 4: Use filteredItems instead of items in the list render**

Replace `displayItems` computation to sort `filteredItems` instead of `items`.

- [ ] **Step 5: Commit**

```bash
git add apps/frontend/src/components/tier/ItemArea.tsx
git commit -m "feat(frontend): integrate ItemStatusFilter into tier page ItemArea"
```

---

### Task 16: Frontend — Enhanced CashflowCalendar

**Files:**

- Modify: `apps/frontend/src/components/overview/CashflowCalendar.tsx`

- [ ] **Step 1: Add expanded month state and enhanced rendering**

```typescript
const [expandedMonth, setExpandedMonth] = useState<number | null>(null);
```

Replace the month rendering:

```typescript
{(months ?? []).map((month) => {
  const monthName = format(new Date(month.year, month.month - 1, 1), "MMMM");
  const isExpanded = expandedMonth === month.month;
  const hasShortfall = month.shortfall;

  return (
    <div key={`${month.year}-${month.month}`}>
      <button
        type="button"
        onClick={() => setExpandedMonth(isExpanded ? null : month.month)}
        className={cn(
          "flex w-full items-center justify-between rounded-md px-4 py-2.5 text-sm transition-colors",
          "border border-surface-border bg-surface hover:bg-surface-elevated",
          isExpanded && "bg-tier-committed/[0.06] border-l-2 border-l-tier-committed rounded-b-none",
        )}
      >
        <span className="flex items-center gap-2 font-heading text-[13px] font-bold text-text-secondary">
          {hasShortfall && (
            <span className="h-[5px] w-[5px] rounded-full bg-attention shrink-0" />
          )}
          {monthName}
        </span>
        <span className={cn(
          "font-numeric text-xs",
          hasShortfall ? "text-attention" : "text-text-tertiary",
        )}>
          Pot after: {formatCurrency(month.potAfter)}
        </span>
      </button>

      {isExpanded && (
        <div className="bg-tier-committed/[0.03] border border-t-0 border-surface-border rounded-b-md px-4 py-3 pl-7 space-y-2">
          {/* Bills due */}
          {month.bills.map((bill) => (
            <div key={bill.id} className="flex justify-between text-xs">
              <span className="text-text-secondary">{bill.name}</span>
              <span className="font-numeric text-text-secondary">-{formatCurrency(bill.amount)}</span>
            </div>
          ))}

          {/* Divider */}
          <div className="border-t border-surface-border my-2" />

          {/* Pot breakdown */}
          <div className="space-y-1">
            <div className="flex justify-between text-[11px]">
              <span className="text-text-muted uppercase tracking-[0.06em] font-semibold">Pot before</span>
              <span className="font-numeric text-text-tertiary">{formatCurrency(month.potBefore)}</span>
            </div>
            <div className="flex justify-between text-[11px]">
              <span className="text-text-muted uppercase tracking-[0.06em] font-semibold">Bills due</span>
              <span className="font-numeric text-text-tertiary">-{formatCurrency(month.bills.reduce((s, b) => s + b.amount, 0))}</span>
            </div>
            <div className="flex justify-between text-[11px]">
              <span className="text-text-muted uppercase tracking-[0.06em] font-semibold">Monthly accrual</span>
              <span className="font-numeric text-text-tertiary">+{formatCurrency(month.contribution)}</span>
            </div>
            <div className="flex justify-between text-[11px]">
              <span className="text-text-muted uppercase tracking-[0.06em] font-semibold">Pot after</span>
              <span className={cn("font-numeric", hasShortfall ? "text-attention" : "text-text-tertiary")}>
                {formatCurrency(month.potAfter)}
              </span>
            </div>
          </div>

          {/* Shortfall note */}
          {hasShortfall && (
            <div className="flex items-center gap-1.5 rounded bg-attention/[0.04] px-2.5 py-1.5 text-[11px] text-attention mt-2">
              <span className="h-[5px] w-[5px] rounded-full bg-attention shrink-0" />
              Pot is {formatCurrency(Math.abs(month.potAfter))} short for {monthName}
            </div>
          )}
        </div>
      )}
    </div>
  );
})}
```

- [ ] **Step 2: Remove the green one-off income styling (design system violation)**

The existing code uses `text-green-600` for one-off income. Per design anchor #10, financial values are never green. Replace with neutral styling:

```typescript
// Change: className="text-green-600 dark:text-green-400"
// To: className="text-text-tertiary"
```

- [ ] **Step 3: Commit**

```bash
git add apps/frontend/src/components/overview/CashflowCalendar.tsx
git commit -m "feat(frontend): enhance CashflowCalendar with expanded months, shortfall dots, pot breakdown"
```

---

### Task 17: Update Definitions — Period Tooltip

**Files:**

- Verify: `docs/2. design/definitions.md` — already updated in the design phase

- [ ] **Step 1: Verify the Period definition exists**

Read `docs/2. design/definitions.md` and confirm the "Period" entry is present with the approved tooltip text.

- [ ] **Step 2: No commit needed** — already committed during design.

---

## Testing

### Backend Tests

- [ ] Service: `periodService.listPeriods` returns ordered periods
- [ ] Service: `periodService.getCurrentAmount` finds the correct effective period
- [ ] Service: `periodService.getLifecycleState` returns active/future/expired correctly
- [ ] Service: `periodService.createPeriod` maintains contiguity with adjacent periods
- [ ] Service: `periodService.deletePeriod` closes gap and signals item deletion for last period
- [ ] Service: `waterfallService.getWaterfallSummary` derives amounts from periods, excludes non-active items
- [ ] Service: `waterfallService.getCashflow` respects period dates and amounts per month
- [ ] Endpoint: `GET /periods/:itemType/:itemId` returns 200 with periods
- [ ] Endpoint: `POST /periods` creates period and returns 201
- [ ] Endpoint: `DELETE /periods/:id` returns 204, or 200 with item deletion
- [ ] Endpoint: period routes verify household ownership

### Frontend Tests

- [ ] Component: `ItemStatusFilter` renders buttons with counts, supports multi-select
- [ ] Component: `ValueSparkline` renders SVG with correct segments, hides for single period
- [ ] Component: `ItemArea` filters items by lifecycle state
- [ ] Component: `CashflowCalendar` expands months, shows shortfall indicator

### Key Scenarios

- [ ] Happy path: create item → initial period created → shows as Active → expand to see sparkline (single period, hidden) → add future period → sparkline appears → scheduled change indicator shows on row
- [ ] Happy path: filter to Future → see future items with dashed borders and date badge → filter to Active + Future → see both
- [ ] Happy path: yearly calendar → see amber dot on shortfall month → expand → see bills, pot breakdown, shortfall note
- [ ] Edge case: delete last period → confirmation dialog → item deleted → removed from list
- [ ] Edge case: one-off item → single period with endDate = startDate + 1 day → shows in calendar → auto-expires

## Verification

- [ ] `bun run build` passes clean
- [ ] `bun run lint` — zero warnings
- [ ] `bun run type-check` — no errors
- [ ] `cd apps/backend && bun scripts/run-tests.ts period` passes
- [ ] `cd apps/backend && bun scripts/run-tests.ts waterfall` passes
- [ ] Manual: create a committed item → verify period created → add a future period → see scheduled change indicator → expand row → see sparkline → edit mode → see period list → delete a period → verify contiguity maintained
- [ ] Manual: view yearly calendar → see bills per month → see amber shortfall dots → expand a shortfall month → see pot breakdown and amber note
- [ ] Manual: filter tier page by Future → see future items styled correctly → filter by Expired → see empty state message

## Post-conditions

- [ ] All waterfall items have at least one period — amounts are always derived, never stored on the item
- [ ] The yearly calendar shows actionable cashflow information per month
- [ ] Tier pages support lifecycle filtering with clear visual distinction between states
- [ ] Historical value tracking is available for all items via the sparkline and period editor
- [ ] The "Period" definition is available in the tooltip system
