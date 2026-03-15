# Performance Improvement (Option B) Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Eliminate N+1 database query patterns on the dashboard, wire up the Redis cache layer that is already half-configured, and add route-level code splitting to reduce frontend parse time.

**Architecture:** Three independent workstreams — backend query rewrites in `dashboard.service.ts` and `balance.utils.ts`, a new `cache.service.ts` that wraps `ioredis` and is called from route handlers, and `React.lazy()` wrapping of every page import in `App.tsx`. Each workstream is independently testable and deployable.

**Tech Stack:** Bun, Fastify, Prisma 6, PostgreSQL, ioredis, React 18, TanStack Query, Vite

---

## Context: Test Setup

- Tests use `bun:test` with `mock.module()` for dependency injection
- Prisma is mocked via `prismaMock` from `src/test/mocks/prisma.ts`
- Test fixtures are in `src/test/fixtures/index.ts` — use `buildTransaction()`, `buildAccount()`, etc.
- Run a single test file: `cd apps/backend && bun test --preload ./src/test/setup.ts src/services/dashboard.service.test.ts`
- Run all backend tests: `cd apps/backend && bun run test`
- Run all frontend tests: `cd apps/frontend && bun run test`
- `prismaMock.$queryRaw` is already mocked in `src/test/mocks/prisma.ts`

---

## Task 1: Add missing DB index on Transaction

**Files:**
- Modify: `apps/backend/prisma/schema.prisma` (Transaction model, around line 180)

**Step 1: Add the index**

In `schema.prisma`, find the `Transaction` model's index block and add one line:

```prisma
@@index([householdId, date])
@@index([householdId, categoryId, date])
@@index([recurringRuleId, date])
@@index([accountId, date])   // ADD THIS LINE
@@map("transactions")
```

**Step 2: Generate and apply the migration**

```bash
cd apps/backend
bunx prisma migrate dev --name add_transaction_accountId_date_index
```

Expected: migration file created in `prisma/migrations/`, Prisma client regenerated.

**Step 3: Verify**

```bash
bunx prisma studio
```

Open the Transaction model — confirm the new index appears. Or run:

```bash
bunx prisma migrate status
```

Expected: "Database schema is up to date"

**Step 4: Commit**

```bash
git add apps/backend/prisma/schema.prisma apps/backend/prisma/migrations/
git commit -m "perf(db): add composite index on transactions(accountId, date)"
```

---

## Task 2: Fix `getNetWorthTrend` — O(N×3) → O(3) queries

**Files:**
- Modify: `apps/backend/src/services/dashboard.service.ts` (lines 192–258)
- Modify: `apps/backend/src/services/dashboard.service.test.ts` (lines 104–131)

**Step 1: Update the test first**

Replace the `getNetWorthTrend` describe block in `dashboard.service.test.ts` with:

```typescript
describe("dashboardService.getNetWorthTrend", () => {
  it("returns empty array when user has no accounts", async () => {
    prismaMock.account.findMany.mockResolvedValue([]);
    const result = await dashboardService.getNetWorthTrend("user-1");
    expect(result).toEqual([]);
  });

  it("returns monthly data points with correct structure and net worth calculation", async () => {
    prismaMock.account.findMany.mockResolvedValue([buildAccount({ id: "acc-1" })]);

    // Single batch: all transactions across all months
    prismaMock.transaction.findMany.mockResolvedValue([
      buildTransaction({ accountId: "acc-1", amount: 5000, type: "income", date: new Date("2025-01-01") }),
      buildTransaction({ accountId: "acc-1", amount: 1000, type: "expense", date: new Date("2025-01-15") }),
    ]);

    // Single batch: all assets
    prismaMock.asset.findMany.mockResolvedValue([
      { currentValue: 100000, createdAt: new Date("2024-01-01") },
    ]);

    // Single batch: all liabilities
    prismaMock.liability.findMany.mockResolvedValue([
      { currentBalance: 50000, createdAt: new Date("2024-01-01") },
    ]);

    const result = await dashboardService.getNetWorthTrend("user-1", 3);

    expect(result.length).toBeGreaterThan(0);
    expect(result[0]).toHaveProperty("month");
    expect(result[0]).toHaveProperty("cash");
    expect(result[0]).toHaveProperty("balance");
    expect(result[0]).toHaveProperty("assets");
    expect(result[0]).toHaveProperty("liabilities");
    expect(result[0]).toHaveProperty("netWorth");

    // netWorth must equal cash + assets - liabilities
    for (const point of result) {
      expect(point.netWorth).toBe(
        (point.cash ?? 0) + (point.assets ?? 0) - (point.liabilities ?? 0)
      );
    }
  });
});
```

**Step 2: Run the test to confirm it fails**

```bash
cd apps/backend && bun test --preload ./src/test/setup.ts src/services/dashboard.service.test.ts
```

Expected: FAIL — `prisma.transaction.findMany` isn't being called (old impl calls `calculateAccountBalances` which is mocked at module level).

**Step 3: Rewrite `getNetWorthTrend` in `dashboard.service.ts`**

Replace the entire `getNetWorthTrend` method with:

```typescript
async getNetWorthTrend(householdId: string, months: number = 6) {
  const now = new Date();

  const accounts = await prisma.account.findMany({
    where: { householdId, isActive: true },
    select: { id: true },
  });

  const accountIds = accounts.map(a => a.id);
  if (accountIds.length === 0) return [];

  // Generate month-end dates
  const monthlyDates: Date[] = [];
  for (let i = 0; i <= months; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() - months + i + 1, 0);
    monthlyDates.push(date);
  }

  const lastDate = monthlyDates[monthlyDates.length - 1];
  const cutoff = endOfDay(lastDate);

  // 3 queries total regardless of how many months are requested
  const [allTransactions, allAssets, allLiabilities] = await Promise.all([
    prisma.transaction.findMany({
      where: {
        accountId: { in: accountIds },
        date: { lte: cutoff },
      },
      select: { accountId: true, amount: true, type: true, date: true },
    }),
    prisma.asset.findMany({
      where: { householdId },
      select: { currentValue: true, createdAt: true },
    }),
    prisma.liability.findMany({
      where: { householdId },
      select: { currentBalance: true, createdAt: true },
    }),
  ]);

  return monthlyDates.map(date => {
    const monthCutoff = endOfDay(date);

    const cash = allTransactions
      .filter(t => t.date <= monthCutoff)
      .reduce((sum, t) => {
        const amount = Number(t.amount);
        return sum + (t.type === 'income' ? amount : -amount);
      }, 0);

    const totalAssets = allAssets
      .filter(a => a.createdAt <= monthCutoff)
      .reduce((sum, a) => sum + Number(a.currentValue), 0);

    const totalLiabilities = allLiabilities
      .filter(l => l.createdAt <= monthCutoff)
      .reduce((sum, l) => sum + Number(l.currentBalance), 0);

    const netWorth = cash + totalAssets - totalLiabilities;
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

    return {
      month: monthKey,
      balance: cash,
      cash,
      assets: totalAssets,
      liabilities: totalLiabilities,
      netWorth,
    };
  });
},
```

Note: `endOfDay` is already imported from `../utils/balance.utils` at the top of the file.

**Step 4: Run the test to confirm it passes**

```bash
cd apps/backend && bun test --preload ./src/test/setup.ts src/services/dashboard.service.test.ts
```

Expected: PASS

**Step 5: Commit**

```bash
git add apps/backend/src/services/dashboard.service.ts apps/backend/src/services/dashboard.service.test.ts
git commit -m "perf(dashboard): rewrite getNetWorthTrend from O(N×3) to O(3) queries"
```

---

## Task 3: Fix `getIncomeExpenseTrend` — push grouping into PostgreSQL

**Files:**
- Modify: `apps/backend/src/services/dashboard.service.ts` (lines 264–310)
- Modify: `apps/backend/src/services/dashboard.service.test.ts` (lines 133–150)

**Step 1: Update the test first**

Replace the `getIncomeExpenseTrend` describe block in `dashboard.service.test.ts` with:

```typescript
describe("dashboardService.getIncomeExpenseTrend", () => {
  it("groups transactions by month using DB aggregation", async () => {
    // $queryRaw returns pre-aggregated rows — one row per month per type
    prismaMock.$queryRaw.mockResolvedValue([
      { month: "2025-01", type: "income", total: "1000" },
      { month: "2025-01", type: "expense", total: "500" },
      { month: "2025-02", type: "income", total: "2000" },
    ]);

    const result = await dashboardService.getIncomeExpenseTrend("user-1", 6);

    expect(result.length).toBeGreaterThanOrEqual(2);

    const jan = result.find((d) => d.month === "2025-01");
    expect(jan).toBeDefined();
    expect(jan!.income).toBe(1000);
    expect(jan!.expense).toBe(500);
    expect(jan!.net).toBe(500);

    const feb = result.find((d) => d.month === "2025-02");
    expect(feb).toBeDefined();
    expect(feb!.income).toBe(2000);
    expect(feb!.expense).toBe(0);
  });

  it("returns empty array when no transactions", async () => {
    prismaMock.$queryRaw.mockResolvedValue([]);
    const result = await dashboardService.getIncomeExpenseTrend("user-1", 6);
    expect(result).toEqual([]);
  });
});
```

**Step 2: Run the test to confirm it fails**

```bash
cd apps/backend && bun test --preload ./src/test/setup.ts src/services/dashboard.service.test.ts
```

Expected: FAIL

**Step 3: Rewrite `getIncomeExpenseTrend` in `dashboard.service.ts`**

Replace the entire `getIncomeExpenseTrend` method with:

```typescript
async getIncomeExpenseTrend(householdId: string, months: number = 6) {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - months);

  type RawRow = { month: string; type: string; total: string };

  const rows = await prisma.$queryRaw<RawRow[]>`
    SELECT
      TO_CHAR(DATE_TRUNC('month', date), 'YYYY-MM') AS month,
      type,
      SUM(amount)::text AS total
    FROM transactions
    WHERE household_id = ${householdId}
      AND date >= ${startDate}
      AND date <= ${endDate}
    GROUP BY DATE_TRUNC('month', date), type
    ORDER BY DATE_TRUNC('month', date)
  `;

  const monthlyData: Record<string, { income: number; expense: number }> = {};

  for (const row of rows) {
    if (!monthlyData[row.month]) {
      monthlyData[row.month] = { income: 0, expense: 0 };
    }
    const amount = parseFloat(row.total);
    if (row.type === 'income') {
      monthlyData[row.month].income = amount;
    } else {
      monthlyData[row.month].expense = amount;
    }
  }

  return Object.entries(monthlyData).map(([month, data]) => ({
    month,
    income: data.income,
    expense: data.expense,
    net: data.income - data.expense,
  }));
},
```

**Step 4: Run the test to confirm it passes**

```bash
cd apps/backend && bun test --preload ./src/test/setup.ts src/services/dashboard.service.test.ts
```

Expected: PASS

**Step 5: Commit**

```bash
git add apps/backend/src/services/dashboard.service.ts apps/backend/src/services/dashboard.service.test.ts
git commit -m "perf(dashboard): replace JS groupBy in getIncomeExpenseTrend with SQL GROUP BY"
```

---

## Task 4: Fix `calculateAccountsBalanceHistory` — O(N×M) → O(1) queries

**Files:**
- Modify: `apps/backend/src/utils/balance.utils.ts` (lines 242–294)
- Create: `apps/backend/src/utils/balance.utils.test.ts` (new test file — none exists yet)

**Step 1: Write the failing test**

Create `apps/backend/src/utils/balance.utils.test.ts`:

```typescript
import { describe, it, expect, mock, beforeEach } from "bun:test";
import { prismaMock, resetPrismaMocks } from "../test/mocks/prisma";
import { buildTransaction } from "../test/fixtures";

mock.module("../config/database", () => ({
  prisma: prismaMock,
}));

import { calculateAccountsBalanceHistory } from "./balance.utils";

beforeEach(() => {
  resetPrismaMocks();
});

describe("calculateAccountsBalanceHistory", () => {
  it("returns empty map for empty accountIds", async () => {
    const result = await calculateAccountsBalanceHistory([], new Map());
    expect(result.size).toBe(0);
  });

  it("fetches all transactions in ONE query and computes weekly snapshots in memory", async () => {
    const now = new Date();
    const createdAt = new Date(now);
    createdAt.setDate(createdAt.getDate() - 14); // account created 2 weeks ago

    prismaMock.transaction.findMany.mockResolvedValue([
      buildTransaction({
        accountId: "acc-1",
        amount: 1000,
        type: "income",
        date: new Date(createdAt),
      }),
      buildTransaction({
        accountId: "acc-1",
        amount: 200,
        type: "expense",
        date: new Date(createdAt),
      }),
    ]);

    const result = await calculateAccountsBalanceHistory(
      ["acc-1"],
      new Map([["acc-1", createdAt]]),
      30
    );

    // Only one findMany call regardless of snapshot count
    expect(prismaMock.transaction.findMany).toHaveBeenCalledTimes(1);

    const history = result.get("acc-1");
    expect(history).toBeDefined();
    expect(history!.length).toBeGreaterThan(0);

    // Final snapshot should reflect income - expense = 800
    const latestSnapshot = history![history!.length - 1];
    expect(latestSnapshot.balance).toBe(800);
  });

  it("returns empty history for account with no creation date", async () => {
    prismaMock.transaction.findMany.mockResolvedValue([]);
    const result = await calculateAccountsBalanceHistory(
      ["acc-1"],
      new Map(), // no creation date for acc-1
      30
    );
    const history = result.get("acc-1");
    expect(history).toEqual([]);
  });
});
```

**Step 2: Run the test to confirm it fails**

```bash
cd apps/backend && bun test --preload ./src/test/setup.ts src/utils/balance.utils.test.ts
```

Expected: FAIL — `prisma.transaction.findMany` called more than once (current impl calls `calculateAccountBalance` per snapshot).

**Step 3: Rewrite `calculateAccountsBalanceHistory` in `balance.utils.ts`**

Replace the entire `calculateAccountsBalanceHistory` function (lines 242–294) with:

```typescript
export async function calculateAccountsBalanceHistory(
  accountIds: string[],
  accountCreationDates: Map<string, Date>,
  daysBack: number = 90
): Promise<Map<string, Array<{ date: Date; balance: number }>>> {
  if (accountIds.length === 0) {
    return new Map();
  }

  const now = new Date();
  const defaultStartDate = new Date(now);
  defaultStartDate.setDate(defaultStartDate.getDate() - daysBack);

  // ONE query for all accounts across all time — compute snapshots in memory
  const allTransactions = await prisma.transaction.findMany({
    where: {
      accountId: { in: accountIds },
      date: { lte: endOfDay(now) },
    },
    select: {
      accountId: true,
      amount: true,
      type: true,
      date: true,
    },
  });

  const historiesMap = new Map<string, Array<{ date: Date; balance: number }>>();
  accountIds.forEach(id => historiesMap.set(id, []));

  for (const accountId of accountIds) {
    const creationDate = accountCreationDates.get(accountId);
    if (!creationDate) continue;

    const startDate = creationDate > defaultStartDate ? creationDate : defaultStartDate;
    const daysDiff = Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const weeksBack = Math.ceil(daysDiff / 7);

    // Transactions for this account only — filter in memory
    const accountTxs = allTransactions.filter(t => t.accountId === accountId);

    for (let i = weeksBack; i >= 0; i--) {
      const snapshotDate = new Date(now);
      snapshotDate.setDate(snapshotDate.getDate() - (i * 7));

      if (snapshotDate < startDate) continue;

      const snapshotCutoff = endOfDay(snapshotDate);
      const balance = accountTxs
        .filter(t => t.date <= snapshotCutoff)
        .reduce((sum, t) => {
          const amount = Number(t.amount);
          return sum + (t.type === 'income' ? amount : -amount);
        }, 0);

      historiesMap.get(accountId)!.push({ date: snapshotDate, balance });
    }
  }

  return historiesMap;
}
```

**Step 4: Run the test to confirm it passes**

```bash
cd apps/backend && bun test --preload ./src/test/setup.ts src/utils/balance.utils.test.ts
```

Expected: PASS

**Step 5: Run all backend tests to check for regressions**

```bash
cd apps/backend && bun run test
```

Expected: All tests pass

**Step 6: Commit**

```bash
git add apps/backend/src/utils/balance.utils.ts apps/backend/src/utils/balance.utils.test.ts
git commit -m "perf(balance): rewrite calculateAccountsBalanceHistory from O(N×M) to O(1) queries"
```

---

## Task 5: Create the Redis cache service

**Files:**
- Create: `apps/backend/src/services/cache.service.ts`
- Create: `apps/backend/src/services/cache.service.test.ts`

**Step 1: Write the failing test**

Create `apps/backend/src/services/cache.service.test.ts`:

```typescript
import { describe, it, expect, mock, beforeEach } from "bun:test";

// Mock ioredis before importing the service
const mockGet = mock(() => Promise.resolve(null));
const mockSetex = mock(() => Promise.resolve("OK"));
const mockDel = mock(() => Promise.resolve(1));
const mockKeys = mock(() => Promise.resolve([]));

mock.module("ioredis", () => {
  return {
    default: class MockRedis {
      on() { return this; }
      get = mockGet;
      setex = mockSetex;
      del = mockDel;
      keys = mockKeys;
    },
  };
});

import { cacheService } from "./cache.service";

beforeEach(() => {
  mockGet.mockReset();
  mockSetex.mockReset();
  mockDel.mockReset();
  mockKeys.mockReset();
});

describe("cacheService.get", () => {
  it("returns null on cache miss", async () => {
    mockGet.mockResolvedValue(null);
    const result = await cacheService.get("some-key");
    expect(result).toBeNull();
  });

  it("returns parsed JSON on cache hit", async () => {
    mockGet.mockResolvedValue(JSON.stringify({ foo: "bar" }));
    const result = await cacheService.get<{ foo: string }>("some-key");
    expect(result).toEqual({ foo: "bar" });
  });

  it("returns null on Redis error without throwing", async () => {
    mockGet.mockRejectedValue(new Error("Redis connection refused"));
    const result = await cacheService.get("some-key");
    expect(result).toBeNull();
  });
});

describe("cacheService.set", () => {
  it("serialises value and sets with TTL", async () => {
    mockSetex.mockResolvedValue("OK");
    await cacheService.set("my-key", { x: 1 }, 120);
    expect(mockSetex).toHaveBeenCalledWith("my-key", 120, JSON.stringify({ x: 1 }));
  });

  it("does not throw on Redis error", async () => {
    mockSetex.mockRejectedValue(new Error("Redis down"));
    await expect(cacheService.set("key", "value", 60)).resolves.toBeUndefined();
  });
});

describe("cacheService.invalidate", () => {
  it("deletes the given keys", async () => {
    mockDel.mockResolvedValue(2);
    await cacheService.invalidate("key-a", "key-b");
    expect(mockDel).toHaveBeenCalledWith("key-a", "key-b");
  });

  it("does nothing when no keys passed", async () => {
    await cacheService.invalidate();
    expect(mockDel).not.toHaveBeenCalled();
  });
});

describe("cacheService.invalidatePattern", () => {
  it("deletes all keys matching the pattern", async () => {
    mockKeys.mockResolvedValue(["dashboard:summary:hh-1:2026-03"]);
    mockDel.mockResolvedValue(1);
    await cacheService.invalidatePattern("dashboard:*:hh-1:*");
    expect(mockDel).toHaveBeenCalledWith("dashboard:summary:hh-1:2026-03");
  });

  it("does not call del when no keys match", async () => {
    mockKeys.mockResolvedValue([]);
    await cacheService.invalidatePattern("dashboard:*:hh-1:*");
    expect(mockDel).not.toHaveBeenCalled();
  });
});
```

**Step 2: Run the test to confirm it fails**

```bash
cd apps/backend && bun test --preload ./src/test/setup.ts src/services/cache.service.test.ts
```

Expected: FAIL — `cache.service.ts` does not exist

**Step 3: Create `cache.service.ts`**

Create `apps/backend/src/services/cache.service.ts`:

```typescript
import Redis from 'ioredis';
import { config } from '../config/env';

let redis: Redis | null = null;

function getRedis(): Redis | null {
  if (!config.REDIS_URL) return null;
  if (!redis) {
    redis = new Redis(config.REDIS_URL, {
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
    });
    redis.on('error', (err: Error) => {
      // Log but never throw — Redis failure must not break the app
      console.error('[cache] Redis error:', err.message);
    });
  }
  return redis;
}

export const cacheService = {
  async get<T>(key: string): Promise<T | null> {
    try {
      const client = getRedis();
      if (!client) return null;
      const raw = await client.get(key);
      if (!raw) return null;
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  },

  async set(key: string, value: unknown, ttlSeconds: number): Promise<void> {
    try {
      const client = getRedis();
      if (!client) return;
      await client.setex(key, ttlSeconds, JSON.stringify(value));
    } catch {
      // Silent — Redis failure must not surface to callers
    }
  },

  async invalidate(...keys: string[]): Promise<void> {
    try {
      const client = getRedis();
      if (!client || keys.length === 0) return;
      await client.del(...keys);
    } catch {
      // Silent
    }
  },

  async invalidatePattern(pattern: string): Promise<void> {
    try {
      const client = getRedis();
      if (!client) return;
      const keys = await client.keys(pattern);
      if (keys.length > 0) {
        await client.del(...keys);
      }
    } catch {
      // Silent
    }
  },
};
```

**Step 4: Run the test to confirm it passes**

```bash
cd apps/backend && bun test --preload ./src/test/setup.ts src/services/cache.service.test.ts
```

Expected: PASS

**Step 5: Commit**

```bash
git add apps/backend/src/services/cache.service.ts apps/backend/src/services/cache.service.test.ts
git commit -m "feat(cache): add Redis cache service with silent fallback on failure"
```

---

## Task 6: Integrate cache into dashboard route handlers

**Files:**
- Modify: `apps/backend/src/routes/dashboard.routes.ts`

No new tests needed — the cache service is already unit tested, and route-level integration tests don't exist in this codebase. Manual verification is sufficient here.

**Step 1: Add cache reads and writes to each handler**

Replace the contents of `apps/backend/src/routes/dashboard.routes.ts` with:

```typescript
import { FastifyInstance } from 'fastify';
import { dashboardService } from '../services/dashboard.service';
import { cacheService } from '../services/cache.service';
import { authMiddleware } from '../middleware/auth.middleware';

export async function dashboardRoutes(fastify: FastifyInstance) {
  // Get dashboard summary
  fastify.get(
    '/dashboard/summary',
    { preHandler: [authMiddleware] },
    async (request, reply) => {
      const householdId = request.householdId!;
      const { startDate, endDate } = request.query as any;

      const options: any = {};
      if (startDate) options.startDate = new Date(startDate);
      if (endDate) options.endDate = new Date(endDate);

      // Cache key includes year-month so different date range requests don't collide
      const yearMonth = options.startDate
        ? `${options.startDate.getFullYear()}-${String(options.startDate.getMonth() + 1).padStart(2, '0')}`
        : `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
      const cacheKey = `dashboard:summary:${householdId}:${yearMonth}`;

      const cached = await cacheService.get(cacheKey);
      if (cached) return reply.send(cached);

      const summary = await dashboardService.getDashboardSummary(householdId, options);
      void cacheService.set(cacheKey, summary, 120); // 2 min TTL

      return reply.send(summary);
    }
  );

  // Get net worth trend
  fastify.get(
    '/dashboard/net-worth-trend',
    { preHandler: [authMiddleware] },
    async (request, reply) => {
      const householdId = request.householdId!;
      const { months } = request.query as any;
      const monthsNum = months ? Number(months) : 6;

      const cacheKey = `dashboard:nwt:${householdId}:${monthsNum}`;
      const cached = await cacheService.get(cacheKey);
      if (cached) return reply.send(cached);

      const trend = await dashboardService.getNetWorthTrend(householdId, monthsNum);
      const payload = { trend };
      void cacheService.set(cacheKey, payload, 300); // 5 min TTL

      return reply.send(payload);
    }
  );

  // Get income vs expense trend
  fastify.get(
    '/dashboard/income-expense-trend',
    { preHandler: [authMiddleware] },
    async (request, reply) => {
      const householdId = request.householdId!;
      const { months } = request.query as any;
      const monthsNum = months ? Number(months) : 6;

      const cacheKey = `dashboard:iet:${householdId}:${monthsNum}`;
      const cached = await cacheService.get(cacheKey);
      if (cached) return reply.send(cached);

      const trend = await dashboardService.getIncomeExpenseTrend(householdId, monthsNum);
      const payload = { trend };
      void cacheService.set(cacheKey, payload, 300); // 5 min TTL

      return reply.send(payload);
    }
  );
}
```

**Step 2: Run all backend tests to check for regressions**

```bash
cd apps/backend && bun run test
```

Expected: All tests pass

**Step 3: Commit**

```bash
git add apps/backend/src/routes/dashboard.routes.ts
git commit -m "perf(cache): add Redis cache to dashboard route handlers with 2-5 min TTL"
```

---

## Task 7: Add cache invalidation to write routes

**Files:**
- Modify: `apps/backend/src/routes/transaction.routes.ts`
- Modify: `apps/backend/src/routes/asset.routes.ts`
- Modify: `apps/backend/src/routes/liability.routes.ts`

**Step 1: Add invalidation helper to `transaction.routes.ts`**

At the top of the file, add the import:

```typescript
import { cacheService } from '../services/cache.service';
```

Then in each of the three mutating handlers (POST, PUT, DELETE), add a fire-and-forget invalidation call immediately after the successful DB operation. Use `householdId` which is already available in scope.

In the `POST /transactions` handler, after `auditService.log(...)`:
```typescript
void cacheService.invalidatePattern(`dashboard:*:${householdId}:*`);
```

In the `PUT /transactions/:id` handler, after `transactionService.updateTransaction(...)`:
```typescript
void cacheService.invalidatePattern(`dashboard:*:${householdId}:*`);
```

In the `DELETE /transactions/:id` handler, after `auditService.log(...)`:
```typescript
void cacheService.invalidatePattern(`dashboard:*:${householdId}:*`);
```

**Step 2: Add invalidation to `asset.routes.ts`**

Open the file, add the import at the top:

```typescript
import { cacheService } from '../services/cache.service';
```

In each mutating handler (POST, PUT, DELETE), add after the successful DB operation:
```typescript
void cacheService.invalidatePattern(`dashboard:*:${householdId}:*`);
```

**Step 3: Add invalidation to `liability.routes.ts`**

Same pattern — add the import and the `invalidatePattern` call in each mutating handler.

**Step 4: Run all backend tests**

```bash
cd apps/backend && bun run test
```

Expected: All tests pass

**Step 5: Commit**

```bash
git add apps/backend/src/routes/transaction.routes.ts apps/backend/src/routes/asset.routes.ts apps/backend/src/routes/liability.routes.ts
git commit -m "perf(cache): invalidate dashboard cache on transaction/asset/liability writes"
```

---

## Task 8: Add Redis service to production docker-compose

**Files:**
- Modify: `docker-compose.yml`

Note: `docker-compose.dev.yml` already has a Redis service configured — nothing to do there.

**Step 1: Add the Redis service**

In `docker-compose.yml`, add a `redis` service block before the `backend` service, and add a `depends_on` entry to `backend`:

```yaml
services:
  redis:
    image: redis:7-alpine
    restart: unless-stopped
    networks:
      - coolify

  backend:
    build:
      context: .
      dockerfile: apps/backend/Dockerfile
    environment:
      DATABASE_URL: ${DATABASE_URL}
      REDIS_URL: ${REDIS_URL}
      JWT_SECRET: ${JWT_SECRET}
      JWT_REFRESH_SECRET: ${JWT_REFRESH_SECRET}
      COOKIE_SECRET: ${COOKIE_SECRET}
      CORS_ORIGIN: ${CORS_ORIGIN}
      NODE_ENV: production
    depends_on:
      - redis
    networks:
      - coolify
    restart: unless-stopped

  frontend:
    # ... unchanged
```

**Step 2: Verify `REDIS_URL` is set in your deployment environment**

The `REDIS_URL` should be `redis://redis:6379` (using the Docker service name `redis` as the hostname). Set this in your Coolify environment variables.

**Step 3: Commit**

```bash
git add docker-compose.yml
git commit -m "infra: add Redis service to production docker-compose"
```

---

## Task 9: Frontend route-level code splitting

**Files:**
- Modify: `apps/frontend/src/App.tsx`

**Step 1: Write the test first**

The existing `App.test.tsx` tests render behaviour — check what it currently imports and ensure it will still pass after the change. Run it first to establish a baseline:

```bash
cd apps/frontend && bun test --preload src/test/setup.ts src/App.test.tsx
```

Expected: PASS (baseline confirmed)

**Step 2: Rewrite `App.tsx` with lazy imports**

Replace ALL static page imports and the `ProtectedAppRoutes` export in `apps/frontend/src/App.tsx` with:

```typescript
import { useEffect, lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Toaster } from 'react-hot-toast';
import { queryClient } from './lib/queryClient';
import { useAuthStore } from "./stores/authStore";
import Layout from "./components/layout/Layout";

// Auth pages
const LoginPage = lazy(() => import("./pages/auth/LoginPage"));
const RegisterPage = lazy(() => import("./pages/auth/RegisterPage"));
const AcceptInvitePage = lazy(() => import("./pages/auth/AcceptInvitePage"));

// App pages
const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const AccountsPage = lazy(() => import("./pages/AccountsPage"));
const TransactionsPage = lazy(() => import("./pages/TransactionsPage"));
const AssetsPage = lazy(() => import("./pages/AssetsPage"));
const LiabilitiesPage = lazy(() => import("./pages/LiabilitiesPage"));
const GoalsPage = lazy(() => import("./pages/GoalsPage"));
const BudgetsPage = lazy(() => import("./pages/BudgetsPage"));
const BudgetDetailPage = lazy(() => import("./pages/BudgetDetailPage"));
const DesignPage = lazy(() => import("./pages/DesignPage"));

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background text-muted-foreground">
    Loading...
  </div>
);

export function ProtectedAppRoutes() {
  return (
    <Layout>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/accounts" element={<AccountsPage />} />
          <Route path="/transactions" element={<TransactionsPage />} />
          <Route path="/assets" element={<AssetsPage />} />
          <Route path="/liabilities" element={<LiabilitiesPage />} />
          <Route path="/budget" element={<BudgetsPage />} />
          <Route path="/budget/:id" element={<BudgetDetailPage />} />
          <Route path="/goals" element={<GoalsPage />} />
          <Route path="/settings/household" element={<Navigate to="/profile" replace />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/" element={<Navigate to="/dashboard" />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Suspense>
    </Layout>
  );
}

function App() {
  const authStatus = useAuthStore((state) => state.authStatus);
  const initializeAuth = useAuthStore((state) => state.initializeAuth);
  const isDesignPage = import.meta.env.DEV && window.location.pathname.startsWith('/design');
  const isAuthenticated = authStatus === 'authenticated';

  useEffect(() => {
    if (isDesignPage) return;
    void initializeAuth();
  }, [initializeAuth, isDesignPage]);

  return (
    <QueryClientProvider client={queryClient}>
      <Toaster position="top-right" />
      {isDesignPage ? (
        <Suspense fallback={<PageLoader />}>
          <DesignPage />
        </Suspense>
      ) : authStatus === 'initializing' ? (
        <div className="min-h-screen flex items-center justify-center bg-background text-muted-foreground">
          Restoring secure session...
        </div>
      ) : (
        <>
          <BrowserRouter>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route
                  path="/login"
                  element={isAuthenticated ? <Navigate to="/dashboard" /> : <LoginPage />}
                />
                <Route
                  path="/register"
                  element={isAuthenticated ? <Navigate to="/dashboard" /> : <RegisterPage />}
                />
                <Route path="/accept-invite/:token" element={<AcceptInvitePage />} />
                <Route
                  path="/*"
                  element={
                    isAuthenticated ? (
                      <ProtectedAppRoutes />
                    ) : (
                      <Navigate to="/login" />
                    )
                  }
                />
              </Routes>
            </Suspense>
          </BrowserRouter>
          <ReactQueryDevtools initialIsOpen={false} />
        </>
      )}
    </QueryClientProvider>
  );
}

export default App;
```

**Step 3: Run the frontend tests**

```bash
cd apps/frontend && bun run test
```

Expected: All tests pass

**Step 4: Verify in the browser (manual)**

Start the dev server and open the browser network tab. On first load, you should see separate chunk files being requested as you navigate to each route. The initial bundle should be noticeably smaller.

```bash
cd apps/frontend && bun run dev
```

**Step 5: Commit**

```bash
git add apps/frontend/src/App.tsx
git commit -m "perf(frontend): add route-level code splitting with React.lazy for all pages"
```

---

## Verification Checklist

After all tasks are complete:

- [ ] `cd apps/backend && bun run test` — all tests pass
- [ ] `cd apps/frontend && bun run test` — all tests pass
- [ ] Dashboard loads correctly in the browser with Redis running
- [ ] Creating a transaction invalidates the dashboard cache (verify by checking Redis or by observing a fresh DB call after a write)
- [ ] Browser network tab shows separate JS chunks loading per route
- [ ] If Redis is stopped, the dashboard still loads (fallback to live queries)
