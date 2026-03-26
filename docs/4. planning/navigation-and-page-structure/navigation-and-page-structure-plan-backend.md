---
feature: navigation-and-page-structure
spec: docs/4. planning/navigation-and-page-structure/navigation-and-page-structure-spec.md
creation_date: 2026-03-26
status: backlog
implemented_date:
---

# Navigation & Page Structure: Schema & Backend — Implementation Plan

> **For Claude:** Use `/execute-plan navigation-and-page-structure` to implement this plan task-by-task.

> **Purpose:** An ordered, task-by-task build guide. Each task follows TDD red-green-commit and contains complete, ready-to-run code — no "implement X" placeholders. This is the input to `/execute-plan`. The spec defines _what_ to build; this plan defines _how_.

**Goal:** Consolidate the 5 waterfall models into 3 tier-aligned models (IncomeSource, CommittedItem, DiscretionaryItem), add a Subcategory entity with seeded defaults, and update all backend services/routes to use the new schema while maintaining a backward-compatible API response.
**Spec:** `docs/4. planning/navigation-and-page-structure/navigation-and-page-structure-spec.md`
**Architecture:** Introduces a `Subcategory` model (household-scoped, tier-assigned) seeded with defaults on household creation. Merges `CommittedBill` + `YearlyBill` into `CommittedItem` with a `spendType` discriminator. Merges `DiscretionaryCategory` + `SavingsAllocation` into `DiscretionaryItem`. Adds `subcategoryId` and `notes` to `IncomeSource`. A two-phase migration (add new models → migrate data → drop old models) preserves existing data. The `WaterfallSummary` API response shape is preserved for backward compatibility — the service maps from new models to the existing response types, extended with new fields (`subcategoryId`, `notes`, `spendType`). A new `GET /api/waterfall/subcategories/:tier` endpoint is added for tier pages (Plans 2/3).
**Tech Stack:** Fastify · Prisma · tRPC · Zod · React 18 · TanStack Query · Zustand · Tailwind
**Infrastructure Impact:**

- Touches `packages/shared/`: yes
- Requires DB migration: yes

## Pre-conditions

- [x] Existing waterfall models (IncomeSource, CommittedBill, YearlyBill, DiscretionaryCategory, SavingsAllocation) with full CRUD
- [x] Existing Fastify routes at `/api/waterfall/*`
- [x] Existing shared Zod schemas in `packages/shared/src/schemas/waterfall.schemas.ts`
- [x] Existing test infrastructure: Prisma mock (`apps/backend/src/test/mocks/prisma.ts`), fixtures (`apps/backend/src/test/fixtures/`), Fastify test helper

## Tasks

---

### Task 1: Prisma Schema — Add Subcategory, CommittedItem, DiscretionaryItem

**Files:**

- Modify: `apps/backend/prisma/schema.prisma`

- [ ] **Step 1: Write the failing test**

No test for this task — it's a schema-only change. The migration itself validates the schema.

- [ ] **Step 2: Update schema.prisma**

Add the following after the existing `IncomeFrequency` enum block:

```prisma
enum WaterfallTier {
  income
  committed
  discretionary
}

enum SpendType {
  monthly
  yearly
  one_off
}

model Subcategory {
  id          String        @id @default(cuid())
  householdId String
  tier        WaterfallTier
  name        String
  sortOrder   Int           @default(0)
  isLocked    Boolean       @default(false)
  isDefault   Boolean       @default(true)
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt

  incomeItems        IncomeSource[]
  committedItems     CommittedItem[]
  discretionaryItems DiscretionaryItem[]

  @@unique([householdId, tier, name])
}
```

Add the `CommittedItem` model (after the existing `CommittedBill` model — keep old models temporarily):

```prisma
model CommittedItem {
  id             String      @id @default(cuid())
  householdId    String
  subcategoryId  String
  name           String
  amount         Float
  spendType      SpendType   @default(monthly)
  notes          String?
  ownerId        String?
  dueMonth       Int?
  sortOrder      Int         @default(0)
  lastReviewedAt DateTime    @default(now())
  createdAt      DateTime    @default(now())
  updatedAt      DateTime    @updatedAt
  subcategory    Subcategory @relation(fields: [subcategoryId], references: [id])
}
```

Add the `DiscretionaryItem` model (after the existing `SavingsAllocation` model):

```prisma
model DiscretionaryItem {
  id              String      @id @default(cuid())
  householdId     String
  subcategoryId   String
  name            String
  amount          Float
  spendType       SpendType   @default(monthly)
  notes           String?
  wealthAccountId String?
  sortOrder       Int         @default(0)
  lastReviewedAt  DateTime    @default(now())
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt
  subcategory     Subcategory @relation(fields: [subcategoryId], references: [id])
}
```

Add `subcategoryId` and `notes` to `IncomeSource` (nullable for now — made required after data migration):

```prisma
model IncomeSource {
  // ... existing fields ...
  subcategoryId  String?
  notes          String?
  // ... existing fields ...
  subcategory    Subcategory? @relation(fields: [subcategoryId], references: [id])
}
```

- [ ] **Step 3: Run migration**

```bash
cd apps/backend && bunx prisma migrate dev --name add_subcategory_and_consolidated_models
```

- [ ] **Step 4: Commit**

```bash
git add apps/backend/prisma/schema.prisma apps/backend/prisma/migrations/
git commit -m "feat(schema): add Subcategory, CommittedItem, DiscretionaryItem models"
```

---

### Task 2: Shared Schemas — Subcategory types, SpendType, updated inputs

**Files:**

- Modify: `packages/shared/src/schemas/waterfall.schemas.ts`
- Modify: `packages/shared/src/schemas/index.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// packages/shared/src/schemas/waterfall.schemas.test.ts
import { describe, it, expect } from "bun:test";
import {
  SpendTypeEnum,
  WaterfallTierEnum,
  createCommittedItemSchema,
  createDiscretionaryItemSchema,
} from "./waterfall.schemas";

describe("SpendTypeEnum", () => {
  it("accepts valid spend types", () => {
    expect(SpendTypeEnum.safeParse("monthly").success).toBe(true);
    expect(SpendTypeEnum.safeParse("yearly").success).toBe(true);
    expect(SpendTypeEnum.safeParse("one_off").success).toBe(true);
  });

  it("rejects invalid spend type", () => {
    expect(SpendTypeEnum.safeParse("weekly").success).toBe(false);
  });
});

describe("WaterfallTierEnum", () => {
  it("accepts valid tiers", () => {
    expect(WaterfallTierEnum.safeParse("income").success).toBe(true);
    expect(WaterfallTierEnum.safeParse("committed").success).toBe(true);
    expect(WaterfallTierEnum.safeParse("discretionary").success).toBe(true);
  });

  it("rejects surplus as a tier", () => {
    expect(WaterfallTierEnum.safeParse("surplus").success).toBe(false);
  });
});

describe("createCommittedItemSchema", () => {
  it("accepts valid committed item with subcategoryId and notes", () => {
    const result = createCommittedItemSchema.safeParse({
      name: "Rent",
      amount: 1200,
      subcategoryId: "sub-1",
      spendType: "monthly",
      notes: "Fixed rate until 2027",
    });
    expect(result.success).toBe(true);
  });

  it("defaults spendType to monthly", () => {
    const result = createCommittedItemSchema.safeParse({
      name: "Rent",
      amount: 1200,
      subcategoryId: "sub-1",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.spendType).toBe("monthly");
    }
  });

  it("validates notes max length of 500", () => {
    const result = createCommittedItemSchema.safeParse({
      name: "Rent",
      amount: 1200,
      subcategoryId: "sub-1",
      notes: "x".repeat(501),
    });
    expect(result.success).toBe(false);
  });
});

describe("createDiscretionaryItemSchema", () => {
  it("accepts valid discretionary item with optional wealthAccountId", () => {
    const result = createDiscretionaryItemSchema.safeParse({
      name: "Emergency Fund",
      amount: 200,
      subcategoryId: "sub-2",
      wealthAccountId: "wa-1",
    });
    expect(result.success).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd packages/shared && bun test waterfall.schemas`
Expected: FAIL — "SpendTypeEnum is not exported"

- [ ] **Step 3: Write minimal implementation**

Add the following to `packages/shared/src/schemas/waterfall.schemas.ts` (at the top, after existing enum definitions):

```typescript
// ─── New enums ───────────────────────────────────────────────────────────────

export const SpendTypeEnum = z.enum(["monthly", "yearly", "one_off"]);
export type SpendType = z.infer<typeof SpendTypeEnum>;

export const WaterfallTierEnum = z.enum(["income", "committed", "discretionary"]);
export type WaterfallTier = z.infer<typeof WaterfallTierEnum>;

// ─── Subcategory ─────────────────────────────────────────────────────────────

export interface SubcategoryRow {
  id: string;
  householdId: string;
  tier: WaterfallTier;
  name: string;
  sortOrder: number;
  isLocked: boolean;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Committed items (replaces CommittedBill + YearlyBill) ───────────────────

export const createCommittedItemSchema = z.object({
  name: z.string().min(1),
  amount: z.number().positive(),
  subcategoryId: z.string().min(1),
  spendType: SpendTypeEnum.default("monthly"),
  notes: z.string().max(500).nullable().optional(),
  ownerId: z.string().optional(),
  dueMonth: z.number().int().min(1).max(12).optional(),
  sortOrder: z.number().int().optional(),
});

export const updateCommittedItemSchema = z.object({
  name: z.string().min(1).optional(),
  amount: z.number().positive().optional(),
  subcategoryId: z.string().min(1).optional(),
  spendType: SpendTypeEnum.optional(),
  notes: z.string().max(500).nullable().optional(),
  ownerId: z.string().nullable().optional(),
  dueMonth: z.number().int().min(1).max(12).nullable().optional(),
  sortOrder: z.number().int().optional(),
});

export type CreateCommittedItemInput = z.infer<typeof createCommittedItemSchema>;
export type UpdateCommittedItemInput = z.infer<typeof updateCommittedItemSchema>;

// ─── Discretionary items (replaces DiscretionaryCategory + SavingsAllocation) ─

export const createDiscretionaryItemSchema = z.object({
  name: z.string().min(1),
  amount: z.number().positive(),
  subcategoryId: z.string().min(1),
  spendType: SpendTypeEnum.default("monthly"),
  notes: z.string().max(500).nullable().optional(),
  wealthAccountId: z.string().optional(),
  sortOrder: z.number().int().optional(),
});

export const updateDiscretionaryItemSchema = z.object({
  name: z.string().min(1).optional(),
  amount: z.number().positive().optional(),
  subcategoryId: z.string().min(1).optional(),
  spendType: SpendTypeEnum.optional(),
  notes: z.string().max(500).nullable().optional(),
  wealthAccountId: z.string().nullable().optional(),
  sortOrder: z.number().int().optional(),
});

export type CreateDiscretionaryItemInput = z.infer<typeof createDiscretionaryItemSchema>;
export type UpdateDiscretionaryItemInput = z.infer<typeof updateDiscretionaryItemSchema>;
```

Update the existing `createIncomeSourceSchema` — add `subcategoryId` and `notes`:

```typescript
export const createIncomeSourceSchema = z.object({
  name: z.string().min(1),
  amount: z.number().positive(),
  frequency: IncomeFrequencyEnum,
  incomeType: IncomeTypeEnum.default("other"),
  expectedMonth: z.number().int().min(1).max(12).optional(),
  ownerId: z.string().optional(),
  subcategoryId: z.string().min(1).optional(), // optional for backward compat — server assigns default
  notes: z.string().max(500).nullable().optional(),
  sortOrder: z.number().int().optional(),
});

export const updateIncomeSourceSchema = z.object({
  name: z.string().min(1).optional(),
  amount: z.number().positive().optional(),
  frequency: IncomeFrequencyEnum.optional(),
  incomeType: IncomeTypeEnum.optional(),
  expectedMonth: z.number().int().min(1).max(12).nullable().optional(),
  ownerId: z.string().nullable().optional(),
  subcategoryId: z.string().min(1).optional(),
  notes: z.string().max(500).nullable().optional(),
  sortOrder: z.number().int().optional(),
});
```

Update `WaterfallItemTypeEnum` to include new model types:

```typescript
export const WaterfallItemTypeEnum = z.enum([
  "income_source",
  "committed_item",
  "discretionary_item",
  // Legacy (kept for WaterfallHistory backward compat)
  "committed_bill",
  "yearly_bill",
  "discretionary_category",
  "savings_allocation",
]);
```

Extend the existing response interfaces to include new fields:

```typescript
export interface IncomeSourceRow {
  id: string;
  householdId: string;
  name: string;
  amount: number;
  frequency: IncomeFrequency;
  incomeType: IncomeType;
  expectedMonth: number | null;
  ownerId: string | null;
  sortOrder: number;
  endedAt: Date | null;
  lastReviewedAt: Date;
  createdAt: Date;
  updatedAt: Date;
  subcategoryId: string | null;
  notes: string | null;
}

export interface CommittedBillRow {
  id: string;
  householdId: string;
  name: string;
  amount: number;
  ownerId: string | null;
  sortOrder: number;
  lastReviewedAt: Date;
  createdAt: Date;
  updatedAt: Date;
  // New optional fields (always populated by backend, optional for frontend backward compat)
  spendType?: SpendType;
  subcategoryId?: string;
  notes?: string | null;
  dueMonth?: number | null;
}

export interface YearlyBillRow {
  id: string;
  householdId: string;
  name: string;
  amount: number;
  dueMonth: number;
  sortOrder: number;
  lastReviewedAt: Date;
  createdAt: Date;
  updatedAt: Date;
  spendType?: SpendType;
  subcategoryId?: string;
  notes?: string | null;
  ownerId?: string | null;
}

export interface DiscretionaryCategoryRow {
  id: string;
  householdId: string;
  name: string;
  monthlyBudget: number;
  sortOrder: number;
  lastReviewedAt: Date;
  createdAt: Date;
  updatedAt: Date;
  spendType?: SpendType;
  subcategoryId?: string;
  notes?: string | null;
}

export interface SavingsAllocationRow {
  id: string;
  householdId: string;
  name: string;
  monthlyAmount: number;
  sortOrder: number;
  wealthAccountId: string | null;
  lastReviewedAt: Date;
  createdAt: Date;
  updatedAt: Date;
  spendType?: SpendType;
  subcategoryId?: string;
  notes?: string | null;
}
```

Add new exports to `packages/shared/src/schemas/index.ts`:

```typescript
// Add to the waterfall exports block:
  SpendTypeEnum,
  WaterfallTierEnum,
  createCommittedItemSchema,
  updateCommittedItemSchema,
  createDiscretionaryItemSchema,
  updateDiscretionaryItemSchema,
  type SpendType,
  type WaterfallTier,
  type SubcategoryRow,
  type CreateCommittedItemInput,
  type UpdateCommittedItemInput,
  type CreateDiscretionaryItemInput,
  type UpdateDiscretionaryItemInput,
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd packages/shared && bun test waterfall.schemas`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/shared/src/schemas/waterfall.schemas.ts packages/shared/src/schemas/waterfall.schemas.test.ts packages/shared/src/schemas/index.ts
git commit -m "feat(shared): add Subcategory, SpendType, CommittedItem, DiscretionaryItem schemas"
```

---

### Task 3: Subcategory Service — seedDefaults, ensureSubcategories, listByTier

**Files:**

- Create: `apps/backend/src/services/subcategory.service.ts`
- Create: `apps/backend/src/services/subcategory.service.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// apps/backend/src/services/subcategory.service.test.ts
import { describe, it, expect, beforeEach } from "bun:test";
import { mock } from "bun:test";
import { prismaMock, resetPrismaMocks } from "../test/mocks/prisma";

mock.module("../config/database.js", () => ({ prisma: prismaMock }));

const { subcategoryService } = await import("./subcategory.service.js");

beforeEach(() => {
  resetPrismaMocks();
});

describe("subcategoryService.seedDefaults", () => {
  it("creates default subcategories for all three tiers", async () => {
    prismaMock.subcategory.createMany.mockResolvedValue({ count: 13 });

    await subcategoryService.seedDefaults("hh-1");

    expect(prismaMock.subcategory.createMany).toHaveBeenCalledTimes(1);
    const call = prismaMock.subcategory.createMany.mock.calls[0]![0] as any;
    const data = call.data as any[];

    // Income: Salary, Dividends, Other = 3
    const incomeRows = data.filter((r: any) => r.tier === "income");
    expect(incomeRows).toHaveLength(3);
    expect(incomeRows.map((r: any) => r.name)).toEqual(["Salary", "Dividends", "Other"]);

    // Committed: Housing, Utilities, Services, Other = 4
    const committedRows = data.filter((r: any) => r.tier === "committed");
    expect(committedRows).toHaveLength(4);

    // Discretionary: Food, Fun, Clothes, Gifts (locked), Savings, Other = 6
    const discRows = data.filter((r: any) => r.tier === "discretionary");
    expect(discRows).toHaveLength(6);
    const giftsRow = discRows.find((r: any) => r.name === "Gifts");
    expect(giftsRow.isLocked).toBe(true);
  });

  it("sets correct sortOrder per tier", async () => {
    prismaMock.subcategory.createMany.mockResolvedValue({ count: 13 });

    await subcategoryService.seedDefaults("hh-1");

    const call = prismaMock.subcategory.createMany.mock.calls[0]![0] as any;
    const data = call.data as any[];
    const incomeRows = data.filter((r: any) => r.tier === "income");
    expect(incomeRows[0].sortOrder).toBe(0);
    expect(incomeRows[1].sortOrder).toBe(1);
    expect(incomeRows[2].sortOrder).toBe(2);
  });
});

describe("subcategoryService.ensureSubcategories", () => {
  it("seeds defaults when no subcategories exist", async () => {
    prismaMock.subcategory.count.mockResolvedValue(0);
    prismaMock.subcategory.createMany.mockResolvedValue({ count: 13 });

    await subcategoryService.ensureSubcategories("hh-1");

    expect(prismaMock.subcategory.createMany).toHaveBeenCalledTimes(1);
  });

  it("does nothing when subcategories already exist", async () => {
    prismaMock.subcategory.count.mockResolvedValue(12);

    await subcategoryService.ensureSubcategories("hh-1");

    expect(prismaMock.subcategory.createMany).not.toHaveBeenCalled();
  });
});

describe("subcategoryService.listByTier", () => {
  it("returns subcategories for the specified tier", async () => {
    const subs = [
      { id: "sub-1", householdId: "hh-1", tier: "income", name: "Salary", sortOrder: 0 },
      { id: "sub-2", householdId: "hh-1", tier: "income", name: "Dividends", sortOrder: 1 },
    ];
    prismaMock.subcategory.findMany.mockResolvedValue(subs as any);

    const result = await subcategoryService.listByTier("hh-1", "income");

    expect(prismaMock.subcategory.findMany).toHaveBeenCalledWith({
      where: { householdId: "hh-1", tier: "income" },
      orderBy: { sortOrder: "asc" },
    });
    expect(result).toHaveLength(2);
  });
});

describe("subcategoryService.getDefaultSubcategoryId", () => {
  it("returns the 'Other' subcategory id for the tier", async () => {
    prismaMock.subcategory.findFirst.mockResolvedValue({
      id: "sub-other",
      name: "Other",
      tier: "committed",
    } as any);

    const id = await subcategoryService.getDefaultSubcategoryId("hh-1", "committed");
    expect(id).toBe("sub-other");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/backend && bun scripts/run-tests.ts subcategory.service`
Expected: FAIL — "Cannot find module './subcategory.service.js'"

- [ ] **Step 3: Write minimal implementation**

```typescript
// apps/backend/src/services/subcategory.service.ts
import { prisma } from "../config/database.js";

const DEFAULT_SUBCATEGORIES = {
  income: [
    { name: "Salary", sortOrder: 0 },
    { name: "Dividends", sortOrder: 1 },
    { name: "Other", sortOrder: 2 },
  ],
  committed: [
    { name: "Housing", sortOrder: 0 },
    { name: "Utilities", sortOrder: 1 },
    { name: "Services", sortOrder: 2 },
    { name: "Other", sortOrder: 3 },
  ],
  discretionary: [
    { name: "Food", sortOrder: 0 },
    { name: "Fun", sortOrder: 1 },
    { name: "Clothes", sortOrder: 2 },
    { name: "Gifts", sortOrder: 3, isLocked: true },
    { name: "Savings", sortOrder: 4 },
    { name: "Other", sortOrder: 5 },
  ],
} as const;

export const subcategoryService = {
  async seedDefaults(householdId: string) {
    const rows: {
      householdId: string;
      tier: "income" | "committed" | "discretionary";
      name: string;
      sortOrder: number;
      isLocked: boolean;
      isDefault: boolean;
    }[] = [];

    for (const [tier, subs] of Object.entries(DEFAULT_SUBCATEGORIES)) {
      for (const sub of subs) {
        rows.push({
          householdId,
          tier: tier as "income" | "committed" | "discretionary",
          name: sub.name,
          sortOrder: sub.sortOrder,
          isLocked: "isLocked" in sub ? sub.isLocked : false,
          isDefault: true,
        });
      }
    }

    await prisma.subcategory.createMany({ data: rows });
  },

  async ensureSubcategories(householdId: string) {
    const count = await prisma.subcategory.count({ where: { householdId } });
    if (count === 0) {
      await this.seedDefaults(householdId);
    }
  },

  async listByTier(householdId: string, tier: string) {
    return prisma.subcategory.findMany({
      where: { householdId, tier: tier as any },
      orderBy: { sortOrder: "asc" },
    });
  },

  async getDefaultSubcategoryId(householdId: string, tier: string): Promise<string> {
    const sub = await prisma.subcategory.findFirst({
      where: { householdId, tier: tier as any, name: "Other" },
    });
    return sub!.id;
  },

  async getSubcategoryIdByName(
    householdId: string,
    tier: string,
    name: string
  ): Promise<string | null> {
    const sub = await prisma.subcategory.findFirst({
      where: { householdId, tier: tier as any, name },
    });
    return sub?.id ?? null;
  },
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/backend && bun scripts/run-tests.ts subcategory.service`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/backend/src/services/subcategory.service.ts apps/backend/src/services/subcategory.service.test.ts
git commit -m "feat(backend): add subcategory service with seeding and listing"
```

---

### Task 4: Data Migration Script

**Files:**

- Create: `apps/backend/prisma/migrate-to-subcategories.ts`

- [ ] **Step 1: Write the migration script**

This is a one-time script, not TDD. It runs between Phase 1 (new models exist alongside old) and Phase 2 (old models dropped).

```typescript
// apps/backend/prisma/migrate-to-subcategories.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const DEFAULT_SUBCATEGORIES = {
  income: [
    { name: "Salary", sortOrder: 0 },
    { name: "Dividends", sortOrder: 1 },
    { name: "Other", sortOrder: 2 },
  ],
  committed: [
    { name: "Housing", sortOrder: 0 },
    { name: "Utilities", sortOrder: 1 },
    { name: "Services", sortOrder: 2 },
    { name: "Other", sortOrder: 3 },
  ],
  discretionary: [
    { name: "Food", sortOrder: 0 },
    { name: "Fun", sortOrder: 1 },
    { name: "Clothes", sortOrder: 2 },
    { name: "Gifts", sortOrder: 3, isLocked: true },
    { name: "Savings", sortOrder: 4 },
    { name: "Other", sortOrder: 5 },
  ],
} as const;

const INCOME_TYPE_TO_SUBCATEGORY: Record<string, string> = {
  salary: "Salary",
  dividends: "Dividends",
  freelance: "Other",
  rental: "Other",
  benefits: "Other",
  other: "Other",
};

async function main() {
  console.log("Starting data migration to subcategory model...");

  // 1. Get all households
  const households = await prisma.household.findMany({ select: { id: true } });
  console.log(`Found ${households.length} households`);

  for (const household of households) {
    const hid = household.id;
    console.log(`\nMigrating household ${hid}...`);

    // 2. Seed subcategories for this household
    const existingCount = await prisma.subcategory.count({ where: { householdId: hid } });
    if (existingCount > 0) {
      console.log(`  Subcategories already exist (${existingCount}), skipping seed`);
    } else {
      const rows: any[] = [];
      for (const [tier, subs] of Object.entries(DEFAULT_SUBCATEGORIES)) {
        for (const sub of subs) {
          rows.push({
            householdId: hid,
            tier,
            name: sub.name,
            sortOrder: sub.sortOrder,
            isLocked: "isLocked" in sub ? sub.isLocked : false,
            isDefault: true,
          });
        }
      }
      await prisma.subcategory.createMany({ data: rows });
      console.log(`  Seeded ${rows.length} subcategories`);
    }

    // Build subcategory lookup
    const subcategories = await prisma.subcategory.findMany({ where: { householdId: hid } });
    const subLookup = new Map<string, string>();
    for (const sub of subcategories) {
      subLookup.set(`${sub.tier}:${sub.name}`, sub.id);
    }

    const getSubId = (tier: string, name: string): string => {
      return subLookup.get(`${tier}:${name}`) ?? subLookup.get(`${tier}:Other`)!;
    };

    // 3. Migrate CommittedBill → CommittedItem (spendType=monthly)
    const bills = await prisma.committedBill.findMany({ where: { householdId: hid } });
    for (const bill of bills) {
      await prisma.committedItem.create({
        data: {
          id: bill.id, // preserve ID for WaterfallHistory references
          householdId: hid,
          subcategoryId: getSubId("committed", "Other"),
          name: bill.name,
          amount: bill.amount,
          spendType: "monthly",
          ownerId: bill.ownerId,
          sortOrder: bill.sortOrder,
          lastReviewedAt: bill.lastReviewedAt,
          createdAt: bill.createdAt,
          updatedAt: bill.updatedAt,
        },
      });
    }
    console.log(`  Migrated ${bills.length} committed bills → CommittedItem`);

    // 4. Migrate YearlyBill → CommittedItem (spendType=yearly)
    const yearlyBills = await prisma.yearlyBill.findMany({ where: { householdId: hid } });
    for (const yb of yearlyBills) {
      await prisma.committedItem.create({
        data: {
          id: yb.id,
          householdId: hid,
          subcategoryId: getSubId("committed", "Other"),
          name: yb.name,
          amount: yb.amount,
          spendType: "yearly",
          dueMonth: yb.dueMonth,
          sortOrder: yb.sortOrder,
          lastReviewedAt: yb.lastReviewedAt,
          createdAt: yb.createdAt,
          updatedAt: yb.updatedAt,
        },
      });
    }
    console.log(`  Migrated ${yearlyBills.length} yearly bills → CommittedItem`);

    // 5. Migrate DiscretionaryCategory → DiscretionaryItem
    const cats = await prisma.discretionaryCategory.findMany({ where: { householdId: hid } });
    for (const cat of cats) {
      await prisma.discretionaryItem.create({
        data: {
          id: cat.id,
          householdId: hid,
          subcategoryId: getSubId("discretionary", "Other"),
          name: cat.name,
          amount: cat.monthlyBudget,
          spendType: "monthly",
          sortOrder: cat.sortOrder,
          lastReviewedAt: cat.lastReviewedAt,
          createdAt: cat.createdAt,
          updatedAt: cat.updatedAt,
        },
      });
    }
    console.log(`  Migrated ${cats.length} discretionary categories → DiscretionaryItem`);

    // 6. Migrate SavingsAllocation → DiscretionaryItem (in Savings subcategory)
    const savings = await prisma.savingsAllocation.findMany({ where: { householdId: hid } });
    for (const sav of savings) {
      await prisma.discretionaryItem.create({
        data: {
          id: sav.id,
          householdId: hid,
          subcategoryId: getSubId("discretionary", "Savings"),
          name: sav.name,
          amount: sav.monthlyAmount,
          spendType: "monthly",
          wealthAccountId: sav.wealthAccountId,
          sortOrder: sav.sortOrder,
          lastReviewedAt: sav.lastReviewedAt,
          createdAt: sav.createdAt,
          updatedAt: sav.updatedAt,
        },
      });
    }
    console.log(`  Migrated ${savings.length} savings allocations → DiscretionaryItem`);

    // 7. Set subcategoryId on IncomeSource based on incomeType
    const incomeSources = await prisma.incomeSource.findMany({ where: { householdId: hid } });
    for (const src of incomeSources) {
      const subcategoryName = INCOME_TYPE_TO_SUBCATEGORY[src.incomeType] ?? "Other";
      const subcategoryId = getSubId("income", subcategoryName);
      await prisma.incomeSource.update({
        where: { id: src.id },
        data: { subcategoryId },
      });
    }
    console.log(`  Set subcategoryId on ${incomeSources.length} income sources`);
  }

  // 8. Update WaterfallHistory itemType values
  await prisma.$executeRaw`UPDATE "WaterfallHistory" SET "itemType" = 'committed_item' WHERE "itemType" IN ('committed_bill', 'yearly_bill')`;
  await prisma.$executeRaw`UPDATE "WaterfallHistory" SET "itemType" = 'discretionary_item' WHERE "itemType" IN ('discretionary_category', 'savings_allocation')`;
  console.log("\nUpdated WaterfallHistory itemType values");

  console.log("\nData migration complete!");
}

main()
  .catch((e) => {
    console.error("Migration failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
```

- [ ] **Step 2: Run migration script**

```bash
cd apps/backend && bun prisma/migrate-to-subcategories.ts
```

- [ ] **Step 3: Commit**

```bash
git add apps/backend/prisma/migrate-to-subcategories.ts
git commit -m "feat(backend): add data migration script for subcategory model consolidation"
```

---

### Task 5: Prisma Schema — Finalize (make required, drop old models)

**Files:**

- Modify: `apps/backend/prisma/schema.prisma`

- [ ] **Step 1: Make subcategoryId required on IncomeSource**

Change `subcategoryId` from `String?` to `String` and `subcategory` from `Subcategory?` to `Subcategory`:

```prisma
model IncomeSource {
  // ...
  subcategoryId  String
  notes          String?
  // ...
  subcategory    Subcategory @relation(fields: [subcategoryId], references: [id])
}
```

- [ ] **Step 2: Remove old models**

Delete these model blocks from `schema.prisma`:

- `CommittedBill`
- `YearlyBill`
- `DiscretionaryCategory`
- `SavingsAllocation`

Update `WaterfallItemType` enum to only include new values:

```prisma
enum WaterfallItemType {
  income_source
  committed_item
  discretionary_item
}
```

- [ ] **Step 3: Run migration**

```bash
cd apps/backend && bunx prisma migrate dev --name finalize_model_consolidation
```

- [ ] **Step 4: Commit**

```bash
git add apps/backend/prisma/schema.prisma apps/backend/prisma/migrations/
git commit -m "feat(schema): finalize model consolidation — drop old models, make subcategoryId required"
```

---

### Task 6: Test Infrastructure — Update Prisma mock, fixtures, and scenarios

**Files:**

- Modify: `apps/backend/src/test/mocks/prisma.ts`
- Modify: `apps/backend/src/test/fixtures/scenarios.ts`
- Modify: `apps/backend/src/test/fixtures/index.ts`

- [ ] **Step 1: Update Prisma mock**

In `apps/backend/src/test/mocks/prisma.ts`:

First, add `createMany` to `buildModelMock()`:

```typescript
function buildModelMock() {
  return {
    findUnique: mock(() => {}),
    findFirst: mock(() => {}),
    findMany: mock(() => {}),
    create: mock(() => {}),
    createMany: mock(() => {}),
    update: mock(() => {}),
    upsert: mock(() => {}),
    updateMany: mock(() => {}),
    delete: mock(() => {}),
    deleteMany: mock(() => {}),
    count: mock(() => {}),
    aggregate: mock(() => {}),
    groupBy: mock(() => {}),
  };
}
```

Then replace old model mocks with new ones. Remove:

```typescript
  committedBill: buildModelMock(),
  yearlyBill: buildModelMock(),
  discretionaryCategory: buildModelMock(),
  savingsAllocation: buildModelMock(),
```

Add:

```typescript
  subcategory: buildModelMock(),
  committedItem: buildModelMock(),
  discretionaryItem: buildModelMock(),
```

- [ ] **Step 2: Update test fixtures**

Add to `apps/backend/src/test/fixtures/index.ts`:

```typescript
export function buildSubcategory(overrides: Record<string, any> = {}) {
  const id = nextId();
  return {
    id,
    householdId: "household-1",
    tier: "committed" as const,
    name: "Other",
    sortOrder: 0,
    isLocked: false,
    isDefault: true,
    createdAt: new Date("2025-01-01T00:00:00Z"),
    updatedAt: new Date("2025-01-01T00:00:00Z"),
    ...overrides,
  };
}

export function buildCommittedItem(overrides: Record<string, any> = {}) {
  const id = nextId();
  return {
    id,
    householdId: "household-1",
    subcategoryId: "sub-other-committed",
    name: "Test Bill",
    amount: 100,
    spendType: "monthly" as const,
    notes: null,
    ownerId: null,
    dueMonth: null,
    sortOrder: 0,
    lastReviewedAt: new Date("2025-01-01T00:00:00Z"),
    createdAt: new Date("2025-01-01T00:00:00Z"),
    updatedAt: new Date("2025-01-01T00:00:00Z"),
    ...overrides,
  };
}

export function buildDiscretionaryItem(overrides: Record<string, any> = {}) {
  const id = nextId();
  return {
    id,
    householdId: "household-1",
    subcategoryId: "sub-other-disc",
    name: "Test Category",
    amount: 100,
    spendType: "monthly" as const,
    notes: null,
    wealthAccountId: null,
    sortOrder: 0,
    lastReviewedAt: new Date("2025-01-01T00:00:00Z"),
    createdAt: new Date("2025-01-01T00:00:00Z"),
    updatedAt: new Date("2025-01-01T00:00:00Z"),
    ...overrides,
  };
}
```

- [ ] **Step 3: Update scenario fixtures**

In `apps/backend/src/test/fixtures/scenarios.ts`, update all scenarios to use new model shapes. The key changes for `dualIncomeHousehold`:

Replace `committedBills` and `yearlyBills` with `committedItems`:

```typescript
  committedItems: [
    {
      id: "bill-rent",
      householdId: "hh-dual",
      subcategoryId: "sub-housing-dual",
      name: "Rent",
      amount: 1200,
      spendType: "monthly" as const,
      notes: null,
      ownerId: null,
      dueMonth: null,
      sortOrder: 0,
      lastReviewedAt: now,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "bill-internet",
      householdId: "hh-dual",
      subcategoryId: "sub-utilities-dual",
      name: "Internet",
      amount: 45,
      spendType: "monthly" as const,
      notes: null,
      ownerId: null,
      dueMonth: null,
      sortOrder: 1,
      lastReviewedAt: now,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "yearly-insurance",
      householdId: "hh-dual",
      subcategoryId: "sub-services-dual",
      name: "Home Insurance",
      amount: 600,
      spendType: "yearly" as const,
      notes: null,
      ownerId: null,
      dueMonth: 9,
      sortOrder: 2,
      lastReviewedAt: now,
      createdAt: now,
      updatedAt: now,
    },
  ],
```

Replace `discretionaryCategories` and `savingsAllocations` with `discretionaryItems`:

```typescript
  discretionaryItems: [
    {
      id: "disc-groceries",
      householdId: "hh-dual",
      subcategoryId: "sub-food-dual",
      name: "Groceries",
      amount: 500,
      spendType: "monthly" as const,
      notes: null,
      wealthAccountId: null,
      sortOrder: 0,
      lastReviewedAt: now,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "disc-dining",
      householdId: "hh-dual",
      subcategoryId: "sub-fun-dual",
      name: "Dining Out",
      amount: 150,
      spendType: "monthly" as const,
      notes: null,
      wealthAccountId: null,
      sortOrder: 1,
      lastReviewedAt: now,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "sav-emergency",
      householdId: "hh-dual",
      subcategoryId: "sub-savings-dual",
      name: "Emergency Fund",
      amount: 200,
      spendType: "monthly" as const,
      notes: null,
      wealthAccountId: "wa-isa",
      sortOrder: 2,
      lastReviewedAt: now,
      createdAt: now,
      updatedAt: now,
    },
  ],
```

Apply the same pattern to `emptyHousehold` (replace empty arrays) and `complexHousehold`.

Also update `incomeSources` in all scenarios to add `subcategoryId` and `notes`:

```typescript
    {
      id: "inc-alice",
      // ... existing fields ...
      subcategoryId: "sub-salary-dual",
      notes: null,
    },
```

Update `settings.stalenessThresholds` keys from old names to new:

```typescript
    stalenessThresholds: {
      income_source: 12,
      committed_item: 6,
      discretionary_item: 12,
      wealth_account: 3,
    },
```

Also update the existing fixture-based service tests in `apps/backend/src/services/waterfall.service.test.ts`. The tests at the bottom that use `emptyHousehold.committedBills`, `dualIncomeHousehold.committedBills`, etc. must be updated to reference the new scenario property names:

- `emptyHousehold.committedBills` → `emptyHousehold.committedItems`
- `emptyHousehold.yearlyBills` → (removed — merged into `committedItems`)
- `emptyHousehold.discretionaryCategories` → `emptyHousehold.discretionaryItems`
- `emptyHousehold.savingsAllocations` → (removed — merged into `discretionaryItems`)
- `prismaMock.committedBill.findMany` → `prismaMock.committedItem.findMany`
- `prismaMock.yearlyBill.findMany` → (remove — committed items already loaded)
- `prismaMock.discretionaryCategory.findMany` → `prismaMock.discretionaryItem.findMany`
- `prismaMock.savingsAllocation.findMany` → (remove — discretionary items already loaded)

For the `dualIncomeHousehold` scenario test, the mock setup becomes:

```typescript
prismaMock.incomeSource.findMany.mockResolvedValue(dualIncomeHousehold.incomeSources as any);
prismaMock.committedItem.findMany.mockResolvedValue(dualIncomeHousehold.committedItems as any);
prismaMock.discretionaryItem.findMany.mockResolvedValue(
  dualIncomeHousehold.discretionaryItems as any
);
prismaMock.subcategory.findFirst.mockResolvedValue({
  id: "sub-savings-dual",
  name: "Savings",
} as any);
```

The `emptyHousehold` test similarly uses the new mock model names with empty arrays.

Also update the `beforeEach` blocks in the existing `byType` and `totals` test suites to use new model names:

```typescript
beforeEach(() => {
  prismaMock.committedItem.findMany.mockResolvedValue([]);
  prismaMock.discretionaryItem.findMany.mockResolvedValue([]);
  prismaMock.subcategory.findFirst.mockResolvedValue(null);
});
```

Also update `packages/shared/src/schemas/settings.schemas.ts` — change `stalenessThresholdsSchema` keys from old model names to new:

Replace keys `committed_bill`, `yearly_bill`, `discretionary_category`, `savings_allocation` with `committed_item`, `discretionary_item` in the schema definition.

Update the `HouseholdSettings` model default in `apps/backend/prisma/schema.prisma`:

```prisma
  stalenessThresholds Json     @default("{\"income_source\":12,\"committed_item\":6,\"discretionary_item\":12,\"wealth_account\":3}")
```

- [ ] **Step 4: Commit**

```bash
git add apps/backend/src/test/mocks/prisma.ts apps/backend/src/test/fixtures/ apps/backend/src/services/waterfall.service.test.ts packages/shared/src/schemas/settings.schemas.ts apps/backend/prisma/schema.prisma
git commit -m "test(backend): update mocks, fixtures, staleness keys for consolidated waterfall models"
```

---

### Task 7: Waterfall Service — Committed + Yearly CRUD (CommittedItem)

**Files:**

- Modify: `apps/backend/src/services/waterfall.service.ts`
- Modify: `apps/backend/src/services/waterfall.service.test.ts`

- [ ] **Step 1: Write the failing test**

Add to `apps/backend/src/services/waterfall.service.test.ts`:

```typescript
describe("waterfallService.createCommitted (CommittedItem)", () => {
  it("creates a committed item with subcategoryId and notes", async () => {
    prismaMock.committedItem.create.mockResolvedValue({
      id: "ci-1",
      householdId: "hh-1",
      subcategoryId: "sub-1",
      name: "Rent",
      amount: 1200,
      spendType: "monthly",
      notes: "Fixed rate until 2027",
    } as any);
    prismaMock.waterfallHistory.create.mockResolvedValue({} as any);

    const result = await waterfallService.createCommitted("hh-1", {
      name: "Rent",
      amount: 1200,
      subcategoryId: "sub-1",
      notes: "Fixed rate until 2027",
    });

    expect(result.subcategoryId).toBe("sub-1");
    expect(result.notes).toBe("Fixed rate until 2027");
    expect(prismaMock.committedItem.create).toHaveBeenCalled();
  });
});

describe("waterfallService.createYearly (CommittedItem with spendType=yearly)", () => {
  it("creates a committed item with spendType=yearly and dueMonth", async () => {
    prismaMock.committedItem.create.mockResolvedValue({
      id: "ci-2",
      householdId: "hh-1",
      name: "Insurance",
      amount: 600,
      spendType: "yearly",
      dueMonth: 3,
    } as any);
    prismaMock.waterfallHistory.create.mockResolvedValue({} as any);

    const result = await waterfallService.createYearly("hh-1", {
      name: "Insurance",
      amount: 600,
      subcategoryId: "sub-1",
      dueMonth: 3,
    });

    expect(result.spendType).toBe("yearly");
    expect(result.dueMonth).toBe(3);
  });
});

describe("waterfallService.updateCommitted (CommittedItem)", () => {
  it("records history when amount changes", async () => {
    prismaMock.committedItem.findUnique.mockResolvedValue({
      id: "ci-1",
      householdId: "hh-1",
      amount: 1200,
    } as any);
    prismaMock.committedItem.update.mockResolvedValue({ id: "ci-1", amount: 1300 } as any);
    prismaMock.waterfallHistory.create.mockResolvedValue({} as any);

    await waterfallService.updateCommitted("hh-1", "ci-1", { amount: 1300 });

    expect(prismaMock.waterfallHistory.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        itemType: "committed_item",
        itemId: "ci-1",
        value: 1300,
      }),
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/backend && bun scripts/run-tests.ts waterfall.service`
Expected: FAIL — service still references `prismaMock.committedBill`

- [ ] **Step 3: Write minimal implementation**

In `apps/backend/src/services/waterfall.service.ts`, rewrite the committed/yearly sections to use `CommittedItem`:

```typescript
  // ─── Committed items ──────────────────────────────────────────────────────────

  async listCommitted(householdId: string) {
    return prisma.committedItem.findMany({
      where: { householdId, spendType: "monthly" },
      orderBy: { sortOrder: "asc" },
    });
  },

  async createCommitted(householdId: string, data: CreateCommittedItemInput) {
    const item = await prisma.committedItem.create({
      data: {
        ...data,
        householdId,
        spendType: data.spendType ?? "monthly",
        lastReviewedAt: new Date(),
      },
    });
    await recordHistory("committed_item", item.id, item.amount);
    return item;
  },

  async updateCommitted(householdId: string, id: string, data: UpdateCommittedItemInput) {
    const existing = await prisma.committedItem.findUnique({ where: { id } });
    assertOwned(existing, householdId, "Committed item");

    const updated = await prisma.committedItem.update({
      where: { id },
      data: { ...data, lastReviewedAt: new Date() },
    });

    if (data.amount !== undefined && data.amount !== existing!.amount) {
      await recordHistory("committed_item", id, updated.amount);
    }

    return updated;
  },

  async deleteCommitted(householdId: string, id: string) {
    const existing = await prisma.committedItem.findUnique({ where: { id } });
    assertOwned(existing, householdId, "Committed item");
    await prisma.committedItem.delete({ where: { id } });
  },

  async confirmCommitted(householdId: string, id: string) {
    const existing = await prisma.committedItem.findUnique({ where: { id } });
    assertOwned(existing, householdId, "Committed item");
    return prisma.committedItem.update({ where: { id }, data: { lastReviewedAt: new Date() } });
  },

  // ─── Yearly items (CommittedItem with spendType=yearly) ─────────────────────

  async listYearly(householdId: string) {
    return prisma.committedItem.findMany({
      where: { householdId, spendType: "yearly" },
      orderBy: { sortOrder: "asc" },
    });
  },

  async createYearly(householdId: string, data: CreateCommittedItemInput) {
    const item = await prisma.committedItem.create({
      data: {
        ...data,
        householdId,
        spendType: "yearly",
        lastReviewedAt: new Date(),
      },
    });
    await recordHistory("committed_item", item.id, item.amount);
    return item;
  },

  async updateYearly(householdId: string, id: string, data: UpdateCommittedItemInput) {
    const existing = await prisma.committedItem.findUnique({ where: { id } });
    assertOwned(existing, householdId, "Committed item");

    const updated = await prisma.committedItem.update({
      where: { id },
      data: { ...data, lastReviewedAt: new Date() },
    });

    if (data.amount !== undefined && data.amount !== existing!.amount) {
      await recordHistory("committed_item", id, updated.amount);
    }

    return updated;
  },

  async deleteYearly(householdId: string, id: string) {
    const existing = await prisma.committedItem.findUnique({ where: { id } });
    assertOwned(existing, householdId, "Committed item");
    await prisma.committedItem.delete({ where: { id } });
  },

  async confirmYearly(householdId: string, id: string) {
    const existing = await prisma.committedItem.findUnique({ where: { id } });
    assertOwned(existing, householdId, "Committed item");
    return prisma.committedItem.update({ where: { id }, data: { lastReviewedAt: new Date() } });
  },
```

Update the import at the top to include new input types:

```typescript
import type {
  CreateIncomeSourceInput,
  UpdateIncomeSourceInput,
  EndIncomeSourceInput,
  CreateCommittedItemInput,
  UpdateCommittedItemInput,
  CreateDiscretionaryItemInput,
  UpdateDiscretionaryItemInput,
  ConfirmBatchInput,
  WaterfallSummary,
  CashflowMonth,
  IncomeType,
  IncomeByType,
  IncomeSourceRow,
} from "@finplan/shared";
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/backend && bun scripts/run-tests.ts waterfall.service`
Expected: PASS (new committed tests pass; existing tests that reference old models will still fail — fixed in Task 10)

- [ ] **Step 5: Commit**

```bash
git add apps/backend/src/services/waterfall.service.ts apps/backend/src/services/waterfall.service.test.ts
git commit -m "refactor(backend): rewrite committed/yearly CRUD to use CommittedItem model"
```

---

### Task 8: Waterfall Service — Discretionary + Savings CRUD (DiscretionaryItem)

**Files:**

- Modify: `apps/backend/src/services/waterfall.service.ts`
- Modify: `apps/backend/src/services/waterfall.service.test.ts`

- [ ] **Step 1: Write the failing test**

Add to `apps/backend/src/services/waterfall.service.test.ts`:

```typescript
describe("waterfallService.createDiscretionary (DiscretionaryItem)", () => {
  it("creates a discretionary item with subcategoryId", async () => {
    prismaMock.discretionaryItem.create.mockResolvedValue({
      id: "di-1",
      householdId: "hh-1",
      subcategoryId: "sub-food",
      name: "Groceries",
      amount: 500,
      spendType: "monthly",
      notes: null,
    } as any);
    prismaMock.waterfallHistory.create.mockResolvedValue({} as any);

    const result = await waterfallService.createDiscretionary("hh-1", {
      name: "Groceries",
      amount: 500,
      subcategoryId: "sub-food",
    });

    expect(result.subcategoryId).toBe("sub-food");
    expect(prismaMock.discretionaryItem.create).toHaveBeenCalled();
  });
});

describe("waterfallService.createSavings (DiscretionaryItem)", () => {
  it("creates a discretionary item with wealthAccountId", async () => {
    prismaMock.discretionaryItem.create.mockResolvedValue({
      id: "di-2",
      householdId: "hh-1",
      subcategoryId: "sub-savings",
      name: "Emergency Fund",
      amount: 200,
      wealthAccountId: "wa-1",
    } as any);
    prismaMock.waterfallHistory.create.mockResolvedValue({} as any);

    const result = await waterfallService.createSavings("hh-1", {
      name: "Emergency Fund",
      amount: 200,
      subcategoryId: "sub-savings",
      wealthAccountId: "wa-1",
    });

    expect(result.wealthAccountId).toBe("wa-1");
  });
});

describe("waterfallService.updateDiscretionary (DiscretionaryItem)", () => {
  it("records history when amount changes", async () => {
    prismaMock.discretionaryItem.findUnique.mockResolvedValue({
      id: "di-1",
      householdId: "hh-1",
      amount: 500,
    } as any);
    prismaMock.discretionaryItem.update.mockResolvedValue({ id: "di-1", amount: 600 } as any);
    prismaMock.waterfallHistory.create.mockResolvedValue({} as any);

    await waterfallService.updateDiscretionary("hh-1", "di-1", { amount: 600 });

    expect(prismaMock.waterfallHistory.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        itemType: "discretionary_item",
        itemId: "di-1",
        value: 600,
      }),
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/backend && bun scripts/run-tests.ts waterfall.service`
Expected: FAIL — service still references `prismaMock.discretionaryCategory`

- [ ] **Step 3: Write minimal implementation**

In `apps/backend/src/services/waterfall.service.ts`, rewrite the discretionary/savings sections:

```typescript
  // ─── Discretionary items ────────────────────────────────────────────────────

  async listDiscretionary(householdId: string) {
    // Exclude savings-subcategory items (those are returned by listSavings)
    const savingsSubcategory = await prisma.subcategory.findFirst({
      where: { householdId, tier: "discretionary", name: "Savings" },
    });
    return prisma.discretionaryItem.findMany({
      where: {
        householdId,
        ...(savingsSubcategory ? { subcategoryId: { not: savingsSubcategory.id } } : {}),
      },
      orderBy: { sortOrder: "asc" },
    });
  },

  async createDiscretionary(householdId: string, data: CreateDiscretionaryItemInput) {
    const item = await prisma.discretionaryItem.create({
      data: {
        ...data,
        householdId,
        spendType: data.spendType ?? "monthly",
        lastReviewedAt: new Date(),
      },
    });
    await recordHistory("discretionary_item", item.id, item.amount);
    return item;
  },

  async updateDiscretionary(householdId: string, id: string, data: UpdateDiscretionaryItemInput) {
    const existing = await prisma.discretionaryItem.findUnique({ where: { id } });
    assertOwned(existing, householdId, "Discretionary item");

    const updated = await prisma.discretionaryItem.update({
      where: { id },
      data: { ...data, lastReviewedAt: new Date() },
    });

    if (data.amount !== undefined && data.amount !== existing!.amount) {
      await recordHistory("discretionary_item", id, updated.amount);
    }

    return updated;
  },

  async deleteDiscretionary(householdId: string, id: string) {
    const existing = await prisma.discretionaryItem.findUnique({ where: { id } });
    assertOwned(existing, householdId, "Discretionary item");
    await prisma.discretionaryItem.delete({ where: { id } });
  },

  async confirmDiscretionary(householdId: string, id: string) {
    const existing = await prisma.discretionaryItem.findUnique({ where: { id } });
    assertOwned(existing, householdId, "Discretionary item");
    return prisma.discretionaryItem.update({
      where: { id },
      data: { lastReviewedAt: new Date() },
    });
  },

  // ─── Savings (DiscretionaryItem with wealthAccountId) ───────────────────────

  async listSavings(householdId: string) {
    // Savings items are DiscretionaryItems in the "Savings" subcategory
    // For backward compat, we find savings-subcategory items by checking subcategory name
    const savingsSubcategory = await prisma.subcategory.findFirst({
      where: { householdId, tier: "discretionary", name: "Savings" },
    });
    if (!savingsSubcategory) return [];
    return prisma.discretionaryItem.findMany({
      where: { householdId, subcategoryId: savingsSubcategory.id },
      orderBy: { sortOrder: "asc" },
    });
  },

  async createSavings(householdId: string, data: CreateDiscretionaryItemInput) {
    const item = await prisma.discretionaryItem.create({
      data: {
        ...data,
        householdId,
        spendType: data.spendType ?? "monthly",
        lastReviewedAt: new Date(),
      },
    });
    await recordHistory("discretionary_item", item.id, item.amount);
    return item;
  },

  async updateSavings(householdId: string, id: string, data: UpdateDiscretionaryItemInput) {
    const existing = await prisma.discretionaryItem.findUnique({ where: { id } });
    assertOwned(existing, householdId, "Savings allocation");

    const updated = await prisma.discretionaryItem.update({
      where: { id },
      data: { ...data, lastReviewedAt: new Date() },
    });

    if (data.amount !== undefined && data.amount !== existing!.amount) {
      await recordHistory("discretionary_item", id, updated.amount);
    }

    return updated;
  },

  async deleteSavings(householdId: string, id: string) {
    const existing = await prisma.discretionaryItem.findUnique({ where: { id } });
    assertOwned(existing, householdId, "Savings allocation");
    await prisma.discretionaryItem.delete({ where: { id } });
  },

  async confirmSavings(householdId: string, id: string) {
    const existing = await prisma.discretionaryItem.findUnique({ where: { id } });
    assertOwned(existing, householdId, "Savings allocation");
    return prisma.discretionaryItem.update({
      where: { id },
      data: { lastReviewedAt: new Date() },
    });
  },
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/backend && bun scripts/run-tests.ts waterfall.service`
Expected: PASS (new discretionary/savings tests pass)

- [ ] **Step 5: Commit**

```bash
git add apps/backend/src/services/waterfall.service.ts apps/backend/src/services/waterfall.service.test.ts
git commit -m "refactor(backend): rewrite discretionary/savings CRUD to use DiscretionaryItem model"
```

---

### Task 9: Waterfall Service — Summary, Cashflow, deleteAll, confirmBatch

**Files:**

- Modify: `apps/backend/src/services/waterfall.service.ts`
- Modify: `apps/backend/src/services/waterfall.service.test.ts`

- [ ] **Step 1: Write the failing test**

Rewrite the summary and utility tests in `apps/backend/src/services/waterfall.service.test.ts`:

```typescript
describe("waterfallService.getWaterfallSummary — consolidated models", () => {
  const makeSource = (overrides: object) => ({
    id: "s1",
    householdId: "hh-1",
    name: "Source",
    amount: 1000,
    frequency: "monthly" as const,
    incomeType: "other" as const,
    expectedMonth: null,
    ownerId: null,
    sortOrder: 0,
    endedAt: null,
    lastReviewedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    subcategoryId: "sub-other-inc",
    notes: null,
    ...overrides,
  });

  beforeEach(() => {
    prismaMock.committedItem.findMany.mockResolvedValue([]);
    prismaMock.discretionaryItem.findMany.mockResolvedValue([]);
    prismaMock.subcategory.findFirst.mockResolvedValue(null);
  });

  it("splits committed items into bills and yearlyBills by spendType", async () => {
    prismaMock.incomeSource.findMany.mockResolvedValue([]);
    prismaMock.committedItem.findMany.mockResolvedValue([
      {
        id: "ci-1",
        householdId: "hh-1",
        name: "Rent",
        amount: 1200,
        spendType: "monthly",
        dueMonth: null,
        ownerId: null,
        sortOrder: 0,
        lastReviewedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        subcategoryId: "sub-1",
        notes: null,
      },
      {
        id: "ci-2",
        householdId: "hh-1",
        name: "Insurance",
        amount: 600,
        spendType: "yearly",
        dueMonth: 3,
        ownerId: null,
        sortOrder: 1,
        lastReviewedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        subcategoryId: "sub-2",
        notes: null,
      },
    ] as any);

    const summary = await waterfallService.getWaterfallSummary("hh-1");

    expect(summary.committed.bills).toHaveLength(1);
    expect(summary.committed.bills[0]!.name).toBe("Rent");
    expect(summary.committed.yearlyBills).toHaveLength(1);
    expect(summary.committed.yearlyBills[0]!.name).toBe("Insurance");
  });

  it("splits discretionary items into categories and savings", async () => {
    prismaMock.incomeSource.findMany.mockResolvedValue([]);
    prismaMock.discretionaryItem.findMany.mockResolvedValue([
      {
        id: "di-1",
        householdId: "hh-1",
        name: "Groceries",
        amount: 500,
        spendType: "monthly",
        subcategoryId: "sub-food",
        notes: null,
        wealthAccountId: null,
        sortOrder: 0,
        lastReviewedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "di-2",
        householdId: "hh-1",
        name: "Emergency Fund",
        amount: 200,
        spendType: "monthly",
        subcategoryId: "sub-savings",
        notes: null,
        wealthAccountId: "wa-1",
        sortOrder: 1,
        lastReviewedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ] as any);
    prismaMock.subcategory.findFirst.mockResolvedValue({
      id: "sub-savings",
      name: "Savings",
    } as any);

    const summary = await waterfallService.getWaterfallSummary("hh-1");

    expect(summary.discretionary.categories).toHaveLength(1);
    expect(summary.discretionary.categories[0]!.name).toBe("Groceries");
    expect(summary.discretionary.savings.allocations).toHaveLength(1);
    expect(summary.discretionary.savings.allocations[0]!.name).toBe("Emergency Fund");
  });

  it("calculates correct totals with consolidated models", async () => {
    prismaMock.incomeSource.findMany.mockResolvedValue([
      makeSource({ id: "s1", frequency: "monthly", amount: 4000 }),
    ] as any);
    prismaMock.committedItem.findMany.mockResolvedValue([
      {
        id: "ci-1",
        householdId: "hh-1",
        name: "Rent",
        amount: 1200,
        spendType: "monthly",
        dueMonth: null,
        ownerId: null,
        sortOrder: 0,
        lastReviewedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        subcategoryId: "sub-1",
        notes: null,
      },
      {
        id: "ci-2",
        householdId: "hh-1",
        name: "Car tax",
        amount: 1200,
        spendType: "yearly",
        dueMonth: 6,
        ownerId: null,
        sortOrder: 1,
        lastReviewedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        subcategoryId: "sub-2",
        notes: null,
      },
    ] as any);
    prismaMock.discretionaryItem.findMany.mockResolvedValue([
      {
        id: "di-1",
        householdId: "hh-1",
        name: "Groceries",
        amount: 500,
        spendType: "monthly",
        subcategoryId: "sub-food",
        notes: null,
        wealthAccountId: null,
        sortOrder: 0,
        lastReviewedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "di-2",
        householdId: "hh-1",
        name: "Emergency fund",
        amount: 200,
        spendType: "monthly",
        subcategoryId: "sub-savings",
        notes: null,
        wealthAccountId: null,
        sortOrder: 1,
        lastReviewedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ] as any);
    prismaMock.subcategory.findFirst.mockResolvedValue({
      id: "sub-savings",
      name: "Savings",
    } as any);

    const summary = await waterfallService.getWaterfallSummary("hh-1");

    // income: 4000
    // committed: 1200 (monthly) + 100 (1200/12 yearly) = 1300
    // discretionary: 500 + 200 = 700
    // surplus: 4000 - 1300 - 700 = 2000
    expect(summary.committed.monthlyTotal).toBe(1200);
    expect(summary.committed.monthlyAvg12).toBe(100);
    expect(summary.surplus.amount).toBe(2000);
  });
});

describe("waterfallService.deleteAll — with subcategories", () => {
  it("deletes all items and subcategories", async () => {
    await waterfallService.deleteAll("hh-1");

    expect(prismaMock.incomeSource.deleteMany).toHaveBeenCalledWith({
      where: { householdId: "hh-1" },
    });
    expect(prismaMock.committedItem.deleteMany).toHaveBeenCalledWith({
      where: { householdId: "hh-1" },
    });
    expect(prismaMock.discretionaryItem.deleteMany).toHaveBeenCalledWith({
      where: { householdId: "hh-1" },
    });
    expect(prismaMock.subcategory.deleteMany).toHaveBeenCalledWith({
      where: { householdId: "hh-1" },
    });
  });
});

describe("waterfallService.confirmBatch — consolidated models", () => {
  it("updates lastReviewedAt using new model names", async () => {
    const items = [
      { type: "income_source" as const, id: "inc-1" },
      { type: "committed_item" as const, id: "ci-1" },
      { type: "discretionary_item" as const, id: "di-1" },
    ];

    await waterfallService.confirmBatch("hh-1", { items });

    expect(prismaMock.incomeSource.updateMany).toHaveBeenCalledWith({
      where: { id: "inc-1", householdId: "hh-1" },
      data: { lastReviewedAt: expect.any(Date) },
    });
    expect(prismaMock.committedItem.updateMany).toHaveBeenCalledWith({
      where: { id: "ci-1", householdId: "hh-1" },
      data: { lastReviewedAt: expect.any(Date) },
    });
    expect(prismaMock.discretionaryItem.updateMany).toHaveBeenCalledWith({
      where: { id: "di-1", householdId: "hh-1" },
      data: { lastReviewedAt: expect.any(Date) },
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/backend && bun scripts/run-tests.ts waterfall.service`
Expected: FAIL — summary still reads from old models

- [ ] **Step 3: Write minimal implementation**

Rewrite `getWaterfallSummary` in `apps/backend/src/services/waterfall.service.ts`:

```typescript
  async getWaterfallSummary(householdId: string): Promise<WaterfallSummary> {
    const now = new Date();

    const [incomeSources, committedItems, allDiscretionaryItems] = await Promise.all([
      prisma.incomeSource.findMany({
        where: { householdId, OR: [{ endedAt: null }, { endedAt: { gt: now } }] },
        orderBy: { sortOrder: "asc" },
      }),
      prisma.committedItem.findMany({ where: { householdId }, orderBy: { sortOrder: "asc" } }),
      prisma.discretionaryItem.findMany({ where: { householdId }, orderBy: { sortOrder: "asc" } }),
    ]);

    // --- Income (unchanged logic) ---
    const monthlyIncome = incomeSources.filter((s) => s.frequency === "monthly");
    const annualIncome = incomeSources.filter((s) => s.frequency === "annual");
    const oneOffIncome = incomeSources.filter((s) => s.frequency === "one_off");

    const incomeTotal = toGBP(
      monthlyIncome.reduce((s, i) => s + i.amount, 0) +
        annualIncome.reduce((s, i) => s + i.amount / 12, 0)
    );

    const INCOME_TYPE_LABELS: Record<IncomeType, string> = {
      salary: "Salary", dividends: "Dividends", freelance: "Freelance",
      rental: "Rental", benefits: "Benefits", other: "Other",
    };

    const annualWithMonthly = annualIncome.map((s) => ({ ...s, monthlyAmount: s.amount / 12 }));
    const activeNonOneOff: IncomeSourceRow[] = [...monthlyIncome, ...annualWithMonthly];
    const typeMap = new Map<IncomeType, IncomeSourceRow[]>();
    for (const src of activeNonOneOff) {
      const group = typeMap.get(src.incomeType) ?? [];
      group.push(src);
      typeMap.set(src.incomeType, group);
    }

    const byType: IncomeByType[] = Array.from(typeMap.entries()).map(([type, sources]) => ({
      type,
      label: INCOME_TYPE_LABELS[type],
      monthlyTotal: sources.reduce((sum, src) => {
        if (src.frequency === "annual") return sum + src.amount / 12;
        return sum + src.amount;
      }, 0),
      sources,
    }));

    // --- Committed (from CommittedItem, split by spendType) ---
    const monthlyBills = committedItems.filter((i) => i.spendType === "monthly");
    const yearlyBills = committedItems.filter((i) => i.spendType === "yearly");

    const committedMonthlyTotal = monthlyBills.reduce((s, b) => s + b.amount, 0);
    const yearlyMonthlyAvg = toGBP(yearlyBills.reduce((s, b) => s + b.amount, 0) / 12);

    // Map to backward-compatible response shapes
    const billRows = monthlyBills.map((b) => ({
      ...b,
      spendType: b.spendType as any,
    }));

    const yearlyBillRows = yearlyBills.map((b) => ({
      ...b,
      dueMonth: b.dueMonth ?? 1,
      spendType: b.spendType as any,
    }));

    // --- Discretionary (from DiscretionaryItem, split savings vs non-savings) ---
    const savingsSubcategory = await prisma.subcategory.findFirst({
      where: { householdId, tier: "discretionary", name: "Savings" },
    });
    const savingsSubId = savingsSubcategory?.id;

    const nonSavingsItems = allDiscretionaryItems.filter((i) => i.subcategoryId !== savingsSubId);
    const savingsItems = savingsSubId
      ? allDiscretionaryItems.filter((i) => i.subcategoryId === savingsSubId)
      : [];

    const discretionaryTotal = nonSavingsItems.reduce((s, c) => s + c.amount, 0);
    const savingsTotal = savingsItems.reduce((s, a) => s + a.amount, 0);

    // Map to backward-compatible response shapes
    const categoryRows = nonSavingsItems.map((c) => ({
      ...c,
      monthlyBudget: c.amount,
      spendType: c.spendType as any,
    }));

    const savingsRows = savingsItems.map((a) => ({
      ...a,
      monthlyAmount: a.amount,
      spendType: a.spendType as any,
    }));

    // --- Surplus ---
    const surplusAmount = toGBP(
      incomeTotal - committedMonthlyTotal - yearlyMonthlyAvg - discretionaryTotal - savingsTotal
    );
    const percentOfIncome = toGBP(incomeTotal > 0 ? (surplusAmount / incomeTotal) * 100 : 0);

    return {
      income: {
        total: incomeTotal,
        byType,
        monthly: monthlyIncome,
        annual: annualWithMonthly,
        oneOff: oneOffIncome,
      },
      committed: {
        monthlyTotal: committedMonthlyTotal,
        monthlyAvg12: yearlyMonthlyAvg,
        bills: billRows,
        yearlyBills: yearlyBillRows,
      },
      discretionary: {
        total: discretionaryTotal + savingsTotal,
        categories: categoryRows,
        savings: { total: savingsTotal, allocations: savingsRows },
      },
      surplus: {
        amount: surplusAmount,
        percentOfIncome,
      },
    };
  },
```

Rewrite `getCashflow` to read from `CommittedItem`:

```typescript
  async getCashflow(householdId: string, year: number): Promise<CashflowMonth[]> {
    const [yearlyItems, oneOffSources] = await Promise.all([
      prisma.committedItem.findMany({
        where: { householdId, spendType: "yearly" },
      }),
      prisma.incomeSource.findMany({
        where: { householdId, frequency: "one_off", endedAt: null },
      }),
    ]);

    const monthlyContribution = yearlyItems.reduce((s, b) => s + b.amount, 0) / 12;
    const months: CashflowMonth[] = [];
    let pot = 0;

    for (let month = 1; month <= 12; month++) {
      const bills = yearlyItems
        .filter((b) => b.dueMonth === month)
        .map((b) => ({ id: b.id, name: b.name, amount: b.amount }));

      const oneOffIncome = oneOffSources
        .filter((s) => s.expectedMonth === month)
        .map((s) => ({ id: s.id, name: s.name, amount: s.amount }));

      pot += monthlyContribution;
      pot += oneOffIncome.reduce((s, i) => s + i.amount, 0);
      pot -= bills.reduce((s, b) => s + b.amount, 0);

      months.push({ month, year, contribution: monthlyContribution, bills, oneOffIncome, potAfter: pot, shortfall: pot < 0 });
    }

    return months;
  },
```

Rewrite `deleteAll`:

```typescript
  async deleteAll(householdId: string) {
    await prisma.$transaction([
      prisma.incomeSource.deleteMany({ where: { householdId } }),
      prisma.committedItem.deleteMany({ where: { householdId } }),
      prisma.discretionaryItem.deleteMany({ where: { householdId } }),
      prisma.subcategory.deleteMany({ where: { householdId } }),
    ]);
  },
```

Rewrite `confirmBatch`:

```typescript
  async confirmBatch(householdId: string, data: ConfirmBatchInput) {
    const now = new Date();

    await prisma.$transaction(async (tx) => {
      for (const item of data.items) {
        switch (item.type) {
          case "income_source":
            await tx.incomeSource.updateMany({
              where: { id: item.id, householdId },
              data: { lastReviewedAt: now },
            });
            break;
          case "committed_bill":
          case "yearly_bill":
          case "committed_item":
            await tx.committedItem.updateMany({
              where: { id: item.id, householdId },
              data: { lastReviewedAt: now },
            });
            break;
          case "discretionary_category":
          case "savings_allocation":
          case "discretionary_item":
            await tx.discretionaryItem.updateMany({
              where: { id: item.id, householdId },
              data: { lastReviewedAt: now },
            });
            break;
        }
      }
    });
  },
```

Rewrite `getHistory` switch cases:

```typescript
  async getHistory(householdId: string, type: string, id: string) {
    switch (type) {
      case "income_source": {
        const item = await prisma.incomeSource.findUnique({ where: { id } });
        assertOwned(item, householdId, "Income source");
        break;
      }
      case "committed_item": {
        const item = await prisma.committedItem.findUnique({ where: { id } });
        assertOwned(item, householdId, "Committed item");
        break;
      }
      case "discretionary_item": {
        const item = await prisma.discretionaryItem.findUnique({ where: { id } });
        assertOwned(item, householdId, "Discretionary item");
        break;
      }
      default:
        throw new NotFoundError("Unknown item type");
    }

    const cutoff = new Date();
    cutoff.setMonth(cutoff.getMonth() - 24);

    return prisma.waterfallHistory.findMany({
      where: { itemType: type as any, itemId: id, recordedAt: { gte: cutoff } },
      orderBy: { recordedAt: "asc" },
    });
  },
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/backend && bun scripts/run-tests.ts waterfall.service`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/backend/src/services/waterfall.service.ts apps/backend/src/services/waterfall.service.test.ts
git commit -m "refactor(backend): rewrite summary, cashflow, deleteAll, confirmBatch for consolidated models"
```

---

### Task 10: Waterfall Routes — Updated handlers + subcategory endpoint

**Files:**

- Modify: `apps/backend/src/routes/waterfall.routes.ts`
- Modify: `apps/backend/src/routes/waterfall.routes.test.ts`
- Modify: `apps/backend/src/server.ts`

- [ ] **Step 1: Write the failing test**

Update the service mock and add subcategory tests in `apps/backend/src/routes/waterfall.routes.test.ts`:

Replace the old service mock with:

```typescript
const waterfallServiceMock = {
  getWaterfallSummary: mock(() =>
    Promise.resolve({
      income: { total: 0, byType: [], monthly: [], annual: [], oneOff: [] },
      committed: { monthlyTotal: 0, monthlyAvg12: 0, bills: [], yearlyBills: [] },
      discretionary: { total: 0, categories: [], savings: { total: 0, allocations: [] } },
      surplus: { amount: 0, percentOfIncome: 0 },
    })
  ),
  getCashflow: mock(() => Promise.resolve([])),
  listIncome: mock(() => Promise.resolve([])),
  listEndedIncome: mock(() => Promise.resolve([])),
  createIncome: mock(() => Promise.resolve(null)),
  updateIncome: mock(() => Promise.resolve(null)),
  deleteIncome: mock(() => Promise.resolve()),
  endIncome: mock(() => Promise.resolve(null)),
  reactivateIncome: mock(() => Promise.resolve(null)),
  confirmIncome: mock(() => Promise.resolve(null)),
  listCommitted: mock(() => Promise.resolve([])),
  createCommitted: mock(() => Promise.resolve(null)),
  updateCommitted: mock(() => Promise.resolve(null)),
  deleteCommitted: mock(() => Promise.resolve()),
  confirmCommitted: mock(() => Promise.resolve(null)),
  listYearly: mock(() => Promise.resolve([])),
  createYearly: mock(() => Promise.resolve(null)),
  updateYearly: mock(() => Promise.resolve(null)),
  deleteYearly: mock(() => Promise.resolve()),
  confirmYearly: mock(() => Promise.resolve(null)),
  listDiscretionary: mock(() => Promise.resolve([])),
  createDiscretionary: mock(() => Promise.resolve(null)),
  updateDiscretionary: mock(() => Promise.resolve(null)),
  deleteDiscretionary: mock(() => Promise.resolve()),
  confirmDiscretionary: mock(() => Promise.resolve(null)),
  listSavings: mock(() => Promise.resolve([])),
  createSavings: mock(() => Promise.resolve(null)),
  updateSavings: mock(() => Promise.resolve(null)),
  deleteSavings: mock(() => Promise.resolve()),
  confirmSavings: mock(() => Promise.resolve(null)),
  getHistory: mock(() => Promise.resolve([])),
  confirmBatch: mock(() => Promise.resolve()),
  deleteAll: mock(() => Promise.resolve()),
};

const subcategoryServiceMock = {
  ensureSubcategories: mock(() => Promise.resolve()),
  listByTier: mock(() => Promise.resolve([])),
  seedDefaults: mock(() => Promise.resolve()),
  getDefaultSubcategoryId: mock(() => Promise.resolve("sub-other")),
  getSubcategoryIdByName: mock(() => Promise.resolve(null)),
};

mock.module("../services/subcategory.service", () => ({
  subcategoryService: subcategoryServiceMock,
}));
```

Add subcategory route test:

```typescript
describe("GET /api/waterfall/subcategories/:tier", () => {
  it("returns subcategories for a valid tier", async () => {
    const mockSubs = [{ id: "sub-1", name: "Salary", tier: "income" }];
    subcategoryServiceMock.listByTier.mockResolvedValue(mockSubs as any);

    const res = await app.inject({
      method: "GET",
      url: "/api/waterfall/subcategories/income",
      headers: { authorization: "Bearer test" },
    });

    expect(res.statusCode).toBe(200);
    expect(subcategoryServiceMock.ensureSubcategories).toHaveBeenCalled();
    expect(subcategoryServiceMock.listByTier).toHaveBeenCalledWith("hh-test", "income");
  });

  it("POST /api/waterfall/committed sends valid payload with subcategoryId", async () => {
    waterfallServiceMock.createCommitted.mockResolvedValue({ id: "ci-1" } as any);

    const res = await app.inject({
      method: "POST",
      url: "/api/waterfall/committed",
      headers: { authorization: "Bearer test" },
      payload: { name: "Rent", amount: 1200, subcategoryId: "sub-1" },
    });

    expect(res.statusCode).toBe(201);
  });

  it("POST /api/waterfall/yearly sends valid payload with subcategoryId and dueMonth", async () => {
    waterfallServiceMock.createYearly.mockResolvedValue({ id: "ci-2" } as any);

    const res = await app.inject({
      method: "POST",
      url: "/api/waterfall/yearly",
      headers: { authorization: "Bearer test" },
      payload: { name: "Insurance", amount: 600, subcategoryId: "sub-1", dueMonth: 3 },
    });

    expect(res.statusCode).toBe(201);
  });

  it("POST /api/waterfall/discretionary sends amount (not monthlyBudget)", async () => {
    waterfallServiceMock.createDiscretionary.mockResolvedValue({ id: "di-1" } as any);

    const res = await app.inject({
      method: "POST",
      url: "/api/waterfall/discretionary",
      headers: { authorization: "Bearer test" },
      payload: { name: "Groceries", amount: 400, subcategoryId: "sub-food" },
    });

    expect(res.statusCode).toBe(201);
  });

  it("POST /api/waterfall/savings sends amount (not monthlyAmount)", async () => {
    waterfallServiceMock.createSavings.mockResolvedValue({ id: "di-2" } as any);

    const res = await app.inject({
      method: "POST",
      url: "/api/waterfall/savings",
      headers: { authorization: "Bearer test" },
      payload: { name: "Emergency Fund", amount: 200, subcategoryId: "sub-savings" },
    });

    expect(res.statusCode).toBe(201);
  });

  it("returns 400 for invalid tier", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/waterfall/subcategories/surplus",
      headers: { authorization: "Bearer test" },
    });

    expect(res.statusCode).toBe(400);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/backend && bun scripts/run-tests.ts waterfall.routes`
Expected: FAIL — subcategory route doesn't exist

- [ ] **Step 3: Write minimal implementation**

Update `apps/backend/src/routes/waterfall.routes.ts`:

Add import at top:

```typescript
import { subcategoryService } from "../services/subcategory.service.js";
import {
  createIncomeSourceSchema,
  updateIncomeSourceSchema,
  endIncomeSourceSchema,
  createCommittedItemSchema,
  updateCommittedItemSchema,
  createDiscretionaryItemSchema,
  updateDiscretionaryItemSchema,
  confirmBatchSchema,
  deleteAllWaterfallSchema,
  WaterfallTierEnum,
} from "@finplan/shared";
```

Replace the committed bill route schemas:

```typescript
// ─── Committed items ───────────────────────────────────────────────────────

fastify.post("/committed", pre, async (req, reply) => {
  const data = createCommittedItemSchema.parse(req.body);
  const item = await waterfallService.createCommitted(req.householdId!, data);
  return reply.status(201).send(item);
});

fastify.patch("/committed/:id", pre, async (req, reply) => {
  const { id } = req.params as { id: string };
  const data = updateCommittedItemSchema.parse(req.body);
  const item = await waterfallService.updateCommitted(req.householdId!, id, data);
  return reply.send(item);
});
```

Replace the yearly bill route schemas:

```typescript
fastify.post("/yearly", pre, async (req, reply) => {
  const data = createCommittedItemSchema.parse(req.body);
  const item = await waterfallService.createYearly(req.householdId!, data);
  return reply.status(201).send(item);
});

fastify.patch("/yearly/:id", pre, async (req, reply) => {
  const { id } = req.params as { id: string };
  const data = updateCommittedItemSchema.parse(req.body);
  const item = await waterfallService.updateYearly(req.householdId!, id, data);
  return reply.send(item);
});
```

Replace the discretionary route schemas:

```typescript
fastify.post("/discretionary", pre, async (req, reply) => {
  const data = createDiscretionaryItemSchema.parse(req.body);
  const item = await waterfallService.createDiscretionary(req.householdId!, data);
  return reply.status(201).send(item);
});

fastify.patch("/discretionary/:id", pre, async (req, reply) => {
  const { id } = req.params as { id: string };
  const data = updateDiscretionaryItemSchema.parse(req.body);
  const item = await waterfallService.updateDiscretionary(req.householdId!, id, data);
  return reply.send(item);
});
```

Replace the savings route schemas:

```typescript
fastify.post("/savings", pre, async (req, reply) => {
  const data = createDiscretionaryItemSchema.parse(req.body);
  const item = await waterfallService.createSavings(req.householdId!, data);
  return reply.status(201).send(item);
});

fastify.patch("/savings/:id", pre, async (req, reply) => {
  const { id } = req.params as { id: string };
  const data = updateDiscretionaryItemSchema.parse(req.body);
  const item = await waterfallService.updateSavings(req.householdId!, id, data);
  return reply.send(item);
});
```

Add subcategory endpoint at the end of the function:

```typescript
// ─── Subcategories ─────────────────────────────────────────────────────────

fastify.get("/subcategories/:tier", pre, async (req, reply) => {
  const { tier } = req.params as { tier: string };
  const parsed = WaterfallTierEnum.safeParse(tier);
  if (!parsed.success) {
    return reply
      .status(400)
      .send({ error: "Invalid tier. Must be: income, committed, or discretionary" });
  }
  const householdId = req.householdId!;
  await subcategoryService.ensureSubcategories(householdId);
  const subcategories = await subcategoryService.listByTier(householdId, parsed.data);
  return reply.send(subcategories);
});
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/backend && bun scripts/run-tests.ts waterfall.routes`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/backend/src/routes/waterfall.routes.ts apps/backend/src/routes/waterfall.routes.test.ts
git commit -m "refactor(backend): update waterfall routes for consolidated models, add subcategory endpoint"
```

---

### Task 11: Household Service — Seed subcategories on household creation

**Files:**

- Modify: `apps/backend/src/services/household.service.ts`
- Modify: `apps/backend/src/services/household.service.test.ts`

- [ ] **Step 1: Write the failing test**

Add to `apps/backend/src/services/household.service.test.ts`:

```typescript
describe("householdService.createHousehold — subcategory seeding", () => {
  it("seeds default subcategories after creating household", async () => {
    prismaMock.household.create.mockResolvedValue({
      id: "hh-new",
      name: "New Household",
    } as any);
    prismaMock.householdSettings.create.mockResolvedValue({} as any);
    prismaMock.subcategory.createMany.mockResolvedValue({ count: 13 });

    await householdService.createHousehold("user-1", "New Household");

    expect(prismaMock.subcategory.createMany).toHaveBeenCalledTimes(1);
    const call = prismaMock.subcategory.createMany.mock.calls[0]![0] as any;
    const data = call.data as any[];
    expect(data).toHaveLength(13); // 3 income + 4 committed + 6 discretionary
    expect(data.every((r: any) => r.householdId === "hh-new")).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/backend && bun scripts/run-tests.ts household.service`
Expected: FAIL — `prismaMock.subcategory.createMany` not called

- [ ] **Step 3: Write minimal implementation**

In `apps/backend/src/services/household.service.ts`, add import and update `createHousehold`:

```typescript
import { subcategoryService } from "./subcategory.service.js";
```

Update the `createHousehold` method:

```typescript
  async createHousehold(userId: string, name: string) {
    const household = await prisma.household.create({
      data: {
        name,
        members: { create: { userId, role: "owner" } },
      },
    });
    await prisma.householdSettings.create({ data: { householdId: household.id } });
    await subcategoryService.seedDefaults(household.id);
    return household;
  },
```

Also update `acceptInvite` to seed subcategories for the personal household. The `$transaction` returns both the `user` and the `personal` household. Restructure the return to capture `personal.id`, then seed after the transaction:

```typescript
// In acceptInvite, change the transaction to also return personalHouseholdId:
const { user, personalHouseholdId } = await prisma.$transaction(async (tx) => {
  // ... existing transaction code ...
  // personal household creation is already there
  return { user: updated, personalHouseholdId: personal.id };
});

// After the transaction, seed subcategories for the personal household
await subcategoryService.seedDefaults(personalHouseholdId);
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/backend && bun scripts/run-tests.ts household.service`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/backend/src/services/household.service.ts apps/backend/src/services/household.service.test.ts
git commit -m "feat(backend): seed subcategories on household creation"
```

---

## Testing

### Backend Tests

- [ ] Service: `getWaterfallSummary` returns backward-compatible response shape from consolidated models
- [ ] Service: CommittedItem split into `bills` (monthly) and `yearlyBills` (yearly) in response
- [ ] Service: DiscretionaryItem split into `categories` (non-savings) and `savings.allocations` (savings subcategory) in response
- [ ] Service: surplus calculation correct with consolidated models
- [ ] Service: `deleteAll` removes subcategories alongside items
- [ ] Service: `confirmBatch` works with new `committed_item` and `discretionary_item` types
- [ ] Service: subcategory seeding creates 13 rows (3 + 4 + 6) with correct tier/name/sortOrder
- [ ] Service: `ensureSubcategories` is idempotent (no-op when subcategories exist)
- [ ] Endpoint: `GET /api/waterfall/subcategories/income` returns subcategories
- [ ] Endpoint: `GET /api/waterfall/subcategories/surplus` returns 400
- [ ] Endpoint: `POST /api/waterfall/committed` accepts `subcategoryId` and `notes`
- [ ] Endpoint: all routes remain JWT-protected

### Key Scenarios

- [ ] Happy path: household creation seeds subcategories → create items with subcategoryId → summary returns correct totals
- [ ] Migration: existing data migrated correctly — old IDs preserved, WaterfallHistory references intact
- [ ] Edge case: empty household returns zeroed summary with no subcategory errors
- [ ] Edge case: `deleteAll` + re-access seeds fresh subcategories via `ensureSubcategories`

## Verification

- [ ] `bun run build` passes clean
- [ ] `bun run lint` — zero warnings
- [ ] `cd apps/backend && bun scripts/run-tests.ts waterfall` passes
- [ ] `cd apps/backend && bun scripts/run-tests.ts subcategory` passes
- [ ] `cd apps/backend && bun scripts/run-tests.ts household` passes
- [ ] Manual: create a household → verify 13 subcategories seeded → create income/committed/discretionary items with subcategoryId → verify summary response includes new fields

## Post-conditions

- [ ] Subcategory model ready for tier page queries (Plan 2: Navigation, Routing & Simple Pages)
- [ ] Consolidated models (CommittedItem, DiscretionaryItem) ready for unified item list rendering (Plan 3: Tier Pages)
- [ ] `notes` field available on all waterfall items for accordion detail view (Plan 3)
- [ ] `spendType` field available for monthly/yearly/one-off display formatting (Plan 3)
- [ ] `GET /api/waterfall/subcategories/:tier` endpoint ready for SubcategoryList component (Plan 3)
- [ ] Backward-compatible summary API ensures existing OverviewPage continues to function until Plans 2/3 update it
