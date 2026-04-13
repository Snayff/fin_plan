# Performance Patterns

Three classes of performance problem to keep in mind as the app grows: N+1 queries, missing caching, and bundle bloat.

---

## 1. N+1 Query Anti-Patterns

### The Problem

Dashboard aggregation endpoints are prone to firing one query per data point instead of fetching everything upfront and computing in memory. Examples from past analysis:

- `getNetWorthTrend` — for each of N month-end dates, fired 3 separate DB queries. For 6 months: 18 queries.
- `calculateAccountsBalanceHistory` — nested loop: one query per account per weekly snapshot. For 3 accounts × 13 snapshots: 39 queries.

### The Fix

**Fetch all required data upfront in a small number of queries, then compute per-unit values in memory (JS/TS).**

```
Bad:  for each month → query DB for that month's data     → O(N) queries
Good: query DB once for all months → filter in JS per month → O(1) queries
```

For balance history specifically:

- Fetch all transactions for all accounts up to the latest date in **one** `prisma.transaction.findMany`
- In memory, filter by `accountId` and `date <= snapshotDate` to get each account's balance at each point

### DB Aggregation for Trends

For income/expense trend endpoints, prefer `prisma.$queryRaw` with `DATE_TRUNC('month', date) + GROUP BY + SUM(amount)` over fetching full rows and grouping in JS. The DB returns one row per month per type regardless of transaction volume.

### Missing Index

Always ensure `Transaction` has `@@index([accountId, date])`. Every balance calculation filters transactions by `accountId` with a `date` range. Without this composite index, PostgreSQL scans all household transactions.

---

## 2. Frontend Code Splitting

### The Problem

Statically importing all page components in `App.tsx` forces every page's dependencies (Recharts, D3, Framer Motion) to be parsed before the app can render anything.

### The Fix

Use `React.lazy()` for all page-level imports:

```tsx
// Before
import DashboardPage from "./pages/DashboardPage";

// After
const DashboardPage = React.lazy(() => import("./pages/DashboardPage"));
```

Wrap the route tree in a single `<Suspense>` boundary with a minimal centred spinner fallback. Each page manages its own loading skeleton — no skeleton needed at the Suspense level.

### Expected Outcome

The initial JS chunk shrinks to: app shell, auth store, React Router, TanStack Query. Recharts, D3, and Framer Motion are deferred until the user first navigates to a page that uses them.
