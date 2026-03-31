---
feature: financial-forecast
category: overview
spec: docs/4. planning/financial-forecast/financial-forecast-spec.md
creation_date: 2026-03-30
status: backlog
implemented_date:
---

# Financial Forecast — Implementation Plan

> **For Claude:** Use `/execute-plan financial-forecast` to implement this plan task-by-task.

> **Purpose:** An ordered, task-by-task build guide. Each task follows TDD red-green-commit and contains complete, ready-to-run code — no "implement X" placeholders. This is the input to `/execute-plan`. The spec defines _what_ to build; this plan defines _how_.

**Goal:** Add a Forecast page with three simultaneous projection lenses (net worth, surplus accumulation, retirement) driven by a shared time horizon selector.
**Spec:** `docs/4. planning/financial-forecast/financial-forecast-spec.md`
**Architecture:** A single read-only backend service (`forecast.service.ts`) computes annual projection series from existing WealthAccount, HouseholdSettings, HouseholdMember, and waterfall data. A Fastify route at `GET /api/forecast` returns all three series in one response. The frontend fetches via TanStack Query and renders three Recharts chart panels inside a CSS grid layout.
**Tech Stack:** Fastify · Prisma · Zod · React 18 · TanStack Query · Recharts · Tailwind

**Infrastructure Impact:**

- Touches `packages/shared/`: yes — adds `forecast.schemas.ts`
- Requires DB migration: no — forecast is read-only; all schema changes are owned by the Assets feature

---

## Pre-conditions

> The following must be in place before this plan can be executed. All are delivered by the **Assets** feature.

- [ ] `HouseholdMember` has `dateOfBirth DateTime?` and `retirementYear Int?` fields
- [ ] `HouseholdSettings` has `inflationRatePct Float` (default 2.5), `savingsRatePct Float`, `investmentRatePct Float`, `pensionRatePct Float` fields
- [ ] `WealthAccount` has `monthlyContribution Float` (default 0), `growthRatePct Float?`, and `memberId String?` fields
- [ ] `AssetClass` enum includes `stocksAndShares` and `pension` (Assets feature updates the enum)
- [ ] `WealthAccount.memberId` is populated for pension accounts to identify the owning member (`userId`)

---

## Tasks

> Ordered: shared schemas → backend service → backend route → frontend service+hook → page+nav → components.

---

### Task 1: Shared Zod Schemas — Forecast

**Files:**

- Create: `packages/shared/src/schemas/forecast.schemas.ts`
- Modify: `packages/shared/src/schemas/index.ts`
- Test: `packages/shared/src/schemas/forecast.schemas.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// packages/shared/src/schemas/forecast.schemas.test.ts
import { describe, it, expect } from "bun:test";
import {
  ForecastQuerySchema,
  ForecastProjectionSchema,
  ForecastHorizonSchema,
} from "./forecast.schemas";

describe("ForecastHorizonSchema", () => {
  it("accepts valid horizon values", () => {
    for (const v of [1, 3, 10, 20, 30]) {
      expect(ForecastHorizonSchema.safeParse(v).success).toBe(true);
    }
  });

  it("rejects invalid horizon values", () => {
    expect(ForecastHorizonSchema.safeParse(5).success).toBe(false);
    expect(ForecastHorizonSchema.safeParse(0).success).toBe(false);
    expect(ForecastHorizonSchema.safeParse(100).success).toBe(false);
  });
});

describe("ForecastQuerySchema", () => {
  it("coerces string horizonYears to number and validates", () => {
    const result = ForecastQuerySchema.safeParse({ horizonYears: "10" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.horizonYears).toBe(10);
  });

  it("rejects invalid horizon via coercion", () => {
    expect(ForecastQuerySchema.safeParse({ horizonYears: "7" }).success).toBe(false);
  });
});

describe("ForecastProjectionSchema", () => {
  it("accepts a well-formed projection", () => {
    const projection = {
      netWorth: [
        { year: 2026, nominal: 50000, real: 50000 },
        { year: 2027, nominal: 53000, real: 51960 },
      ],
      surplus: [
        { year: 2026, cumulative: 0 },
        { year: 2027, cumulative: 12000 },
      ],
      retirement: [
        {
          memberId: "user-1",
          memberName: "Alice",
          retirementYear: 2055,
          series: [{ year: 2026, pension: 30000, savings: 10000, stocksAndShares: 5000 }],
        },
      ],
    };
    expect(ForecastProjectionSchema.safeParse(projection).success).toBe(true);
  });

  it("accepts null retirementYear", () => {
    const projection = {
      netWorth: [],
      surplus: [],
      retirement: [
        {
          memberId: "user-1",
          memberName: "Alice",
          retirementYear: null,
          series: [],
        },
      ],
    };
    expect(ForecastProjectionSchema.safeParse(projection).success).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd packages/shared && bun test forecast.schemas`
Expected: FAIL — "Cannot find module './forecast.schemas'"

- [ ] **Step 3: Write minimal implementation**

```typescript
// packages/shared/src/schemas/forecast.schemas.ts
import { z } from "zod";

export const ForecastHorizonSchema = z.union([
  z.literal(1),
  z.literal(3),
  z.literal(10),
  z.literal(20),
  z.literal(30),
]);
export type ForecastHorizon = z.infer<typeof ForecastHorizonSchema>;

export const ForecastQuerySchema = z.object({
  horizonYears: z.coerce.number().pipe(ForecastHorizonSchema),
});
export type ForecastQuery = z.infer<typeof ForecastQuerySchema>;

export const NetWorthPointSchema = z.object({
  year: z.number().int(),
  nominal: z.number(),
  real: z.number(),
});
export type NetWorthPoint = z.infer<typeof NetWorthPointSchema>;

export const SurplusPointSchema = z.object({
  year: z.number().int(),
  cumulative: z.number(),
});
export type SurplusPoint = z.infer<typeof SurplusPointSchema>;

export const RetirementPointSchema = z.object({
  year: z.number().int(),
  pension: z.number(),
  savings: z.number(),
  stocksAndShares: z.number(),
});
export type RetirementPoint = z.infer<typeof RetirementPointSchema>;

export const RetirementMemberProjectionSchema = z.object({
  memberId: z.string(),
  memberName: z.string(),
  retirementYear: z.number().int().nullable(),
  series: z.array(RetirementPointSchema),
});
export type RetirementMemberProjection = z.infer<typeof RetirementMemberProjectionSchema>;

export const ForecastProjectionSchema = z.object({
  netWorth: z.array(NetWorthPointSchema),
  surplus: z.array(SurplusPointSchema),
  retirement: z.array(RetirementMemberProjectionSchema),
});
export type ForecastProjection = z.infer<typeof ForecastProjectionSchema>;
```

Add to `packages/shared/src/schemas/index.ts`:

```typescript
// Forecast schemas and types
export {
  ForecastHorizonSchema,
  ForecastQuerySchema,
  NetWorthPointSchema,
  SurplusPointSchema,
  RetirementPointSchema,
  RetirementMemberProjectionSchema,
  ForecastProjectionSchema,
  type ForecastHorizon,
  type ForecastQuery,
  type NetWorthPoint,
  type SurplusPoint,
  type RetirementPoint,
  type RetirementMemberProjection,
  type ForecastProjection,
} from "./forecast.schemas";
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd packages/shared && bun test forecast.schemas`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/shared/src/schemas/forecast.schemas.ts packages/shared/src/schemas/index.ts packages/shared/src/schemas/forecast.schemas.test.ts
git commit -m "feat(shared): add forecast projection Zod schemas and types"
```

---

### Task 2: Forecast Service — Projection Engine

**Files:**

- Create: `apps/backend/src/services/forecast.service.ts`
- Test: `apps/backend/src/services/forecast.service.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// apps/backend/src/services/forecast.service.test.ts
import { describe, it, expect, beforeEach, mock } from "bun:test";
import { prismaMock, resetPrismaMocks } from "../test/mocks/prisma";

const waterfallServiceMock = {
  getWaterfallSummary: mock(() => Promise.resolve({ surplus: { amount: 1000 } })),
};

mock.module("../config/database.js", () => ({ prisma: prismaMock }));
mock.module("./waterfall.service.js", () => ({ waterfallService: waterfallServiceMock }));

const { forecastService } = await import("./forecast.service.js");

beforeEach(() => {
  resetPrismaMocks();
  waterfallServiceMock.getWaterfallSummary.mockResolvedValue({
    surplus: { amount: 1000 },
  } as any);
});

describe("forecastService.getProjections — net worth", () => {
  it("year 0 net worth equals sum of non-pension account balances", async () => {
    prismaMock.wealthAccount.findMany.mockResolvedValue([
      {
        id: "a1",
        householdId: "hh-1",
        assetClass: "savings",
        balance: 10000,
        monthlyContribution: 0,
        growthRatePct: null,
        memberId: null,
      },
      {
        id: "a2",
        householdId: "hh-1",
        assetClass: "pension",
        balance: 50000,
        monthlyContribution: 0,
        growthRatePct: null,
        memberId: "user-1",
      },
      {
        id: "a3",
        householdId: "hh-1",
        assetClass: "stocksAndShares",
        balance: 5000,
        monthlyContribution: 0,
        growthRatePct: null,
        memberId: null,
      },
    ] as any);
    prismaMock.householdSettings.findUnique.mockResolvedValue({
      savingsRatePct: 4,
      investmentRatePct: 7,
      pensionRatePct: 6,
      inflationRatePct: 2.5,
    } as any);
    prismaMock.householdMember.findMany.mockResolvedValue([
      {
        householdId: "hh-1",
        userId: "user-1",
        retirementYear: 2055,
        user: { id: "user-1", name: "Alice" },
      },
    ] as any);

    const result = await forecastService.getProjections("hh-1", 1);

    // Year 0: savings (10000) + stocksAndShares (5000) = 15000 (pension excluded)
    expect(result.netWorth[0]!.nominal).toBe(15000);
    expect(result.netWorth[0]!.real).toBe(15000);
  });

  it("applies annual growth rate with monthly contributions after year 1", async () => {
    prismaMock.wealthAccount.findMany.mockResolvedValue([
      {
        id: "a1",
        householdId: "hh-1",
        assetClass: "savings",
        balance: 10000,
        monthlyContribution: 100,
        growthRatePct: null,
        memberId: null,
      },
    ] as any);
    prismaMock.householdSettings.findUnique.mockResolvedValue({
      savingsRatePct: 4,
      investmentRatePct: 7,
      pensionRatePct: 6,
      inflationRatePct: 2.5,
    } as any);
    prismaMock.householdMember.findMany.mockResolvedValue([] as any);

    const result = await forecastService.getProjections("hh-1", 1);

    // Year 1: 10000 * 1.04 + (100 * 12) = 10400 + 1200 = 11600
    expect(result.netWorth[1]!.nominal).toBe(11600);
  });

  it("uses per-account growthRatePct override when set", async () => {
    prismaMock.wealthAccount.findMany.mockResolvedValue([
      {
        id: "a1",
        householdId: "hh-1",
        assetClass: "savings",
        balance: 10000,
        monthlyContribution: 0,
        growthRatePct: 10,
        memberId: null,
      },
    ] as any);
    prismaMock.householdSettings.findUnique.mockResolvedValue({
      savingsRatePct: 4,
      investmentRatePct: 7,
      pensionRatePct: 6,
      inflationRatePct: 2.5,
    } as any);
    prismaMock.householdMember.findMany.mockResolvedValue([] as any);

    const result = await forecastService.getProjections("hh-1", 1);

    // Year 1 with 10% override: 10000 * 1.10 = 11000
    expect(result.netWorth[1]!.nominal).toBe(11000);
  });

  it("real value deflates nominal by inflation rate", async () => {
    prismaMock.wealthAccount.findMany.mockResolvedValue([
      {
        id: "a1",
        householdId: "hh-1",
        assetClass: "savings",
        balance: 10000,
        monthlyContribution: 0,
        growthRatePct: 0,
        memberId: null,
      },
    ] as any);
    prismaMock.householdSettings.findUnique.mockResolvedValue({
      savingsRatePct: 0,
      investmentRatePct: 0,
      pensionRatePct: 0,
      inflationRatePct: 2.5,
    } as any);
    prismaMock.householdMember.findMany.mockResolvedValue([] as any);

    const result = await forecastService.getProjections("hh-1", 1);

    // Year 1 nominal = 10000 (no growth), real = 10000 / 1.025 ≈ 9756
    expect(result.netWorth[1]!.real).toBe(9756);
  });
});

describe("forecastService.getProjections — surplus", () => {
  it("year 0 surplus is 0, year N is monthlySurplus * 12 * N", async () => {
    prismaMock.wealthAccount.findMany.mockResolvedValue([] as any);
    prismaMock.householdSettings.findUnique.mockResolvedValue({
      savingsRatePct: 4,
      investmentRatePct: 7,
      pensionRatePct: 6,
      inflationRatePct: 2.5,
    } as any);
    prismaMock.householdMember.findMany.mockResolvedValue([] as any);
    waterfallServiceMock.getWaterfallSummary.mockResolvedValue({
      surplus: { amount: 500 },
    } as any);

    const result = await forecastService.getProjections("hh-1", 3);

    expect(result.surplus[0]!.cumulative).toBe(0);
    expect(result.surplus[1]!.cumulative).toBe(6000); // 500 * 12 * 1
    expect(result.surplus[3]!.cumulative).toBe(18000); // 500 * 12 * 3
  });
});

describe("forecastService.getProjections — retirement", () => {
  it("retirement series includes only pension accounts assigned to the member", async () => {
    prismaMock.wealthAccount.findMany.mockResolvedValue([
      {
        id: "p1",
        householdId: "hh-1",
        assetClass: "pension",
        balance: 20000,
        monthlyContribution: 0,
        growthRatePct: null,
        memberId: "user-1",
      },
      {
        id: "p2",
        householdId: "hh-1",
        assetClass: "pension",
        balance: 30000,
        monthlyContribution: 0,
        growthRatePct: null,
        memberId: "user-2",
      },
    ] as any);
    prismaMock.householdSettings.findUnique.mockResolvedValue({
      savingsRatePct: 4,
      investmentRatePct: 7,
      pensionRatePct: 6,
      inflationRatePct: 2.5,
    } as any);
    prismaMock.householdMember.findMany.mockResolvedValue([
      {
        householdId: "hh-1",
        userId: "user-1",
        retirementYear: 2055,
        user: { id: "user-1", name: "Alice" },
      },
      {
        householdId: "hh-1",
        userId: "user-2",
        retirementYear: 2060,
        user: { id: "user-2", name: "Bob" },
      },
    ] as any);

    const result = await forecastService.getProjections("hh-1", 1);

    const alice = result.retirement.find((m) => m.memberId === "user-1")!;
    const bob = result.retirement.find((m) => m.memberId === "user-2")!;

    // Alice's year 0 pension = 20000, Bob's = 30000
    expect(alice.series[0]!.pension).toBe(20000);
    expect(bob.series[0]!.pension).toBe(30000);
  });

  it("passes through null retirementYear when member has none set", async () => {
    prismaMock.wealthAccount.findMany.mockResolvedValue([] as any);
    prismaMock.householdSettings.findUnique.mockResolvedValue({
      savingsRatePct: 4,
      investmentRatePct: 7,
      pensionRatePct: 6,
      inflationRatePct: 2.5,
    } as any);
    prismaMock.householdMember.findMany.mockResolvedValue([
      {
        householdId: "hh-1",
        userId: "user-1",
        retirementYear: null,
        user: { id: "user-1", name: "Alice" },
      },
    ] as any);

    const result = await forecastService.getProjections("hh-1", 1);

    expect(result.retirement[0]!.retirementYear).toBeNull();
  });

  it("returns empty arrays when no accounts exist", async () => {
    prismaMock.wealthAccount.findMany.mockResolvedValue([] as any);
    prismaMock.householdSettings.findUnique.mockResolvedValue({
      savingsRatePct: 4,
      investmentRatePct: 7,
      pensionRatePct: 6,
      inflationRatePct: 2.5,
    } as any);
    prismaMock.householdMember.findMany.mockResolvedValue([] as any);

    const result = await forecastService.getProjections("hh-1", 3);

    expect(result.netWorth.every((p) => p.nominal === 0)).toBe(true);
    expect(result.surplus.every((p) => p.cumulative === 0)).toBe(true);
    expect(result.retirement).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/backend && bun scripts/run-tests.ts forecast.service`
Expected: FAIL — "Cannot find module './forecast.service.js'"

- [ ] **Step 3: Write minimal implementation**

```typescript
// apps/backend/src/services/forecast.service.ts
import { prisma } from "../config/database.js";
import { waterfallService } from "./waterfall.service.js";
import type { ForecastProjection, ForecastHorizon } from "@finplan/shared";

function effectiveRate(
  account: { growthRatePct: number | null; assetClass: string },
  settings: { savingsRatePct: number; investmentRatePct: number; pensionRatePct: number }
): number {
  if (account.growthRatePct != null) return account.growthRatePct / 100;
  switch (account.assetClass) {
    case "savings":
      return settings.savingsRatePct / 100;
    case "stocksAndShares":
      return settings.investmentRatePct / 100;
    case "pension":
      return settings.pensionRatePct / 100;
    default:
      return 0;
  }
}

function projectBalanceSeries(
  initialBalance: number,
  monthlyContribution: number,
  annualRate: number,
  years: number
): number[] {
  const series = [initialBalance];
  for (let y = 1; y <= years; y++) {
    const prev = series[y - 1]!;
    series.push(prev * (1 + annualRate) + monthlyContribution * 12);
  }
  return series;
}

function sumAccountSeries(
  accounts: {
    balance: number;
    monthlyContribution: number | null;
    growthRatePct: number | null;
    assetClass: string;
  }[],
  settings: { savingsRatePct: number; investmentRatePct: number; pensionRatePct: number },
  years: number
): number[] {
  const sums = Array.from({ length: years + 1 }, () => 0);
  for (const acc of accounts) {
    const rate = effectiveRate(acc, settings);
    const series = projectBalanceSeries(acc.balance, acc.monthlyContribution ?? 0, rate, years);
    for (let y = 0; y <= years; y++) {
      sums[y] = (sums[y] ?? 0) + (series[y] ?? 0);
    }
  }
  return sums;
}

const DEFAULT_SETTINGS = {
  savingsRatePct: 4,
  investmentRatePct: 7,
  pensionRatePct: 6,
  inflationRatePct: 2.5,
};

export const forecastService = {
  async getProjections(
    householdId: string,
    horizonYears: ForecastHorizon
  ): Promise<ForecastProjection> {
    const [accounts, settingsRow, members, waterfallSummary] = await Promise.all([
      prisma.wealthAccount.findMany({ where: { householdId } }),
      prisma.householdSettings.findUnique({ where: { householdId } }),
      prisma.householdMember.findMany({
        where: { householdId },
        include: { user: { select: { id: true, name: true } } },
      }),
      waterfallService.getWaterfallSummary(householdId),
    ]);

    const settings = settingsRow ?? DEFAULT_SETTINGS;
    const currentYear = new Date().getFullYear();

    // ── Net worth (non-pension accounts) ─────────────────────────────────────
    const netWorthAccounts = accounts.filter((a) => a.assetClass !== "pension");
    const netWorthSums = sumAccountSeries(netWorthAccounts, settings, horizonYears);

    const netWorth = Array.from({ length: horizonYears + 1 }, (_, y) => {
      const nominal = Math.round(netWorthSums[y] ?? 0);
      const real = Math.round(nominal / Math.pow(1 + settings.inflationRatePct / 100, y));
      return { year: currentYear + y, nominal, real };
    });

    // ── Surplus accumulation (constant monthly surplus, no growth) ────────────
    const monthlySurplus = waterfallSummary.surplus.amount;
    const surplus = Array.from({ length: horizonYears + 1 }, (_, y) => ({
      year: currentYear + y,
      cumulative: Math.round(monthlySurplus * 12 * y),
    }));

    // ── Retirement (per member: own pensions + shared savings + shared S&S) ──
    const savingsAccounts = accounts.filter((a) => a.assetClass === "savings");
    const ssAccounts = accounts.filter((a) => a.assetClass === "stocksAndShares");

    const savingsSums = sumAccountSeries(savingsAccounts, settings, horizonYears);
    const ssSums = sumAccountSeries(ssAccounts, settings, horizonYears);

    const retirement = members.map((member) => {
      const pensionAccounts = accounts.filter(
        (a) => a.assetClass === "pension" && a.memberId === member.userId
      );
      const pensionSums = sumAccountSeries(pensionAccounts, settings, horizonYears);

      const series = Array.from({ length: horizonYears + 1 }, (_, y) => ({
        year: currentYear + y,
        pension: Math.round(pensionSums[y] ?? 0),
        savings: Math.round(savingsSums[y] ?? 0),
        stocksAndShares: Math.round(ssSums[y] ?? 0),
      }));

      return {
        memberId: member.userId,
        memberName: member.user.name,
        retirementYear: member.retirementYear ?? null,
        series,
      };
    });

    return { netWorth, surplus, retirement };
  },
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/backend && bun scripts/run-tests.ts forecast.service`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/backend/src/services/forecast.service.ts apps/backend/src/services/forecast.service.test.ts
git commit -m "feat(forecast): add projection service (net worth, surplus, retirement)"
```

---

### Task 3: Forecast Route + Server Registration

**Files:**

- Create: `apps/backend/src/routes/forecast.routes.ts`
- Modify: `apps/backend/src/server.ts`
- Test: `apps/backend/src/routes/forecast.routes.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// apps/backend/src/routes/forecast.routes.test.ts
import { describe, it, expect, mock, beforeEach, beforeAll, afterAll } from "bun:test";
import type { FastifyInstance } from "fastify";
import { buildTestApp } from "../test/helpers/fastify";
import { errorHandler } from "../middleware/errorHandler";
import { AuthenticationError } from "../utils/errors";

const forecastServiceMock = {
  getProjections: mock(() =>
    Promise.resolve({
      netWorth: [{ year: 2026, nominal: 50000, real: 50000 }],
      surplus: [{ year: 2026, cumulative: 0 }],
      retirement: [],
    })
  ),
};

mock.module("../services/forecast.service", () => ({
  forecastService: forecastServiceMock,
}));

mock.module("../middleware/auth.middleware", () => ({
  authMiddleware: mock(() => {}),
}));

import { authMiddleware } from "../middleware/auth.middleware";
import { forecastRoutes } from "./forecast.routes";

let app: FastifyInstance;

beforeAll(async () => {
  app = await buildTestApp();
  app.setErrorHandler(errorHandler);
  await app.register(forecastRoutes, { prefix: "/api/forecast" });
  await app.ready();
});

afterAll(async () => {
  await app.close();
});

beforeEach(() => {
  forecastServiceMock.getProjections.mockReset();
  forecastServiceMock.getProjections.mockResolvedValue({
    netWorth: [{ year: 2026, nominal: 50000, real: 50000 }],
    surplus: [{ year: 2026, cumulative: 0 }],
    retirement: [],
  } as any);

  (authMiddleware as any).mockImplementation(async (request: any) => {
    const authHeader = request.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      throw new AuthenticationError("No authorization token provided");
    }
    request.user = { userId: "user-1", email: "test@test.com" };
    request.householdId = "hh-1";
  });
});

describe("GET /api/forecast", () => {
  it("returns 401 without auth token", async () => {
    const res = await app.inject({ method: "GET", url: "/api/forecast?horizonYears=10" });
    expect(res.statusCode).toBe(401);
  });

  it("returns 200 with projection data for valid horizonYears", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/forecast?horizonYears=10",
      headers: { authorization: "Bearer valid-token" },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toHaveProperty("netWorth");
    expect(res.json()).toHaveProperty("surplus");
    expect(res.json()).toHaveProperty("retirement");
  });

  it("calls forecastService with the correct horizonYears", async () => {
    await app.inject({
      method: "GET",
      url: "/api/forecast?horizonYears=20",
      headers: { authorization: "Bearer valid-token" },
    });
    expect(forecastServiceMock.getProjections).toHaveBeenCalledWith("hh-1", 20);
  });

  it("returns 400 for invalid horizonYears", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/forecast?horizonYears=7",
      headers: { authorization: "Bearer valid-token" },
    });
    expect(res.statusCode).toBe(400);
  });

  it("returns 400 when horizonYears is missing", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/forecast",
      headers: { authorization: "Bearer valid-token" },
    });
    expect(res.statusCode).toBe(400);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/backend && bun scripts/run-tests.ts forecast.routes`
Expected: FAIL — "Cannot find module './forecast.routes'"

- [ ] **Step 3: Write minimal implementation**

```typescript
// apps/backend/src/routes/forecast.routes.ts
import type { FastifyInstance } from "fastify";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { forecastService } from "../services/forecast.service.js";
import { ForecastQuerySchema } from "@finplan/shared";
import { AppError } from "../utils/errors.js";

export async function forecastRoutes(fastify: FastifyInstance) {
  const pre = { preHandler: [authMiddleware] };

  fastify.get("/", pre, async (req, reply) => {
    const parsed = ForecastQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      throw new AppError(parsed.error.errors[0]?.message ?? "Invalid query", 400);
    }
    const projection = await forecastService.getProjections(
      req.householdId!,
      parsed.data.horizonYears
    );
    return reply.send(projection);
  });
}
```

Add to `apps/backend/src/server.ts` (in the API routes section):

```typescript
import { forecastRoutes } from "./routes/forecast.routes";
// ...
server.register(forecastRoutes, { prefix: "/api/forecast" });
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/backend && bun scripts/run-tests.ts forecast.routes`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/backend/src/routes/forecast.routes.ts apps/backend/src/routes/forecast.routes.test.ts apps/backend/src/server.ts
git commit -m "feat(forecast): add GET /api/forecast route with horizonYears validation"
```

---

### Task 4: Frontend Forecast Service + useForecast Hook

**Files:**

- Create: `apps/frontend/src/services/forecast.service.ts`
- Create: `apps/frontend/src/hooks/useForecast.ts`
- Test: `apps/frontend/src/hooks/useForecast.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// apps/frontend/src/hooks/useForecast.test.ts
import { describe, it, expect } from "bun:test";
import { renderWithProviders } from "@/test/helpers/render";
import { screen, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { server } from "@/test/msw/server";
import { useForecast } from "./useForecast";

function ForecastConsumer({ horizonYears }: { horizonYears: number }) {
  const { data, isLoading, isError } = useForecast(horizonYears as any);
  if (isLoading) return <div>loading</div>;
  if (isError) return <div>error</div>;
  return <div data-testid="result">{data ? "loaded" : "empty"}</div>;
}

describe("useForecast", () => {
  it("returns forecast data on success", async () => {
    server.use(
      http.get("/api/forecast", () =>
        HttpResponse.json({
          netWorth: [{ year: 2026, nominal: 50000, real: 50000 }],
          surplus: [{ year: 2026, cumulative: 0 }],
          retirement: [],
        })
      )
    );

    renderWithProviders(<ForecastConsumer horizonYears={10} />, {
      initialEntries: ["/forecast"],
    });

    await waitFor(() => {
      expect(screen.getByTestId("result").textContent).toBe("loaded");
    });
  });

  it("exposes error state on fetch failure", async () => {
    server.use(
      http.get("/api/forecast", () => HttpResponse.error())
    );

    renderWithProviders(<ForecastConsumer horizonYears={10} />, {
      initialEntries: ["/forecast"],
    });

    await waitFor(() => {
      expect(screen.getByText("error")).toBeTruthy();
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/frontend && bun scripts/run-tests.ts useForecast`
Expected: FAIL — "Cannot find module './useForecast'"

- [ ] **Step 3: Write minimal implementation**

```typescript
// apps/frontend/src/services/forecast.service.ts
import { apiClient } from "@/lib/api";
import type { ForecastProjection, ForecastHorizon } from "@finplan/shared";

export const forecastService = {
  getProjections: (horizonYears: ForecastHorizon) =>
    apiClient.get<ForecastProjection>(`/api/forecast?horizonYears=${horizonYears}`),
};
```

```typescript
// apps/frontend/src/hooks/useForecast.ts
import { useQuery } from "@tanstack/react-query";
import { forecastService } from "@/services/forecast.service";
import type { ForecastHorizon } from "@finplan/shared";

export const FORECAST_KEYS = {
  projections: (horizonYears: ForecastHorizon) => ["forecast", horizonYears] as const,
};

export function useForecast(horizonYears: ForecastHorizon) {
  return useQuery({
    queryKey: FORECAST_KEYS.projections(horizonYears),
    queryFn: () => forecastService.getProjections(horizonYears),
  });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/frontend && bun scripts/run-tests.ts useForecast`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/frontend/src/services/forecast.service.ts apps/frontend/src/hooks/useForecast.ts apps/frontend/src/hooks/useForecast.test.ts
git commit -m "feat(forecast): add frontend forecast service and useForecast hook"
```

---

### Task 5: ForecastPage Shell + Route + Nav Entry

**Files:**

- Create: `apps/frontend/src/pages/ForecastPage.tsx`
- Create: `apps/frontend/src/pages/ForecastPage.test.tsx`
- Modify: `apps/frontend/src/App.tsx`
- Modify: `apps/frontend/src/components/layout/Layout.tsx`

- [ ] **Step 1: Write the failing test**

```typescript
// apps/frontend/src/pages/ForecastPage.test.tsx
import { describe, it, expect } from "bun:test";
import { renderWithProviders } from "@/test/helpers/render";
import { screen } from "@testing-library/react";
import ForecastPage from "./ForecastPage";

describe("ForecastPage", () => {
  it("renders the page heading", () => {
    renderWithProviders(<ForecastPage />, { initialEntries: ["/forecast"] });
    expect(screen.getByRole("heading", { name: /forecast/i })).toBeTruthy();
  });

  it("renders the time horizon selector with all five options", () => {
    renderWithProviders(<ForecastPage />, { initialEntries: ["/forecast"] });
    expect(screen.getByRole("button", { name: "10y" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "1y" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "30y" })).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/frontend && bun scripts/run-tests.ts ForecastPage`
Expected: FAIL — "Cannot find module './ForecastPage'"

- [ ] **Step 3: Write minimal implementation**

```tsx
// apps/frontend/src/pages/ForecastPage.tsx
import { useState } from "react";
import type { ForecastHorizon } from "@finplan/shared";
import { TimeHorizonSelector } from "@/components/forecast/TimeHorizonSelector";

export default function ForecastPage() {
  const [horizon, setHorizon] = useState<ForecastHorizon>(10);

  return (
    <div className="h-full flex flex-col overflow-hidden" data-page="forecast">
      <div className="px-6 pt-5 pb-4 flex items-center justify-between shrink-0">
        <h1 className="font-heading font-bold text-lg uppercase tracking-widest text-page-accent">
          Forecast
        </h1>
        <TimeHorizonSelector value={horizon} onChange={setHorizon} />
      </div>
      <div className="flex-1 min-h-0 overflow-auto px-6 pb-6">
        {/* Chart panels wired in Task 9 */}
      </div>
    </div>
  );
}
```

Add to `apps/frontend/src/App.tsx`:

```typescript
// At the top with other lazy imports:
const ForecastPage = lazy(() => import("./pages/ForecastPage"));

// Inside ProtectedAppRoutes, after the /surplus route:
<Route path="/forecast" element={<ForecastPage />} />
```

Add to `apps/frontend/src/components/layout/Layout.tsx` — append Forecast to `NAV_ITEMS_GROUP3`:

```typescript
const NAV_ITEMS_GROUP3 = [
  { to: "/forecast", label: "Forecast", colorClass: "text-page-accent" },
  { to: "/goals", label: "Goals", colorClass: "text-foreground" },
  { to: "/gifts", label: "Gifts", colorClass: "text-foreground" },
  { to: "/help", label: "Help", colorClass: "text-foreground" },
] as const;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/frontend && bun scripts/run-tests.ts ForecastPage`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/frontend/src/pages/ForecastPage.tsx apps/frontend/src/pages/ForecastPage.test.tsx apps/frontend/src/App.tsx apps/frontend/src/components/layout/Layout.tsx
git commit -m "feat(forecast): add ForecastPage shell, /forecast route, and nav entry"
```

---

### Task 6: TimeHorizonSelector Component

**Files:**

- Create: `apps/frontend/src/components/forecast/TimeHorizonSelector.tsx`
- Create: `apps/frontend/src/components/forecast/TimeHorizonSelector.test.tsx`

- [ ] **Step 1: Write the failing test**

```typescript
// apps/frontend/src/components/forecast/TimeHorizonSelector.test.tsx
import { describe, it, expect, mock } from "bun:test";
import { renderWithProviders } from "@/test/helpers/render";
import { screen, fireEvent } from "@testing-library/react";
import { TimeHorizonSelector } from "./TimeHorizonSelector";
import type { ForecastHorizon } from "@finplan/shared";

describe("TimeHorizonSelector", () => {
  it("renders all five horizon buttons", () => {
    renderWithProviders(
      <TimeHorizonSelector value={10} onChange={() => {}} />,
      { initialEntries: ["/forecast"] }
    );
    for (const label of ["1y", "3y", "10y", "20y", "30y"]) {
      expect(screen.getByRole("button", { name: label })).toBeTruthy();
    }
  });

  it("marks the active horizon button as selected", () => {
    renderWithProviders(
      <TimeHorizonSelector value={20} onChange={() => {}} />,
      { initialEntries: ["/forecast"] }
    );
    const btn = screen.getByRole("button", { name: "20y" });
    expect(btn.getAttribute("aria-pressed")).toBe("true");
  });

  it("calls onChange with the selected horizon", () => {
    const onChange = mock((v: ForecastHorizon) => v);
    renderWithProviders(
      <TimeHorizonSelector value={10} onChange={onChange} />,
      { initialEntries: ["/forecast"] }
    );
    fireEvent.click(screen.getByRole("button", { name: "30y" }));
    expect(onChange).toHaveBeenCalledWith(30);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/frontend && bun scripts/run-tests.ts TimeHorizonSelector`
Expected: FAIL — "Cannot find module './TimeHorizonSelector'"

- [ ] **Step 3: Write minimal implementation**

```tsx
// apps/frontend/src/components/forecast/TimeHorizonSelector.tsx
import { cn } from "@/lib/utils";
import type { ForecastHorizon } from "@finplan/shared";

const HORIZONS: { value: ForecastHorizon; label: string }[] = [
  { value: 1, label: "1y" },
  { value: 3, label: "3y" },
  { value: 10, label: "10y" },
  { value: 20, label: "20y" },
  { value: 30, label: "30y" },
];

interface TimeHorizonSelectorProps {
  value: ForecastHorizon;
  onChange: (horizon: ForecastHorizon) => void;
}

export function TimeHorizonSelector({ value, onChange }: TimeHorizonSelectorProps) {
  return (
    <div
      role="group"
      aria-label="Time horizon"
      className="flex items-center gap-0.5 bg-surface rounded-lg p-0.5 border border-surface-elevated"
    >
      {HORIZONS.map(({ value: h, label }) => (
        <button
          key={h}
          type="button"
          role="button"
          aria-pressed={value === h}
          onClick={() => onChange(h)}
          className={cn(
            "px-3 py-1 rounded-md text-xs font-heading font-medium transition-colors duration-150",
            value === h
              ? "bg-surface-elevated text-page-accent"
              : "text-text-tertiary hover:text-text-secondary"
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/frontend && bun scripts/run-tests.ts TimeHorizonSelector`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/frontend/src/components/forecast/TimeHorizonSelector.tsx apps/frontend/src/components/forecast/TimeHorizonSelector.test.tsx
git commit -m "feat(forecast): add TimeHorizonSelector segmented control"
```

---

### Task 7: NetWorthChart + NetWorthStatRow

**Files:**

- Create: `apps/frontend/src/components/forecast/NetWorthChart.tsx`
- Create: `apps/frontend/src/components/forecast/NetWorthChart.test.tsx`

- [ ] **Step 1: Write the failing test**

```typescript
// apps/frontend/src/components/forecast/NetWorthChart.test.tsx
import { describe, it, expect } from "bun:test";
import { renderWithProviders } from "@/test/helpers/render";
import { screen } from "@testing-library/react";
import { NetWorthChart } from "./NetWorthChart";
import type { NetWorthPoint } from "@finplan/shared";

const mockData: NetWorthPoint[] = [
  { year: 2026, nominal: 50000, real: 50000 },
  { year: 2027, nominal: 55000, real: 53658 },
  { year: 2028, nominal: 60000, real: 57100 },
];

const mockRetirementMarkers = [
  { year: 2027, name: "Alice" },
];

describe("NetWorthChart", () => {
  it("renders the stat row with today and horizon-end values", () => {
    renderWithProviders(
      <NetWorthChart data={mockData} retirementMarkers={mockRetirementMarkers} />,
      { initialEntries: ["/forecast"] }
    );
    // Stat row shows current and projected values
    expect(screen.getByText(/today/i)).toBeTruthy();
  });

  it("renders without crashing when data is empty", () => {
    renderWithProviders(
      <NetWorthChart data={[]} retirementMarkers={[]} />,
      { initialEntries: ["/forecast"] }
    );
  });

  it("shows the empty-assets note when all nominal values are zero", () => {
    const zeroData: NetWorthPoint[] = [
      { year: 2026, nominal: 0, real: 0 },
      { year: 2027, nominal: 0, real: 0 },
    ];
    renderWithProviders(
      <NetWorthChart data={zeroData} retirementMarkers={[]} />,
      { initialEntries: ["/forecast"] }
    );
    expect(screen.getByText(/add assets/i)).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/frontend && bun scripts/run-tests.ts NetWorthChart`
Expected: FAIL — "Cannot find module './NetWorthChart'"

- [ ] **Step 3: Write minimal implementation**

```tsx
// apps/frontend/src/components/forecast/NetWorthChart.tsx
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";
// Note: <defs>, <linearGradient>, <stop> are native SVG elements — no import needed
import { formatCurrency } from "@/utils/format";
import { usePrefersReducedMotion } from "@/utils/motion";
import type { NetWorthPoint } from "@finplan/shared";

interface RetirementMarker {
  year: number;
  name: string;
}

interface NetWorthChartProps {
  data: NetWorthPoint[];
  retirementMarkers: RetirementMarker[];
}

export function NetWorthChart({ data, retirementMarkers }: NetWorthChartProps) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const isEmpty = data.length === 0 || data.every((d) => d.nominal === 0);
  const first = data[0];
  const last = data[data.length - 1];

  return (
    <div className="bg-surface border border-surface-elevated rounded-xl overflow-hidden">
      <div className="px-5 pt-4 pb-2">
        <span className="text-xs font-heading font-semibold uppercase tracking-widest text-text-tertiary">
          Net Worth
        </span>
      </div>

      {isEmpty ? (
        <div className="h-48 flex items-center justify-center px-6">
          <p className="text-sm text-text-tertiary text-center">
            Add assets in the Assets section to see your projection
          </p>
        </div>
      ) : (
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="nominalGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="realGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="year"
                tick={{ fontSize: 11, fill: "rgba(238,242,255,0.4)" }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tickFormatter={(v: number) => `£${Math.round(v / 1000)}k`}
                tick={{ fontSize: 11, fill: "rgba(238,242,255,0.4)" }}
                tickLine={false}
                axisLine={false}
                width={48}
              />
              <Tooltip
                formatter={(value: number, name: string) => [
                  formatCurrency(value),
                  name === "nominal" ? "Nominal" : "Real",
                ]}
                contentStyle={{
                  background: "#141b2e",
                  border: "1px solid #222c45",
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              {retirementMarkers.map((m) => (
                <ReferenceLine
                  key={m.year}
                  x={m.year}
                  stroke="#8b5cf6"
                  strokeDasharray="4 4"
                  strokeWidth={1.5}
                  label={{ value: m.name, position: "top", fontSize: 11, fill: "#8b5cf6" }}
                />
              ))}
              <Area
                type="monotone"
                dataKey="nominal"
                stroke="#8b5cf6"
                strokeWidth={2}
                fill="url(#nominalGrad)"
                dot={false}
                isAnimationActive={!prefersReducedMotion}
              />
              <Area
                type="monotone"
                dataKey="real"
                stroke="#6366f1"
                strokeWidth={1.5}
                strokeDasharray="4 4"
                fill="url(#realGrad)"
                dot={false}
                isAnimationActive={!prefersReducedMotion}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Stat row */}
      {!isEmpty && first && last && (
        <div className="px-5 py-3 border-t border-surface-elevated flex items-center gap-6">
          <div>
            <span className="text-xs text-text-tertiary">Today</span>
            <p className="font-numeric text-sm text-text-primary tabular-nums">
              {formatCurrency(first.nominal)}
            </p>
          </div>
          <div>
            <span className="text-xs text-text-tertiary">Nominal ({last.year})</span>
            <p className="font-numeric text-sm text-page-accent tabular-nums">
              {formatCurrency(last.nominal)}
            </p>
          </div>
          <div>
            <span className="text-xs text-text-tertiary">Real ({last.year})</span>
            <p className="font-numeric text-sm text-text-secondary tabular-nums">
              {formatCurrency(last.real)}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/frontend && bun scripts/run-tests.ts NetWorthChart`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/frontend/src/components/forecast/NetWorthChart.tsx apps/frontend/src/components/forecast/NetWorthChart.test.tsx
git commit -m "feat(forecast): add NetWorthChart with nominal/real lines and retirement markers"
```

---

### Task 8: SurplusAccumulationChart + SurplusStatRow

**Files:**

- Create: `apps/frontend/src/components/forecast/SurplusAccumulationChart.tsx`
- Create: `apps/frontend/src/components/forecast/SurplusAccumulationChart.test.tsx`

- [ ] **Step 1: Write the failing test**

```typescript
// apps/frontend/src/components/forecast/SurplusAccumulationChart.test.tsx
import { describe, it, expect } from "bun:test";
import { renderWithProviders } from "@/test/helpers/render";
import { screen } from "@testing-library/react";
import { SurplusAccumulationChart } from "./SurplusAccumulationChart";
import type { SurplusPoint } from "@finplan/shared";

const mockData: SurplusPoint[] = [
  { year: 2026, cumulative: 0 },
  { year: 2027, cumulative: 12000 },
  { year: 2028, cumulative: 24000 },
];

describe("SurplusAccumulationChart", () => {
  it("renders the section heading", () => {
    renderWithProviders(
      <SurplusAccumulationChart data={mockData} />,
      { initialEntries: ["/forecast"] }
    );
    expect(screen.getByText(/surplus accumulation/i)).toBeTruthy();
  });

  it("shows stat row with today (£0) and horizon-end total", () => {
    renderWithProviders(
      <SurplusAccumulationChart data={mockData} />,
      { initialEntries: ["/forecast"] }
    );
    expect(screen.getByText(/today/i)).toBeTruthy();
  });

  it("shows empty-assets note when all values are zero", () => {
    const zeroData: SurplusPoint[] = [
      { year: 2026, cumulative: 0 },
      { year: 2027, cumulative: 0 },
    ];
    renderWithProviders(
      <SurplusAccumulationChart data={zeroData} />,
      { initialEntries: ["/forecast"] }
    );
    expect(screen.getByText(/add assets/i)).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/frontend && bun scripts/run-tests.ts SurplusAccumulationChart`
Expected: FAIL — "Cannot find module './SurplusAccumulationChart'"

- [ ] **Step 3: Write minimal implementation**

```tsx
// apps/frontend/src/components/forecast/SurplusAccumulationChart.tsx
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { formatCurrency } from "@/utils/format";
import { usePrefersReducedMotion } from "@/utils/motion";
import type { SurplusPoint } from "@finplan/shared";

interface SurplusAccumulationChartProps {
  data: SurplusPoint[];
}

export function SurplusAccumulationChart({ data }: SurplusAccumulationChartProps) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const isEmpty = data.length < 2 || data.every((d) => d.cumulative === 0);
  const last = data[data.length - 1];

  return (
    <div className="bg-surface border border-surface-elevated rounded-xl overflow-hidden">
      <div className="px-5 pt-4 pb-2">
        <span className="text-xs font-heading font-semibold uppercase tracking-widest text-text-tertiary">
          Surplus Accumulation
        </span>
      </div>

      {isEmpty ? (
        <div className="h-40 flex items-center justify-center px-6">
          <p className="text-sm text-text-tertiary text-center">
            Add assets in the Assets section to see your projection
          </p>
        </div>
      ) : (
        <div className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="surplusGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4adcd0" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#4adcd0" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="year"
                tick={{ fontSize: 11, fill: "rgba(238,242,255,0.4)" }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tickFormatter={(v: number) => `£${Math.round(v / 1000)}k`}
                tick={{ fontSize: 11, fill: "rgba(238,242,255,0.4)" }}
                tickLine={false}
                axisLine={false}
                width={48}
              />
              <Tooltip
                formatter={(value: number) => [formatCurrency(value), "Accumulated"]}
                contentStyle={{
                  background: "#141b2e",
                  border: "1px solid #222c45",
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Area
                type="monotone"
                dataKey="cumulative"
                stroke="#4adcd0"
                strokeWidth={2}
                fill="url(#surplusGrad)"
                dot={false}
                isAnimationActive={!prefersReducedMotion}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Stat row */}
      {!isEmpty && last && (
        <div className="px-5 py-3 border-t border-surface-elevated flex items-center gap-6">
          <div>
            <span className="text-xs text-text-tertiary">Today</span>
            <p className="font-numeric text-sm text-text-primary tabular-nums">£0</p>
          </div>
          <div>
            <span className="text-xs text-text-tertiary">Accumulated ({last.year})</span>
            <p className="font-numeric text-sm text-text-primary tabular-nums">
              {formatCurrency(last.cumulative)}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/frontend && bun scripts/run-tests.ts SurplusAccumulationChart`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/frontend/src/components/forecast/SurplusAccumulationChart.tsx apps/frontend/src/components/forecast/SurplusAccumulationChart.test.tsx
git commit -m "feat(forecast): add SurplusAccumulationChart with stat row"
```

---

### Task 9: RetirementChart + RetirementStatRow + RetirementEmptyState

**Files:**

- Create: `apps/frontend/src/components/forecast/RetirementChart.tsx`
- Create: `apps/frontend/src/components/forecast/RetirementChart.test.tsx`

- [ ] **Step 1: Write the failing test**

```typescript
// apps/frontend/src/components/forecast/RetirementChart.test.tsx
import { describe, it, expect } from "bun:test";
import { renderWithProviders } from "@/test/helpers/render";
import { screen, fireEvent } from "@testing-library/react";
import { RetirementChart } from "./RetirementChart";
import type { RetirementMemberProjection } from "@finplan/shared";

const twoMembers: RetirementMemberProjection[] = [
  {
    memberId: "user-1",
    memberName: "Alice",
    retirementYear: 2055,
    series: [
      { year: 2026, pension: 30000, savings: 10000, stocksAndShares: 5000 },
      { year: 2027, pension: 32000, savings: 10800, stocksAndShares: 5400 },
    ],
  },
  {
    memberId: "user-2",
    memberName: "Bob",
    retirementYear: null,
    series: [
      { year: 2026, pension: 0, savings: 10000, stocksAndShares: 5000 },
    ],
  },
];

describe("RetirementChart", () => {
  it("renders a tab for each household member", () => {
    renderWithProviders(
      <RetirementChart members={twoMembers} horizonEndYear={2028} />,
      { initialEntries: ["/forecast"] }
    );
    expect(screen.getByRole("tab", { name: /alice/i })).toBeTruthy();
    expect(screen.getByRole("tab", { name: /bob/i })).toBeTruthy();
  });

  it("shows the retirement empty state when a member has no retirementYear", () => {
    renderWithProviders(
      <RetirementChart members={twoMembers} horizonEndYear={2028} />,
      { initialEntries: ["/forecast"] }
    );
    // Click Bob's tab
    fireEvent.click(screen.getByRole("tab", { name: /bob/i }));
    expect(screen.getByText(/set bob's retirement year/i)).toBeTruthy();
  });

  it("renders without crashing when there are no members", () => {
    renderWithProviders(
      <RetirementChart members={[]} horizonEndYear={2028} />,
      { initialEntries: ["/forecast"] }
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/frontend && bun scripts/run-tests.ts RetirementChart`
Expected: FAIL — "Cannot find module './RetirementChart'"

- [ ] **Step 3: Write minimal implementation**

```tsx
// apps/frontend/src/components/forecast/RetirementChart.tsx
import * as Tabs from "@radix-ui/react-tabs";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { NavLink } from "react-router-dom";
import { formatCurrency } from "@/utils/format";
import { usePrefersReducedMotion } from "@/utils/motion";
import { cn } from "@/lib/utils";
import type { RetirementMemberProjection } from "@finplan/shared";

interface RetirementChartProps {
  members: RetirementMemberProjection[];
  horizonEndYear: number;
}

export function RetirementChart({ members, horizonEndYear }: RetirementChartProps) {
  const prefersReducedMotion = usePrefersReducedMotion();

  if (members.length === 0) {
    return (
      <div className="bg-surface border border-surface-elevated rounded-xl p-5">
        <span className="text-xs font-heading font-semibold uppercase tracking-widest text-text-tertiary">
          Retirement
        </span>
        <div className="h-40 flex items-center justify-center">
          <p className="text-sm text-text-tertiary">No household members found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface border border-surface-elevated rounded-xl overflow-hidden">
      <Tabs.Root defaultValue={members[0]!.memberId}>
        <div className="px-5 pt-4 pb-0 flex items-center justify-between">
          <span className="text-xs font-heading font-semibold uppercase tracking-widest text-text-tertiary">
            Retirement
          </span>
          <Tabs.List className="flex gap-0.5" aria-label="Household members">
            {members.map((m) => (
              <Tabs.Trigger
                key={m.memberId}
                value={m.memberId}
                className={cn(
                  "px-3 py-1 rounded-md text-xs font-body transition-colors duration-150",
                  "text-text-tertiary hover:text-text-secondary",
                  "data-[state=active]:bg-surface-elevated data-[state=active]:text-text-primary"
                )}
              >
                {m.memberName}
              </Tabs.Trigger>
            ))}
          </Tabs.List>
        </div>

        {members.map((member) => {
          const last = member.series[member.series.length - 1];
          const retirementLabel =
            member.retirementYear != null && member.retirementYear <= horizonEndYear
              ? `At retirement (${member.retirementYear})`
              : `At ${horizonEndYear}`;

          const statPoint =
            member.retirementYear != null
              ? (member.series.find((s) => s.year === member.retirementYear) ?? last)
              : last;

          const total = statPoint
            ? statPoint.pension + statPoint.savings + statPoint.stocksAndShares
            : 0;

          return (
            <Tabs.Content key={member.memberId} value={member.memberId}>
              {member.retirementYear == null ? (
                <div className="h-40 flex items-center justify-center px-6">
                  <p className="text-sm text-text-tertiary text-center">
                    Set {member.memberName}&apos;s retirement year in{" "}
                    <NavLink to="/settings" className="underline text-page-accent">
                      Settings
                    </NavLink>{" "}
                    to see their projection
                  </p>
                </div>
              ) : (
                <>
                  <div className="h-40 mt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={member.series}
                        margin={{ top: 4, right: 0, bottom: 0, left: 0 }}
                      >
                        <defs>
                          <linearGradient
                            id={`pensionGrad-${member.memberId}`}
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.25} />
                            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient
                            id={`savingsGrad-${member.memberId}`}
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient
                            id={`ssGrad-${member.memberId}`}
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.15} />
                            <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <XAxis
                          dataKey="year"
                          tick={{ fontSize: 11, fill: "rgba(238,242,255,0.4)" }}
                          tickLine={false}
                          axisLine={false}
                        />
                        <YAxis
                          tickFormatter={(v: number) => `£${Math.round(v / 1000)}k`}
                          tick={{ fontSize: 11, fill: "rgba(238,242,255,0.4)" }}
                          tickLine={false}
                          axisLine={false}
                          width={48}
                        />
                        <Tooltip
                          formatter={(value: number, name: string) => [
                            formatCurrency(value),
                            name === "pension"
                              ? "Pension"
                              : name === "savings"
                                ? "Savings"
                                : "Stocks & Shares",
                          ]}
                          contentStyle={{
                            background: "#141b2e",
                            border: "1px solid #222c45",
                            borderRadius: 8,
                            fontSize: 12,
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="pension"
                          stackId="1"
                          stroke="#8b5cf6"
                          strokeWidth={2}
                          fill={`url(#pensionGrad-${member.memberId})`}
                          dot={false}
                          isAnimationActive={!prefersReducedMotion}
                        />
                        <Area
                          type="monotone"
                          dataKey="savings"
                          stackId="1"
                          stroke="#6366f1"
                          strokeWidth={1.5}
                          fill={`url(#savingsGrad-${member.memberId})`}
                          dot={false}
                          isAnimationActive={!prefersReducedMotion}
                        />
                        <Area
                          type="monotone"
                          dataKey="stocksAndShares"
                          stackId="1"
                          stroke="#0ea5e9"
                          strokeWidth={1.5}
                          fill={`url(#ssGrad-${member.memberId})`}
                          dot={false}
                          isAnimationActive={!prefersReducedMotion}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Legend + stat row */}
                  <div className="px-5 py-3 border-t border-surface-elevated">
                    <div className="flex items-center gap-4 mb-2">
                      {[
                        { key: "pension", label: "Pension", color: "#8b5cf6" },
                        { key: "savings", label: "Savings", color: "#6366f1" },
                        { key: "stocksAndShares", label: "Stocks & Shares", color: "#0ea5e9" },
                      ].map(({ key, label, color }) => (
                        <div key={key} className="flex items-center gap-1.5">
                          <div
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: color }}
                          />
                          <span className="text-xs text-text-tertiary">{label}</span>
                          {statPoint && (
                            <span className="font-numeric text-xs text-text-secondary tabular-nums">
                              {formatCurrency(statPoint[key as keyof typeof statPoint] as number)}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-text-tertiary">{retirementLabel}:</span>
                      <span className="font-numeric text-sm font-semibold text-text-primary tabular-nums">
                        {formatCurrency(total)}
                      </span>
                    </div>
                  </div>
                </>
              )}
            </Tabs.Content>
          );
        })}
      </Tabs.Root>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/frontend && bun scripts/run-tests.ts RetirementChart`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/frontend/src/components/forecast/RetirementChart.tsx apps/frontend/src/components/forecast/RetirementChart.test.tsx
git commit -m "feat(forecast): add RetirementChart with per-member tabs and empty state"
```

---

### Task 10: Wire ForecastPage with All Chart Panels

**Files:**

- Modify: `apps/frontend/src/pages/ForecastPage.tsx`
- Modify: `apps/frontend/src/pages/ForecastPage.test.tsx`

- [ ] **Step 1: Write the failing test**

```typescript
// Add to apps/frontend/src/pages/ForecastPage.test.tsx
import { http, HttpResponse } from "msw";
import { server } from "@/test/msw/server";
import { waitFor } from "@testing-library/react";

const mockProjection = {
  netWorth: [
    { year: 2026, nominal: 50000, real: 50000 },
    { year: 2027, nominal: 55000, real: 53658 },
  ],
  surplus: [
    { year: 2026, cumulative: 0 },
    { year: 2027, cumulative: 12000 },
  ],
  retirement: [
    {
      memberId: "user-1",
      memberName: "Alice",
      retirementYear: 2055,
      series: [
        { year: 2026, pension: 30000, savings: 10000, stocksAndShares: 5000 },
      ],
    },
  ],
};

describe("ForecastPage — with data", () => {
  it("renders all three chart panels after data loads", async () => {
    server.use(
      http.get("/api/forecast", () => HttpResponse.json(mockProjection))
    );

    renderWithProviders(<ForecastPage />, { initialEntries: ["/forecast"] });

    await waitFor(() => {
      expect(screen.getByText(/net worth/i)).toBeTruthy();
      expect(screen.getByText(/surplus accumulation/i)).toBeTruthy();
      expect(screen.getByText(/retirement/i)).toBeTruthy();
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/frontend && bun scripts/run-tests.ts ForecastPage`
Expected: FAIL — "net worth" / "surplus accumulation" / "retirement" headings not found

- [ ] **Step 3: Write minimal implementation**

```tsx
// apps/frontend/src/pages/ForecastPage.tsx
import { useState } from "react";
import type { ForecastHorizon } from "@finplan/shared";
import { TimeHorizonSelector } from "@/components/forecast/TimeHorizonSelector";
import { NetWorthChart } from "@/components/forecast/NetWorthChart";
import { SurplusAccumulationChart } from "@/components/forecast/SurplusAccumulationChart";
import { RetirementChart } from "@/components/forecast/RetirementChart";
import { useForecast } from "@/hooks/useForecast";

const CHART_SKELETON = (
  <div className="bg-surface border border-surface-elevated rounded-xl h-48 animate-pulse" />
);

const CHART_ERROR = (
  <div className="bg-surface border border-surface-elevated rounded-xl h-48 flex items-center justify-center">
    <p className="text-sm text-text-tertiary">Could not load forecast — try refreshing</p>
  </div>
);

export default function ForecastPage() {
  const [horizon, setHorizon] = useState<ForecastHorizon>(10);
  const { data, isLoading, isError } = useForecast(horizon);

  const currentYear = new Date().getFullYear();
  const horizonEndYear = currentYear + horizon;

  const retirementMarkers = (data?.retirement ?? [])
    .filter(
      (m) =>
        m.retirementYear != null &&
        m.retirementYear >= currentYear &&
        m.retirementYear <= horizonEndYear
    )
    .map((m) => ({ year: m.retirementYear!, name: m.memberName }));

  return (
    <div className="h-full flex flex-col overflow-hidden" data-page="forecast">
      <div className="px-6 pt-5 pb-4 flex items-center justify-between shrink-0">
        <h1 className="font-heading font-bold text-lg uppercase tracking-widest text-page-accent">
          Forecast
        </h1>
        <TimeHorizonSelector value={horizon} onChange={setHorizon} />
      </div>

      <div className="flex-1 min-h-0 overflow-auto px-6 pb-6">
        <div className="flex flex-col gap-4">
          {/* Net worth — full width */}
          {isLoading ? (
            CHART_SKELETON
          ) : isError ? (
            CHART_ERROR
          ) : (
            <NetWorthChart data={data?.netWorth ?? []} retirementMarkers={retirementMarkers} />
          )}

          {/* Bottom row: surplus left, retirement right */}
          <div className="grid grid-cols-2 gap-4">
            {isLoading ? (
              <>
                {CHART_SKELETON}
                {CHART_SKELETON}
              </>
            ) : isError ? (
              <>
                {CHART_ERROR}
                {CHART_ERROR}
              </>
            ) : (
              <>
                <SurplusAccumulationChart data={data?.surplus ?? []} />
                <RetirementChart members={data?.retirement ?? []} horizonEndYear={horizonEndYear} />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/frontend && bun scripts/run-tests.ts ForecastPage`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/frontend/src/pages/ForecastPage.tsx apps/frontend/src/pages/ForecastPage.test.tsx
git commit -m "feat(forecast): wire ForecastPage with all three chart panels and loading/error states"
```

---

## Testing

### Backend Tests

- [ ] Service: net worth year 0 excludes pension accounts
- [ ] Service: growth rate override on account takes precedence over settings default
- [ ] Service: real value = nominal / (1 + inflation)^year
- [ ] Service: surplus year N = monthlySurplus × 12 × N
- [ ] Service: retirement only includes pensions assigned to the member via `memberId`
- [ ] Service: returns null `retirementYear` when member has none set
- [ ] Service: returns all-zero series when no accounts exist
- [ ] Service: falls back to DEFAULT_SETTINGS when no HouseholdSettings row exists
- [ ] Endpoint: `GET /api/forecast` returns 401 without JWT
- [ ] Endpoint: `GET /api/forecast?horizonYears=10` returns 200 with correct shape
- [ ] Endpoint: `GET /api/forecast?horizonYears=7` returns 400
- [ ] Endpoint: `GET /api/forecast` (missing param) returns 400

### Frontend Tests

- [ ] Component: `TimeHorizonSelector` marks active option with `aria-pressed=true`
- [ ] Component: `NetWorthChart` renders empty-assets note when all nominals are zero
- [ ] Component: `RetirementChart` shows empty state with Settings link when member has no retirementYear
- [ ] Component: `RetirementChart` renders one tab per member
- [ ] Hook: `useForecast` returns data on success, surfaces error on failure

### Key Scenarios

- [ ] Happy path: household with accounts and members → all three charts render with data
- [ ] No assets: all charts show "Add assets in the Assets section to see your projection"
- [ ] Member with no retirement year: retirement tab shows empty state with Settings link
- [ ] Network error: all chart panels show "Could not load forecast — try refreshing"
- [ ] Horizon switch: changing from 10y to 30y refetches and re-renders all charts

---

## Verification

- [ ] `bun run build` passes clean
- [ ] `bun run lint` — zero warnings
- [ ] `bun run type-check` — zero errors
- [ ] `cd apps/backend && bun scripts/run-tests.ts forecast` — all pass
- [ ] `cd apps/frontend && bun scripts/run-tests.ts forecast` — all pass
- [ ] Manual: navigate to `/forecast`, verify time horizon selector updates all three charts, verify retirement tab switching, verify retirement year markers on net worth chart

---

## Post-conditions

- [ ] Forecast page is accessible from the main nav
- [ ] The three projection lenses give users a forward-looking view of their financial plan
- [ ] `forecastService.getProjections` can be extended to support scenario modelling in future
