# Backend Testing (Layers A–D)

## Layer A — Utility / Pure Unit Tests

**When:** Testing a pure function with no external dependencies (math, dates, string manipulation, error classes).

**Files:** `apps/backend/src/utils/*.test.ts` (beside the util)

**Snippet:**

```typescript
import { describe, it, expect } from "bun:test";
import { hashPassword, verifyPassword } from "../utils/password";

describe("hashPassword", () => {
  it("produces a verifiable hash", async () => {
    const hash = await hashPassword("test-password");
    expect(await verifyPassword("test-password", hash)).toBe(true);
  });
  it("rejects wrong password", async () => {
    const hash = await hashPassword("correct");
    expect(await verifyPassword("wrong", hash)).toBe(false);
  });
});
```

---

## Layer B — Shared Schema Contract Tests

**When:** Testing Zod schemas in `packages/shared` — valid acceptance, invalid rejection, enum constraints, defaults.

**Files:** `packages/shared/src/schemas/*.test.ts` (beside the schema)

**Snippet:**

```typescript
import { describe, it, expect } from "bun:test";
import { CreateIncomeSourceInputSchema } from "./waterfall.schemas";

describe("CreateIncomeSourceInputSchema", () => {
  it("accepts valid input", () => {
    const result = CreateIncomeSourceInputSchema.safeParse({
      name: "Salary",
      amount: 5000,
      frequency: "monthly",
    });
    expect(result.success).toBe(true);
  });
  it("rejects negative amount", () => {
    const result = CreateIncomeSourceInputSchema.safeParse({
      name: "Salary",
      amount: -1,
      frequency: "monthly",
    });
    expect(result.success).toBe(false);
  });
  it("rejects unknown frequency", () => {
    const result = CreateIncomeSourceInputSchema.safeParse({
      name: "Salary",
      amount: 5000,
      frequency: "weekly",
    });
    expect(result.success).toBe(false);
  });
});
```

---

## Layer C — Backend Service Tests

**When:** Testing business logic in a service file. Uses mocked Prisma — no real database.

**Files:** `apps/backend/src/services/*.test.ts` (beside the service)

**Snippet:**

```typescript
import { describe, it, expect, mock, beforeEach } from "bun:test";
import { prismaMock, resetPrismaMocks } from "../test/mocks/prisma";

// Mock must be declared before importing the module under test
mock.module("../config/database", () => ({ prisma: prismaMock }));

import { waterfallService } from "./waterfall.service";

beforeEach(() => resetPrismaMocks());

describe("waterfallService.listIncomeSources", () => {
  it("returns income sources for the household", async () => {
    prismaMock.incomeSource.findMany.mockResolvedValue([
      {
        id: "inc-1",
        householdId: "hh-1",
        name: "Salary",
        amount: 5000,
        frequency: "monthly",
        incomeType: "salary",
        sortOrder: 0,
        endedAt: null,
        lastReviewedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
    const result = await waterfallService.listIncomeSources("hh-1");
    expect(result).toHaveLength(1);
    expect(result[0]!.name).toBe("Salary");
  });

  it("throws if household not found", async () => {
    prismaMock.incomeSource.findMany.mockRejectedValue(new Error("Not found"));
    await expect(waterfallService.listIncomeSources("missing")).rejects.toThrow();
  });
});
```

**Transaction pattern:**

```typescript
// $transaction receives the prisma client as argument — mocked automatically
prismaMock.$transaction.mockImplementation(async (fn) => fn(prismaMock));
```

---

## Layer D — Backend Route Tests

**When:** Testing HTTP routes — auth enforcement, request validation, response shape. Mocks the service layer.

**Files:** `apps/backend/src/routes/*.test.ts` (beside the route)

**Snippet:**

```typescript
import { describe, it, expect, mock, beforeEach, afterEach } from "bun:test";
import { prismaMock, resetPrismaMocks } from "../test/mocks/prisma";
mock.module("../config/database", () => ({ prisma: prismaMock }));

// Mock the service layer — don't test business logic here
const waterfallServiceMock = {
  getSummary: mock(() =>
    Promise.resolve({ income: {}, committed: {}, discretionary: {}, surplus: {} })
  ),
};
mock.module("../services/waterfall.service", () => ({ waterfallService: waterfallServiceMock }));

import { buildTestApp } from "../test/helpers/fastify";
import type { FastifyInstance } from "fastify";

let app: FastifyInstance;
beforeEach(async () => {
  app = await buildTestApp();
});
afterEach(async () => app.close());

describe("GET /api/waterfall", () => {
  it("returns 401 without auth token", async () => {
    const res = await app.inject({ method: "GET", url: "/api/waterfall" });
    expect(res.statusCode).toBe(401);
  });

  it("returns waterfall summary when authenticated", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/waterfall",
      headers: { authorization: "Bearer valid-token" },
    });
    expect(res.statusCode).toBe(200);
  });
});
```

---

## DI Clock Pattern

**When:** A function depends on the current date/time (`new Date()`), making its tests non-deterministic.

**Convention:** Add an optional `now` parameter with `new Date()` as the default. Call sites that don't pass `now` behave identically to before. Tests pass a synthetic date to exercise boundary conditions.

```typescript
// Service function — accepts optional now
async getIsaAllowance(householdId: string, now: Date = new Date()): Promise<IsaAllowance> {
  // Use `now` instead of `new Date()` throughout
}

// Test — injects synthetic date
it("computes correct tax year boundary", async () => {
  const now = new Date("2026-03-15");
  const result = await wealthService.getIsaAllowance("hh-1", now);
  expect(result.taxYearStart).toContain("2025"); // Before April 6
});
```

**Functions using this pattern:**

| Function             | File                          | Boundary tested                 |
| -------------------- | ----------------------------- | ------------------------------- |
| `ensureJan1Snapshot` | `snapshot.service.ts`         | Jan 1 auto-snapshot creation    |
| `getIsaAllowance`    | `wealth.service.ts`           | ISA tax year start/end          |
| `getUpcomingGifts`   | `planner.service.ts`          | Gift event done/upcoming status |
| `monthsElapsed`      | `frontend/utils/staleness.ts` | Staleness month calculation     |
| `isStale`            | `frontend/utils/staleness.ts` | Staleness threshold comparison  |
| `stalenessLabel`     | `frontend/utils/staleness.ts` | Human-readable staleness text   |

---

## Infrastructure Reference

| File                                       | Purpose                                                                                                                            |
| ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------- |
| `apps/backend/src/test/setup.ts`           | Sets env vars before test imports: test DB URL, JWT secrets, Redis URL, `NODE_ENV=test`                                            |
| `apps/backend/src/test/fixtures/index.ts`  | Builder functions: `buildUser()`, `buildHousehold()`, `buildHouseholdMember()`, `buildHouseholdInvite()` + `resetFixtureCounter()` |
| `apps/backend/src/test/mocks/prisma.ts`    | `prismaMock` (all models mocked), `resetPrismaMocks()` (call in `beforeEach`)                                                      |
| `apps/backend/src/test/helpers/fastify.ts` | `buildTestApp()` — minimal Fastify instance for route tests (cookie plugin only)                                                   |
| `apps/backend/scripts/run-tests.ts`        | Custom runner — spawns each `.test.ts` in its own subprocess to prevent mock leakage                                               |

**Fixture builders** — all accept an optional overrides object:

```typescript
import {
  buildUser,
  buildHousehold,
  buildHouseholdMember,
  resetFixtureCounter,
} from "../test/fixtures";

// IDs are deterministic: 00000000-0000-0000-0000-000000000001, ...000002, etc.
const user = buildUser({ email: "custom@test.com" });
const household = buildHousehold({ name: "My Household" });
const member = buildHouseholdMember({ role: "owner", userId: user.id, householdId: household.id });

beforeEach(() => resetFixtureCounter()); // reset counter between tests if deterministic IDs matter
```

---

## Conventions for Adding New Tests

### Service test

1. Create `<name>.service.test.ts` beside the service
2. `mock.module("../config/database", ...)` before importing the service
3. `resetPrismaMocks()` in `beforeEach`
4. Cover: success path, validation failure, not-found / ownership error, edge cases
5. Assert `$transaction` behavior for multi-step writes

### Route test

1. Create `<name>.routes.test.ts` beside the route
2. Mock `../config/database` + the service module
3. Use `buildTestApp()` and `app.inject()`
4. Assert: 401 without auth, 400 for bad input, correct status code + response body for happy path

### Schema test

1. Create `<name>.schemas.test.ts` beside the schema in `packages/shared`
2. Use `safeParse` for all assertions
3. Cover: valid input, invalid/missing required fields, enum bounds, optional fields, transforms

---

## Current Gaps

- Real DB integration tests (Testcontainers) to catch Prisma query correctness
- Expand service coverage — not all services have tests yet
