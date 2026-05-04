---
feature: overview-waterfall
spec: docs/4. planning/overview-waterfall/overview-waterfall-spec.md
phase: 5
status: pending
---

# Overview — Waterfall Display — Implementation Plan

> **For Claude:** Use `/execute-plan overview-waterfall` to implement this plan task-by-task.

> **Purpose:** An ordered, task-by-task build guide. Each task follows TDD red-green-commit and contains complete, ready-to-run code — no "implement X" placeholders. This is the input to `/execute-plan`. The spec defines _what_ to build; this plan defines _how_.

**Goal:** Build the core waterfall display — income → committed → discretionary → surplus — as a two-panel layout with staleness tracking and surplus warning.
**Spec:** `docs/4. planning/overview-waterfall/overview-waterfall-spec.md`
**Architecture:** New Prisma models for each waterfall tier (IncomeSource, CommittedBill, YearlyBill, DiscretionaryCategory, SavingsAllocation) with a WaterfallHistory audit table. Fastify routes return a computed WaterfallSummary. React renders a fixed-width left panel with tier rows and a flexible right panel for item detail.
**Tech Stack:** Fastify · Prisma · tRPC · Zod · React 18 · TanStack Query · Zustand · Tailwind

## Pre-conditions

> What must already exist before this work starts — prior phases, existing models, shared components.

- [ ] Phase 4 complete: auth, household creation, and `HouseholdSettings` model exist
- [ ] `StalenessIndicator` component available (foundation-ui-primitives)

## Tasks

> Each task is one action (2–5 minutes), follows red-green-commit, and contains complete code. Ordered: schema → shared schemas → backend service → routes → frontend.

---

### Task 1: Prisma Schema — Waterfall Models

**Files:**

- Modify: `apps/backend/prisma/schema.prisma`
- Run: `bun run db:migrate`

- [ ] **Step 1: Write the failing test**

```typescript
// apps/backend/src/services/__tests__/waterfall.service.test.ts
import { describe, it, expect, beforeEach } from "bun:test";
import { PrismaClient } from "@prisma/client";
import { createTestHousehold } from "../test-helpers";

const prisma = new PrismaClient();

describe("WaterfallHistory model", () => {
  beforeEach(async () => {
    await prisma.waterfallHistory.deleteMany();
  });

  it("can be created with itemType and itemId", async () => {
    const household = await createTestHousehold(prisma);
    const source = await prisma.incomeSource.create({
      data: {
        householdId: household.id,
        name: "Salary",
        amount: 3000,
        frequency: "monthly",
      },
    });

    const history = await prisma.waterfallHistory.create({
      data: {
        itemType: "income_source",
        itemId: source.id,
        value: 3000,
        recordedAt: new Date(),
      },
    });

    expect(history.itemType).toBe("income_source");
    expect(history.value).toBe(3000);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/backend && bun scripts/run-tests.ts waterfall.service`
Expected: FAIL — "Table 'income_source' does not exist" (or similar Prisma error)

- [ ] **Step 3: Add models to schema and run migration**

Add to `apps/backend/prisma/schema.prisma`:

```prisma
enum IncomeFrequency {
  monthly
  annual
  one_off
}

enum WaterfallItemType {
  income_source
  committed_bill
  yearly_bill
  discretionary_category
  savings_allocation
}

model IncomeSource {
  id             String          @id @default(cuid())
  householdId    String
  name           String
  amount         Float
  frequency      IncomeFrequency
  expectedMonth  Int?
  ownerId        String?
  sortOrder      Int             @default(0)
  endedAt        DateTime?
  lastReviewedAt DateTime        @default(now())
  createdAt      DateTime        @default(now())
  updatedAt      DateTime        @updatedAt
  household      Household       @relation(fields: [householdId], references: [id])
}

model CommittedBill {
  id             String    @id @default(cuid())
  householdId    String
  name           String
  amount         Float
  ownerId        String?
  sortOrder      Int       @default(0)
  lastReviewedAt DateTime  @default(now())
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt
  household      Household @relation(fields: [householdId], references: [id])
}

model YearlyBill {
  id             String    @id @default(cuid())
  householdId    String
  name           String
  amount         Float
  dueMonth       Int
  sortOrder      Int       @default(0)
  lastReviewedAt DateTime  @default(now())
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt
  household      Household @relation(fields: [householdId], references: [id])
}

model DiscretionaryCategory {
  id             String    @id @default(cuid())
  householdId    String
  name           String
  monthlyBudget  Float
  sortOrder      Int       @default(0)
  lastReviewedAt DateTime  @default(now())
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt
  household      Household @relation(fields: [householdId], references: [id])
}

model SavingsAllocation {
  id              String    @id @default(cuid())
  householdId     String
  name            String
  monthlyAmount   Float
  sortOrder       Int       @default(0)
  wealthAccountId String?
  lastReviewedAt  DateTime  @default(now())
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  household       Household @relation(fields: [householdId], references: [id])
}

model WaterfallHistory {
  id         String            @id @default(cuid())
  itemType   WaterfallItemType
  itemId     String
  value      Float
  recordedAt DateTime
  createdAt  DateTime          @default(now())

  @@index([itemType, itemId, recordedAt])
}
```

Then run:

```bash
bun run db:migrate
# Migration name: add_waterfall_models
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/backend && bun scripts/run-tests.ts waterfall.service`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/backend/prisma/schema.prisma apps/backend/prisma/migrations/
git commit -m "feat(schema): add waterfall tier models and history audit table"
```

---

### Task 2: Shared Zod Schemas

**Files:**

- Create: `packages/shared/src/schemas/waterfall.schemas.ts`
- Modify: `packages/shared/src/index.ts`
- Test: `packages/shared/src/schemas/__tests__/waterfall.schemas.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// packages/shared/src/schemas/__tests__/waterfall.schemas.test.ts
import { describe, it, expect } from "bun:test";
import {
  WaterfallSummarySchema,
  IncomeSourceSchema,
} from "../waterfall.schemas";

describe("IncomeSourceSchema", () => {
  it("accepts valid monthly income source", () => {
    const result = IncomeSourceSchema.safeParse({
      id: "clx123",
      householdId: "hh1",
      name: "Salary",
      amount: 3000,
      frequency: "monthly",
      sortOrder: 0,
      lastReviewedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid frequency", () => {
    const result = IncomeSourceSchema.safeParse({
      id: "clx123",
      householdId: "hh1",
      name: "Salary",
      amount: 3000,
      frequency: "weekly",
    });
    expect(result.success).toBe(false);
  });
});

describe("WaterfallSummarySchema", () => {
  it("computes surplus as income minus committed minus discretionary", () => {
    const summary = {
      income: { total: 5000, monthly: [], annual: [], oneOff: [] },
      committed: {
        monthlyTotal: 1500,
        monthlyAvg12: 200,
        bills: [],
        yearlyBills: [],
      },
      discretionary: {
        total: 800,
        categories: [],
        savings: { total: 200, allocations: [] },
      },
      surplus: { amount: 2500, percentOfIncome: 50 },
    };
    const result = WaterfallSummarySchema.safeParse(summary);
    expect(result.success).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/backend && bun scripts/run-tests.ts waterfall.schemas`
Expected: FAIL — "Cannot find module '../waterfall.schemas'"

- [ ] **Step 3: Write minimal implementation**

```typescript
// packages/shared/src/schemas/waterfall.schemas.ts
import { z } from "zod";

export const IncomeFrequencySchema = z.enum(["monthly", "annual", "one_off"]);

export const IncomeSourceSchema = z.object({
  id: z.string(),
  householdId: z.string(),
  name: z.string(),
  amount: z.number(),
  frequency: IncomeFrequencySchema,
  expectedMonth: z.number().int().min(1).max(12).nullable().optional(),
  ownerId: z.string().nullable().optional(),
  sortOrder: z.number().int().default(0),
  endedAt: z.string().datetime().nullable().optional(),
  lastReviewedAt: z.string().datetime(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const CommittedBillSchema = z.object({
  id: z.string(),
  householdId: z.string(),
  name: z.string(),
  amount: z.number(),
  ownerId: z.string().nullable().optional(),
  sortOrder: z.number().int().default(0),
  lastReviewedAt: z.string().datetime(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const YearlyBillSchema = z.object({
  id: z.string(),
  householdId: z.string(),
  name: z.string(),
  amount: z.number(),
  dueMonth: z.number().int().min(1).max(12),
  sortOrder: z.number().int().default(0),
  lastReviewedAt: z.string().datetime(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const DiscretionaryCategorySchema = z.object({
  id: z.string(),
  householdId: z.string(),
  name: z.string(),
  monthlyBudget: z.number(),
  sortOrder: z.number().int().default(0),
  lastReviewedAt: z.string().datetime(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const SavingsAllocationSchema = z.object({
  id: z.string(),
  householdId: z.string(),
  name: z.string(),
  monthlyAmount: z.number(),
  sortOrder: z.number().int().default(0),
  wealthAccountId: z.string().nullable().optional(),
  lastReviewedAt: z.string().datetime(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const WaterfallSummarySchema = z.object({
  income: z.object({
    total: z.number(),
    monthly: z.array(IncomeSourceSchema),
    annual: z.array(IncomeSourceSchema.extend({ monthlyAmount: z.number() })),
    oneOff: z.array(IncomeSourceSchema),
  }),
  committed: z.object({
    monthlyTotal: z.number(),
    monthlyAvg12: z.number(),
    bills: z.array(CommittedBillSchema),
    yearlyBills: z.array(YearlyBillSchema),
  }),
  discretionary: z.object({
    total: z.number(),
    categories: z.array(DiscretionaryCategorySchema),
    savings: z.object({
      total: z.number(),
      allocations: z.array(SavingsAllocationSchema),
    }),
  }),
  surplus: z.object({
    amount: z.number(),
    percentOfIncome: z.number(),
  }),
});

export type IncomeSource = z.infer<typeof IncomeSourceSchema>;
export type CommittedBill = z.infer<typeof CommittedBillSchema>;
export type YearlyBill = z.infer<typeof YearlyBillSchema>;
export type DiscretionaryCategory = z.infer<typeof DiscretionaryCategorySchema>;
export type SavingsAllocation = z.infer<typeof SavingsAllocationSchema>;
export type WaterfallSummary = z.infer<typeof WaterfallSummarySchema>;
```

Add to `packages/shared/src/index.ts`:

```typescript
export * from "./schemas/waterfall.schemas";
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/backend && bun scripts/run-tests.ts waterfall.schemas`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/shared/src/schemas/waterfall.schemas.ts packages/shared/src/index.ts
git commit -m "feat(shared): add waterfall Zod schemas and types"
```

---

_(Subsequent tasks follow the same structure: WaterfallService, Fastify routes, React components)_

## Testing

> Key scenarios that must pass end-to-end, beyond the per-task tests above.

### Backend Tests

- [ ] Service: `getSummary` returns correct tier totals given mixed income frequencies
- [ ] Service: `endedAt` income sources excluded from live summary
- [ ] Service: surplus warning threshold uses `HouseholdSettings.surplusBenchmarkPct`
- [ ] Service: `confirmBatch` updates `lastReviewedAt` for all supplied item types
- [ ] Endpoint: `GET /api/waterfall` returns 401 without JWT
- [ ] Endpoint: `GET /api/waterfall` returns only the requesting household's data
- [ ] Edge case: household with no items returns zeroed `WaterfallSummary`
- [ ] Edge case: `DELETE /api/waterfall/income/:id` rejects if WaterfallHistory rows exist

### Frontend Tests

- [ ] Component: `WaterfallLeftPanel` renders 4 tiers in correct order
- [ ] Component: surplus warning appears when `percentOfIncome < surplusBenchmarkPct`
- [ ] Component: "··· N more" toggle shows/hides discretionary items beyond 5
- [ ] Hook: `useWaterfall` invalidates cache after any mutation

### Key Scenarios

- [ ] Happy path: user with income, bills, and savings sees correct tier totals and surplus
- [ ] Error case: network failure on `GET /api/waterfall` shows error state in left panel
- [ ] Edge case: empty household shows empty state with "Set up your waterfall from scratch ▸" CTA

## Verification

- [ ] `bun run build` passes clean
- [ ] `bun run lint` — zero warnings
- [ ] `cd apps/backend && bun scripts/run-tests.ts waterfall` passes
- [ ] Manual: create income sources, bills, and discretionary categories; verify tier totals update; verify surplus warning appears when surplus < threshold

## Post-conditions

- [ ] Enables Phase 6: item detail panel (right panel content) can now read waterfall data
- [ ] `WaterfallHistory` table is populated; enables Phase 8 snapshot/timeline features
