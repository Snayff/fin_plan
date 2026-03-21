# Performance Improvement Design — Option B

**Date:** 2026-03-15
**Status:** Approved
**Scope:** Backend query optimisation, Redis caching, frontend code splitting

---

## Problem

The app has three classes of performance issue identified during a proactive review:

1. **N+1 / N×M query patterns** in dashboard aggregation endpoints — the net-worth trend fires 3 DB queries per month (18+ for 6 months), and the account balance history fires one query per account per weekly snapshot.
2. **No server-side caching** — Redis is installed (`ioredis`) and referenced in env config and docker-compose but never wired up. Expensive dashboard aggregates are recomputed on every request.
3. **No route-level code splitting** — all 10+ page components are statically imported in `App.tsx`, forcing every page's dependencies (Recharts, D3, Framer Motion) to be parsed before the app can render.

---

## Constraints

- Must not reduce accessibility, security, or reliability
- Redis unavailability must never break the app — always fall back to live computation
- No changes to the public API shape or authentication model
- Database migrations are in scope (new indexes)

---

## Section 1 — Backend Query Fixes

### 1.1 `getNetWorthTrend` — O(N×3) → O(3)

**Current behaviour:** For each of N month-end dates, fires 3 separate queries:
- `calculateAccountBalances(accountIds, date)` — fetches all transactions up to that date
- `prisma.asset.aggregate(...)` — sums asset values up to that date
- `prisma.liability.aggregate(...)` — sums liability balances up to that date

For 6 months this is 18 queries; for 12 months it is 36.

**Fix:** Fetch all required data in 3 queries total, then compute per-month values in JS:
- One `prisma.transaction.findMany` for all transactions across all accounts up to the latest month-end date, selecting `accountId`, `amount`, `type`, `date`
- One `prisma.asset.findMany` for all assets for the household, selecting `currentValue`, `createdAt`
- One `prisma.liability.findMany` for all liabilities, selecting `currentBalance`, `createdAt`

Iterate over month-end dates in JS, filtering each dataset to the relevant cutoff. Balance per account at each date is computed by summing transactions up to that date — same logic as `calculateAccountBalances` but applied in memory across a pre-fetched dataset.

### 1.2 `calculateAccountsBalanceHistory` — O(N×M) → O(1)

**Current behaviour:** Nested loop — for each account, for each weekly snapshot date, calls `calculateAccountBalance` individually. For 3 accounts × 13 weekly snapshots = 39 queries.

**Fix:** Fetch all transactions for all accounts up to the latest snapshot date in a single query. Compute each account's balance at each snapshot date by filtering the in-memory dataset by `accountId` and `date <= snapshotDate`. This is O(1) queries regardless of account count or snapshot count.

### 1.3 `getIncomeExpenseTrend` — JS grouping → DB aggregation

**Current behaviour:** Fetches every transaction in the date range as full rows, then groups by month in a JS `forEach` loop. For a household with thousands of transactions this sends unnecessary data over the wire to Node.

**Fix:** Replace with `prisma.$queryRaw` using PostgreSQL's `DATE_TRUNC('month', date)` + `GROUP BY` + `SUM(amount)` filtered by type. This lets the DB aggregate and return one row per month per type, regardless of transaction volume.

### 1.4 Missing DB index

Add `@@index([accountId, date])` to the `Transaction` model in `schema.prisma`.

Every balance calculation (`calculateAccountBalance`, `calculateAccountBalances`) filters transactions by `accountId` and applies a `date` range filter or sort. Without this composite index, PostgreSQL performs a scan of all household transactions. This index also benefits the transaction list endpoint when filtering by account.

---

## Section 2 — Redis Caching Layer

### 2.1 Infrastructure

Add a `redis` service to `docker-compose.yml` and `docker-compose.dev.yml` using the official `redis:7-alpine` image. The `REDIS_URL` env var is already defined in the backend env schema and docker-compose environment blocks.

### 2.2 Cache service

Create `apps/backend/src/services/cache.service.ts` — a thin wrapper around `ioredis` with:
- `get<T>(key: string): Promise<T | null>` — deserialises JSON, returns null on miss or Redis error
- `set(key: string, value: unknown, ttlSeconds: number): Promise<void>` — serialises to JSON
- `invalidate(...keys: string[]): Promise<void>` — deletes one or more keys
- `invalidatePattern(pattern: string): Promise<void>` — deletes all keys matching a glob pattern (used for household-scoped invalidation)

All methods catch Redis errors and log them without rethrowing — Redis failure is silent and the app falls back to live computation.

### 2.3 Cached endpoints

| Endpoint | Cache key pattern | TTL |
|---|---|---|
| `GET /api/dashboard/summary` | `dashboard:summary:{householdId}:{yearMonth}` | 2 minutes |
| `GET /api/dashboard/net-worth-trend` | `dashboard:nwt:{householdId}:{months}` | 5 minutes |
| `GET /api/dashboard/income-expense-trend` | `dashboard:iet:{householdId}:{months}` | 5 minutes |

`yearMonth` (e.g. `2026-03`) is included in the summary key so custom date range requests do not collide with the default current-month view.

Caching is applied at the route handler level — check cache before calling the service, write to cache after.

### 2.4 Cache invalidation

Invalidate all `dashboard:*:{householdId}:*` keys after any successful write to data that feeds the dashboard. Invalidation is fire-and-forget (not awaited, does not affect response time).

| Write operation | Keys invalidated |
|---|---|
| `POST/PUT/DELETE /api/transactions` | All three dashboard keys for the household |
| `POST/PUT/DELETE /api/assets` | `summary` + `net-worth-trend` |
| `POST/PUT/DELETE /api/liabilities` | `summary` + `net-worth-trend` |

---

## Section 3 — Frontend Code Splitting

### 3.1 Route-level lazy loading

Replace all static page imports in `App.tsx` with `React.lazy(() => import(...))`. Wrap the route tree in a `<Suspense>` boundary.

Pages to convert:
- Auth: `LoginPage`, `RegisterPage`, `AcceptInvitePage`
- App: `DashboardPage`, `AccountsPage`, `TransactionsPage`, `AssetsPage`, `LiabilitiesPage`, `GoalsPage`, `BudgetsPage`, `BudgetDetailPage`, `ProfilePage`
- Dev-only: `DesignPage`

### 3.2 Suspense fallback

Use a minimal centred spinner as the `<Suspense>` fallback — consistent with the existing "Restoring secure session..." loading state. No skeleton required at this level since each page manages its own loading skeleton already.

### 3.3 Expected outcome

The initial JS chunk shrinks to the app shell, auth store, React Router, and TanStack Query. Recharts, D3, and Framer Motion are deferred until the user first navigates to a page that uses them. This directly reduces parse and execution time on first load.

---

## Out of Scope

- Combining the three dashboard endpoints into one (the three `useQuery` calls already fire in parallel; the benefit would be marginal)
- Raw SQL rewrites beyond `getIncomeExpenseTrend` (Prisma's type safety is worth preserving)
- Service worker / offline caching (outside the brief)
- CDN or static asset caching (infrastructure concern, not application code)
