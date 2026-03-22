# FinPlan Renew — Full App Rebuild Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Rebuild FinPlan as a waterfall-based personal financial planning tool, reusing only auth and household management, deleting everything else, and building fresh.

**Architecture:** Replace the transaction-ledger app with a plan-based app. Four pages (Overview, Wealth, Planner, Settings), all using a two-panel layout (left: static nav/summary, right: contextual detail). Backend: Fastify + Prisma. Frontend: React 18 + TanStack Query + shadcn/ui.

**Tech Stack:** Bun + Turborepo monorepo; PostgreSQL; Fastify; React 18 + Vite; TanStack Query; Zustand; shadcn/ui; Recharts; Zod shared validation.

**Design reference:** `docs/renew-finplan/` — consult for all UX decisions not covered here.

---

## What to Keep (zero changes)

- `apps/backend/src/routes/auth.routes.ts` + `auth.service.ts`
- `apps/backend/src/routes/households.routes.ts` + `household.service.ts`
- `apps/backend/src/routes/invites.routes.ts` (if separate)
- `apps/frontend/src/pages/auth/` — LoginPage, RegisterPage, AcceptInvitePage
- `apps/frontend/src/stores/authStore.ts`
- `apps/frontend/src/services/auth.service.ts`
- `apps/frontend/src/services/household.service.ts`
- `apps/frontend/src/components/layout/HouseholdSwitcher.tsx`
- `packages/shared/` — auth + household Zod schemas only
- All infra: Docker, docker-compose, CI, Prisma client config, Bun workspace

---

## What to Delete

**Backend — routes and services:**
```
apps/backend/src/routes/accounts.routes.ts
apps/backend/src/routes/transactions.routes.ts
apps/backend/src/routes/categories.routes.ts
apps/backend/src/routes/assets.routes.ts
apps/backend/src/routes/liabilities.routes.ts
apps/backend/src/routes/budgets.routes.ts
apps/backend/src/routes/goals.routes.ts
apps/backend/src/routes/recurring.routes.ts
apps/backend/src/routes/dashboard.routes.ts
apps/backend/src/routes/forecasts.routes.ts   (if exists)

apps/backend/src/services/account.service.ts
apps/backend/src/services/transaction.service.ts
apps/backend/src/services/category.service.ts
apps/backend/src/services/asset.service.ts
apps/backend/src/services/liability.service.ts
apps/backend/src/services/budget.service.ts
apps/backend/src/services/goal.service.ts
apps/backend/src/services/recurring.service.ts
apps/backend/src/services/dashboard.service.ts
apps/backend/src/services/forecast.service.ts (if exists)
```

**Frontend — pages, components, services:**
```
apps/frontend/src/pages/DashboardPage.tsx
apps/frontend/src/pages/AccountsPage.tsx
apps/frontend/src/pages/TransactionsPage.tsx
apps/frontend/src/pages/AssetsPage.tsx
apps/frontend/src/pages/LiabilitiesPage.tsx
apps/frontend/src/pages/BudgetsPage.tsx
apps/frontend/src/pages/BudgetDetailPage.tsx
apps/frontend/src/pages/GoalsPage.tsx
apps/frontend/src/pages/ProfilePage.tsx

apps/frontend/src/components/accounts/
apps/frontend/src/components/transactions/
apps/frontend/src/components/assets/
apps/frontend/src/components/liabilities/
apps/frontend/src/components/budgets/
apps/frontend/src/components/goals/
apps/frontend/src/components/recurring/
apps/frontend/src/components/filters/
apps/frontend/src/components/charts/
apps/frontend/src/components/layout/Layout.tsx

apps/frontend/src/services/account.service.ts
apps/frontend/src/services/transaction.service.ts
apps/frontend/src/services/category.service.ts
apps/frontend/src/services/asset.service.ts
apps/frontend/src/services/liability.service.ts
apps/frontend/src/services/budget.service.ts
apps/frontend/src/services/goal.service.ts
apps/frontend/src/services/recurring.service.ts
apps/frontend/src/services/dashboard.service.ts
```

---

## Phase 1: Database — New Schema

**Goal:** Replace all existing Prisma models (except auth/household) with the new domain model.

### Task 1.1: Rewrite `apps/backend/prisma/schema.prisma`

Replace the entire file with the schema below. Keep the generator, datasource, and auth/household models. Remove Account, Transaction, TransactionOverride, Category, RecurringRule, Budget, BudgetItem, Goal, GoalContribution, Asset, AssetValueHistory, Liability, Forecast, ForecastScenario, MonteCarloSimulation.

Add all new models:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ============ Auth ============

model User {
  id                   String            @id @default(cuid())
  email                String            @unique
  passwordHash         String
  name                 String
  createdAt            DateTime          @default(now())
  updatedAt            DateTime          @updatedAt
  preferences          Json              @default("{\"currency\":\"GBP\",\"theme\":\"light\"}")
  twoFactorEnabled     Boolean           @default(false)
  twoFactorSecret      String?
  activeHouseholdId    String?
  householdMemberships HouseholdMember[]
  createdInvites       HouseholdInvite[]
  devices              Device[]
  refreshTokens        RefreshToken[]
}

model Device {
  id          String   @id @default(cuid())
  userId      String
  deviceName  String
  deviceType  String
  lastSyncAt  DateTime @default(now())
  syncToken   String?
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model RefreshToken {
  id               String   @id @default(cuid())
  userId           String
  tokenHash        String   @unique
  familyId         String
  isRevoked        Boolean  @default(false)
  expiresAt        DateTime
  sessionExpiresAt DateTime
  rememberMe       Boolean  @default(false)
  ipAddress        String?
  userAgent        String?
  lastUsedAt       DateTime @default(now())
  createdAt        DateTime @default(now())
  user             User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model AuditLog {
  id         String   @id @default(cuid())
  userId     String
  action     String
  resource   String
  resourceId String?
  metadata   Json?
  ipAddress  String?
  userAgent  String?
  createdAt  DateTime @default(now())
}

// ============ Household ============

enum HouseholdRole {
  owner
  member
}

model Household {
  id          String            @id @default(cuid())
  name        String
  createdAt   DateTime          @default(now())
  updatedAt   DateTime          @updatedAt
  members     HouseholdMember[]
  invites     HouseholdInvite[]
  // Waterfall
  incomeSources           IncomeSource[]
  committedBills          CommittedBill[]
  yearlyBills             YearlyBill[]
  discretionaryCategories DiscretionaryCategory[]
  savingsAllocations      SavingsAllocation[]
  // Wealth
  wealthAccounts          WealthAccount[]
  // Planner
  purchaseItems           PurchaseItem[]
  giftPersons             GiftPerson[]
  giftEvents              GiftEvent[]
  plannerBudgets          PlannerYearBudget[]
  // App
  settings                HouseholdSettings?
  snapshots               Snapshot[]
  reviewSession           ReviewSession?
  setupSession            WaterfallSetupSession?
}

model HouseholdMember {
  householdId String
  userId      String
  role        HouseholdRole @default(member)
  joinedAt    DateTime      @default(now())
  household   Household     @relation(fields: [householdId], references: [id], onDelete: Cascade)
  user        User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@id([householdId, userId])
}

model HouseholdInvite {
  id              String    @id @default(cuid())
  householdId     String
  email           String
  tokenHash       String    @unique
  expiresAt       DateTime
  usedAt          DateTime?
  createdByUserId String
  createdAt       DateTime  @default(now())
  household       Household @relation(fields: [householdId], references: [id], onDelete: Cascade)
  createdBy       User      @relation(fields: [createdByUserId], references: [id])
}

// ============ Waterfall ============

enum IncomeFrequency {
  monthly
  annual
  one_off
}

model IncomeSource {
  id             String          @id @default(cuid())
  householdId    String
  name           String
  amount         Float
  frequency      IncomeFrequency
  expectedMonth  Int?            // 1–12, one_off only
  ownerId        String?         // userId of household member
  sortOrder      Int             @default(0)
  endedAt        DateTime?       // set when income ceases; source is excluded from live waterfall but history is preserved
  lastReviewedAt DateTime        @default(now())
  createdAt      DateTime        @default(now())
  updatedAt      DateTime        @updatedAt
  household      Household       @relation(fields: [householdId], references: [id], onDelete: Cascade)
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
  household      Household @relation(fields: [householdId], references: [id], onDelete: Cascade)
}

model YearlyBill {
  id             String    @id @default(cuid())
  householdId    String
  name           String
  amount         Float
  dueMonth       Int       // 1–12
  sortOrder      Int       @default(0)
  lastReviewedAt DateTime  @default(now())
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt
  household      Household @relation(fields: [householdId], references: [id], onDelete: Cascade)
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
  household      Household @relation(fields: [householdId], references: [id], onDelete: Cascade)
}

model SavingsAllocation {
  id              String         @id @default(cuid())
  householdId     String
  name            String
  monthlyAmount   Float
  sortOrder       Int            @default(0)
  wealthAccountId String?
  lastReviewedAt  DateTime       @default(now())
  createdAt       DateTime       @default(now())
  updatedAt       DateTime       @updatedAt
  household       Household      @relation(fields: [householdId], references: [id], onDelete: Cascade)
  wealthAccount   WealthAccount? @relation(fields: [wealthAccountId], references: [id], onDelete: SetNull)
}

// Polymorphic per-item history for all waterfall item types.
// itemType + itemId act as a polymorphic FK (no DB-level FK enforcement).
enum WaterfallItemType {
  income_source
  committed_bill
  yearly_bill
  discretionary_category
  savings_allocation
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

// ============ Wealth ============

enum AssetClass {
  savings
  pensions
  investments
  property
  vehicles
  other
}

model WealthAccount {
  id                   String               @id @default(cuid())
  householdId          String
  assetClass           AssetClass
  name                 String
  provider             String?
  notes                String?              // class-specific free text: pension scheme ref, vehicle reg, property address, description, etc.
  balance              Float                @default(0)
  interestRate         Float?               // savings only
  isISA                Boolean              @default(false)
  isaYearContribution  Float?               // manually tracked: contributions this tax year
  ownerId              String?              // userId — for per-person ISA limit tracking
  isTrust              Boolean              @default(false)
  trustBeneficiaryName String?
  valuationDate        DateTime             @default(now())
  lastReviewedAt       DateTime             @default(now())
  createdAt            DateTime             @default(now())
  updatedAt            DateTime             @updatedAt
  household            Household            @relation(fields: [householdId], references: [id], onDelete: Cascade)
  valueHistory         WealthAccountHistory[]
  savingsAllocations   SavingsAllocation[]
  fundedPurchases      PurchaseItem[]
}

model WealthAccountHistory {
  id              String        @id @default(cuid())
  wealthAccountId String
  balance         Float
  valuationDate   DateTime
  createdAt       DateTime      @default(now())
  wealthAccount   WealthAccount @relation(fields: [wealthAccountId], references: [id], onDelete: Cascade)
  @@index([wealthAccountId, valuationDate])
}

// ============ Planner ============

enum PurchasePriority {
  lowest
  low
  medium
  high
}

enum PurchaseStatus {
  not_started
  in_progress
  done
}

model PurchaseItem {
  id                String           @id @default(cuid())
  householdId       String
  yearAdded         Int              // calendar year
  name              String
  estimatedCost     Float
  priority          PurchasePriority @default(low)
  scheduledThisYear Boolean          @default(false)
  fundingSources    String[]         // e.g. ["savings","bonus","purchasing_budget"]
  fundingAccountId  String?
  spent             Float            @default(0)
  status            PurchaseStatus   @default(not_started)
  reason            String?
  comment           String?
  addedAt           DateTime         @default(now())
  createdAt         DateTime         @default(now())
  updatedAt         DateTime         @updatedAt
  household         Household        @relation(fields: [householdId], references: [id], onDelete: Cascade)
  fundingAccount    WealthAccount?   @relation(fields: [fundingAccountId], references: [id], onDelete: SetNull)
}

enum GiftEventType {
  birthday
  christmas
  mothers_day
  fathers_day
  valentines_day
  anniversary
  custom
}

enum GiftRecurrence {
  annual
  one_off
}

model GiftPerson {
  id          String      @id @default(cuid())
  householdId String
  name        String
  notes       String?
  sortOrder   Int         @default(0)
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt
  household   Household   @relation(fields: [householdId], references: [id], onDelete: Cascade)
  events      GiftEvent[]
}

model GiftEvent {
  id           String         @id @default(cuid())
  giftPersonId String
  householdId  String
  eventType    GiftEventType
  customName   String?
  dateMonth    Int?           // 1–12 (annual events with user-set date)
  dateDay      Int?           // 1–31
  specificDate DateTime?      // one_off custom events only
  recurrence   GiftRecurrence @default(annual)
  createdAt    DateTime       @default(now())
  updatedAt    DateTime       @updatedAt
  giftPerson   GiftPerson     @relation(fields: [giftPersonId], references: [id], onDelete: Cascade)
  household    Household      @relation(fields: [householdId], references: [id], onDelete: Cascade)
  yearRecords  GiftYearRecord[]
}

model GiftYearRecord {
  id          String    @id @default(cuid())
  giftEventId String
  year        Int
  budget      Float     @default(0)
  spent       Float     @default(0)
  notes       String?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  giftEvent   GiftEvent @relation(fields: [giftEventId], references: [id], onDelete: Cascade)
  @@unique([giftEventId, year])
}

model PlannerYearBudget {
  id             String    @id @default(cuid())
  householdId    String
  year           Int
  purchaseBudget Float     @default(0)
  giftBudget     Float     @default(0)
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt
  household      Household @relation(fields: [householdId], references: [id], onDelete: Cascade)
  @@unique([householdId, year])
}

// ============ Settings ============

model HouseholdSettings {
  id                  String    @id @default(cuid())
  householdId         String    @unique
  surplusBenchmarkPct Float     @default(10)
  isaAnnualLimit      Float     @default(20000)
  isaYearStartMonth   Int       @default(4)   // UK: April
  isaYearStartDay     Int       @default(6)   // UK: 6th
  // Months before each item type is stale — differentiated defaults reflect review cadence
  stalenessThresholds Json      @default("{\"income_source\":12,\"committed_bill\":6,\"yearly_bill\":12,\"discretionary_category\":12,\"savings_allocation\":12,\"wealth_account\":3}")
  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt
  household           Household @relation(fields: [householdId], references: [id], onDelete: Cascade)
}

// ============ Snapshots ============

model Snapshot {
  id          String    @id @default(cuid())
  householdId String
  name        String
  isAuto      Boolean   @default(false)
  data        Json      // full serialised waterfall state at creation
  createdAt   DateTime  @default(now())
  household   Household @relation(fields: [householdId], references: [id], onDelete: Cascade)
  @@unique([householdId, name])
}

// ============ Wizard Sessions ============

model ReviewSession {
  id             String    @id @default(cuid())
  householdId    String    @unique
  currentStep    Int       @default(0)
  confirmedItems Json      @default("{}")  // { itemType: [id,...] }
  updatedItems   Json      @default("{}")  // { itemId: { from, to } }
  startedAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt
  household      Household @relation(fields: [householdId], references: [id], onDelete: Cascade)
}

model WaterfallSetupSession {
  id          String    @id @default(cuid())
  householdId String    @unique
  currentStep Int       @default(0)
  // data is intentionally unused — all wizard entries are saved directly to their respective
  // tables (IncomeSource, CommittedBill, etc.) in real time. Only currentStep is tracked here.
  startedAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  household   Household @relation(fields: [householdId], references: [id], onDelete: Cascade)
}
```

### Task 1.2: Generate and run migration

```bash
cd apps/backend
bunx prisma migrate dev --name renew_schema
```

Expected: migration file created, DB tables created. Fix any errors before proceeding.

### Task 1.3: Regenerate Prisma client

```bash
bunx prisma generate
```

Verify TypeScript compilation: `cd apps/backend && bun run build` (fix any import errors before proceeding).

**Commit:** `chore: replace schema with renew domain model`

---

## Phase 2: Backend Cleanup

**Goal:** Delete obsolete backend files and update server registration to only mount routes that exist.

### Task 2.1: Delete obsolete backend files

Delete the files listed in the "What to Delete" section above (backend routes and services).

### Task 2.2: Update server entry point

Find `apps/backend/src/server.ts` (or `index.ts` / `app.ts` — check the actual entry). Remove all `fastify.register(...)` calls for deleted routes. Keep auth and household route registrations.

Add placeholder registrations for new routes (files created in Phase 3+):
```typescript
// Will be implemented in Phase 3+
fastify.register(waterfallRoutes, { prefix: '/api/waterfall' })
fastify.register(wealthRoutes,    { prefix: '/api/wealth' })
fastify.register(plannerRoutes,   { prefix: '/api/planner' })
fastify.register(settingsRoutes,  { prefix: '/api/settings' })
fastify.register(snapshotRoutes,  { prefix: '/api/snapshots' })
fastify.register(reviewRoutes,    { prefix: '/api/review-session' })
fastify.register(setupRoutes,     { prefix: '/api/setup-session' })
```

Create empty stub files for each so the server starts:
```typescript
// apps/backend/src/routes/waterfall.routes.ts
import { FastifyInstance } from 'fastify'
export async function waterfallRoutes(fastify: FastifyInstance) {}
```
Repeat for wealth, planner, settings, snapshots, review-session, setup-session.

### Task 2.3: Update household creation hook

In `apps/backend/src/services/household.service.ts`, after creating a new household, also create the `HouseholdSettings` record with defaults:

```typescript
await prisma.householdSettings.create({
  data: { householdId: household.id }
})
```

### Task 2.4: Verify server starts

```bash
cd apps/backend && bun run dev
```

Expected: server starts, no import errors. All auth + household endpoints still respond.

**Commit:** `chore: remove obsolete routes/services, scaffold new route stubs`

---

## Phase 3: Backend — Waterfall APIs

**Goal:** CRUD for all waterfall items + history recording + cashflow calendar.

### Task 3.1: Create `apps/backend/src/services/waterfall.service.ts`

Key methods:

**`getWaterfallSummary(householdId)`** — returns the full waterfall calculation. Excludes any `IncomeSource` where `endedAt` is set and in the past.
```typescript
interface WaterfallSummary {
  income: {
    total: number           // sum of monthly + annual/12; excludes one_off
    monthly: IncomeSource[]
    annual: (IncomeSource & { monthlyAmount: number })[]  // amount/12
    oneOff: IncomeSource[]
  }
  committed: {
    monthlyTotal: number
    monthlyAvg12: number    // sum of yearlyBills / 12
    bills: CommittedBill[]
    yearlyBills: YearlyBill[]
  }
  discretionary: {
    total: number           // sum of categories + savings
    categories: DiscretionaryCategory[]
    savings: {
      total: number
      allocations: SavingsAllocation[]
    }
  }
  surplus: {
    amount: number          // income.total - committed.monthlyTotal - committed.monthlyAvg12 - discretionary.total
    percentOfIncome: number
  }
}
```

**`getCashflowCalendar(householdId, year)`** — virtual pot model:
```typescript
// For each of the 12 months:
// 1. Add monthlyContribution (sum of yearlyBills / 12) to running pot
// 2. Deduct any yearlyBills whose dueMonth === this month
// 3. Add one-off income sources whose expectedMonth === this month (positive entries)
// Return running pot balance per month, flag shortfall (pot < 0)
interface CashflowMonth {
  month: number   // 1–12
  year: number
  contribution: number
  bills: { id: string; name: string; amount: number }[]
  oneOffIncome: { id: string; name: string; amount: number }[]  // IncomeSource where frequency=one_off and expectedMonth=this month
  potAfter: number   // contribution + sum(oneOffIncome) - sum(bills) + previous pot
  shortfall: boolean
}
```

**`recordHistory(itemType, itemId, value)`** — called whenever an item's amount changes:
```typescript
await prisma.waterfallHistory.create({
  data: { itemType, itemId, value, recordedAt: new Date() }
})
```

**`getHistory(itemType, itemId)`** — returns `WaterfallHistory[]` sorted by `recordedAt` asc, limited to the last 24 months:
```typescript
const cutoff = subMonths(new Date(), 24)  // import { subMonths } from 'date-fns'
return prisma.waterfallHistory.findMany({
  where: { itemType, itemId, recordedAt: { gte: cutoff } },
  orderBy: { recordedAt: 'asc' },
})
```
The full record is always preserved in the DB; 24 months is a display limit only.

**`confirm(model, id)`** — sets `lastReviewedAt = now()` without changing value.

### Task 3.2: Create `apps/backend/src/routes/waterfall.routes.ts`

All routes require auth middleware (copy pattern from existing routes). Extract `householdId` from `request.user.activeHouseholdId`. Return 400 if no active household.

```
GET  /api/waterfall                     → getWaterfallSummary()
GET  /api/waterfall/cashflow            → getCashflowCalendar(year? defaults to current year)
GET  /api/waterfall/history/:type/:id   → getHistory(type, id)

// Income Sources
GET    /api/waterfall/income            → list active IncomeSource for household (endedAt null or future)
GET    /api/waterfall/income/ended      → list ended sources (endedAt set and past); for Settings view
POST   /api/waterfall/income            → create { name, amount, frequency, expectedMonth?, ownerId?, sortOrder? }
PATCH  /api/waterfall/income/:id        → update fields; if amount changed, call recordHistory
DELETE /api/waterfall/income/:id        → delete (permanent — destroys history; only offer this on sources that have no history)
POST   /api/waterfall/income/:id/end    → set endedAt = body.endedAt (defaults to now()); source removed from live waterfall, history preserved
POST   /api/waterfall/income/:id/reactivate → clear endedAt; source returns to live waterfall
POST   /api/waterfall/income/:id/confirm → update lastReviewedAt only

// Committed Bills
GET    /api/waterfall/committed         → list
POST   /api/waterfall/committed         → create { name, amount, ownerId?, sortOrder? }
PATCH  /api/waterfall/committed/:id     → update; record history on amount change
DELETE /api/waterfall/committed/:id
POST   /api/waterfall/committed/:id/confirm

// Yearly Bills
GET    /api/waterfall/yearly            → list
POST   /api/waterfall/yearly            → create { name, amount, dueMonth, sortOrder? }
PATCH  /api/waterfall/yearly/:id        → update; record history on amount change
DELETE /api/waterfall/yearly/:id
POST   /api/waterfall/yearly/:id/confirm

// Discretionary Categories
GET    /api/waterfall/discretionary     → list
POST   /api/waterfall/discretionary     → create { name, monthlyBudget, sortOrder? }
PATCH  /api/waterfall/discretionary/:id → update; record history on budget change
DELETE /api/waterfall/discretionary/:id
POST   /api/waterfall/discretionary/:id/confirm

// Savings Allocations
GET    /api/waterfall/savings           → list (include linked wealthAccount name if set)
POST   /api/waterfall/savings           → create { name, monthlyAmount, wealthAccountId?, sortOrder? }
PATCH  /api/waterfall/savings/:id       → update; record history on amount change
DELETE /api/waterfall/savings/:id
POST   /api/waterfall/savings/:id/confirm

// Batch confirm — used by Review Wizard "Confirm all remaining" shortcut
POST   /api/waterfall/confirm-batch     → { items: { type: WaterfallItemType, id: string }[] }
                                          → calls confirm(model, id) for each in a DB transaction

// Utility — used by Settings → Rebuild waterfall from scratch
DELETE /api/waterfall/all              → delete all waterfall items (income, committed, yearly,
                                         discretionary, savings) for the household; returns 204
```

All CRUD responses return the updated record. Use Zod for request body validation.

### Task 3.3: Update shared schemas

In `packages/shared/src/schemas/`, add Zod schemas for waterfall types. Export from the package index. Import in frontend services.

### Task 3.4: Verify endpoints

```bash
# Start backend
cd apps/backend && bun run dev

# Create income source
curl -X POST http://localhost:3000/api/waterfall/income \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"name":"Salary","amount":5148,"frequency":"monthly"}'

# Get full summary
curl http://localhost:3000/api/waterfall \
  -H "Authorization: Bearer <token>"
```

**Commit:** `feat: waterfall APIs — income, bills, discretionary, savings, history`

---

## Phase 4: Backend — Wealth APIs

**Goal:** CRUD for wealth accounts, value history recording, ISA allowance calculation, projections.

### Task 4.1: Create `apps/backend/src/services/wealth.service.ts`

**`getWealthSummary(householdId)`**:
```typescript
interface WealthSummary {
  netWorth: number        // sum of non-trust account balances
  ytdChange: number       // netWorth now minus netWorth on Jan 1 (from WealthAccountHistory)
                          // For each account: find the most recent WealthAccountHistory entry
                          // with valuationDate <= Jan 1 of current year. If no entry exists
                          // (new account), treat the account's Jan 1 contribution as 0.
                          // ytdChange = 0 if no history at all (brand-new household).
  byLiquidity: {
    cashAndSavings: number          // savings accounts
    investmentsAndPensions: number  // pensions + investments
    propertyAndVehicles: number     // property + vehicles + other
  }
  byClass: Record<AssetClass, number>
  trust: {
    total: number
    beneficiaries: { name: string; total: number }[]
  }
}
```

**`updateValuation(accountId, balance, valuationDate)`**:
```typescript
// 1. Update WealthAccount: balance, valuationDate, lastReviewedAt = now()
// 2. Insert WealthAccountHistory: { wealthAccountId, balance, valuationDate }
```

**`getISAAllowance(householdId)`**:
```typescript
// Group ISA accounts (isISA: true) by ownerId
// For each owner: sum isaYearContribution across their accounts
// Return: { taxYearStart, taxYearEnd, annualLimit, byPerson: [{ ownerId, name, used, remaining }] }
// Tax year: derived from settings.isaYearStartMonth / settings.isaYearStartDay (UK default: 6 April)
// Note: isaYearContribution is manually maintained by the user when they update their balance;
//       it must be manually reset to 0 each tax year (no auto-reset — matches spec intent)
```

**`getProjection(account, toDate)`**:
```typescript
// Simple compound interest:
// monthlyRate = interestRate / 12 / 100
// months = monthsBetween(now, toDate)
// monthlyContrib = sum of linked SavingsAllocation.monthlyAmount
// projection = balance * (1 + monthlyRate)^months
//            + monthlyContrib * ((1 + monthlyRate)^months - 1) / monthlyRate
// Return projected balance at toDate
```

### Task 4.2: Create `apps/backend/src/routes/wealth.routes.ts`

```
GET    /api/wealth                          → getWealthSummary()
GET    /api/wealth/accounts                 → list all, include linked savings allocations
GET    /api/wealth/accounts/:id             → single account with history + projection to Dec 31
POST   /api/wealth/accounts                 → create { assetClass, name, provider?, balance, interestRate?, isISA?, ownerId?, isTrust?, trustBeneficiaryName? }
PATCH  /api/wealth/accounts/:id             → update metadata (name, provider, interestRate, isISA etc.) — not balance
DELETE /api/wealth/accounts/:id             → delete (check no linked savings allocations first; return 409 if so)
POST   /api/wealth/accounts/:id/valuation   → updateValuation({ balance, valuationDate })
POST   /api/wealth/accounts/:id/confirm     → update lastReviewedAt only
GET    /api/wealth/accounts/:id/history     → WealthAccountHistory[] sorted by valuationDate asc, last 24 months only
GET    /api/wealth/isa-allowance            → getISAAllowance()
POST   /api/wealth/accounts/confirm-batch   → { ids: string[] } → sets lastReviewedAt = now() for each; used by Review Wizard
```

**Commit:** `feat: wealth APIs — accounts, valuation history, ISA allowance, projections`

---

## Phase 5: Backend — Planner APIs

**Goal:** CRUD for purchases, gift people/events, UK date calculation utilities.

### Task 5.1: Create `apps/backend/src/utils/gift-dates.ts`

```typescript
// UK Mother's Day = Mothering Sunday = 4th Sunday of Lent
// Lent starts Ash Wednesday = 46 days before Easter
// Easter calculation: use the Anonymous Gregorian algorithm
export function ukMothersDay(year: number): { month: number; day: number }

// UK Father's Day = 3rd Sunday of June
export function ukFathersDay(year: number): { month: number; day: number }

// Given a GiftEvent, return the date of the next occurrence on or after `fromDate`
// Fixed events: christmas (Dec 25), valentines (Feb 14)
// Calculated: mothers_day, fathers_day (call above functions)
// User-set: birthday, anniversary, custom annual → use dateMonth/dateDay
// One-off custom → use specificDate
export function nextEventDate(event: GiftEvent, year: number): Date | null
```

### Task 5.2: Create `apps/backend/src/services/planner.service.ts`

Key methods:
- `getPurchases(householdId, year)` — list PurchaseItems where yearAdded === year
- `getPlannerBudget(householdId, year)` — get or create PlannerYearBudget (default 0)
- `getGiftsUpcoming(householdId, year)` — all events with computed nextDate, sorted chronologically; include GiftYearRecord for year (or empty defaults)
- `getGiftsByPerson(householdId, year)` — persons with aggregated budget/spent totals for year
- `getPersonDetail(personId, year)` — person with all events + year records

### Task 5.3: Create `apps/backend/src/routes/planner.routes.ts`

```
// Purchases
GET    /api/planner/purchases                → getPurchases(year? defaults current year)
POST   /api/planner/purchases                → create { name, estimatedCost, priority?, scheduledThisYear?, fundingSources?, fundingAccountId?, spent?, status?, reason?, comment? }
PATCH  /api/planner/purchases/:id            → update any fields
DELETE /api/planner/purchases/:id            → delete

// Gift Persons
GET    /api/planner/gifts/upcoming           → getGiftsUpcoming() (default view)
GET    /api/planner/gifts/persons            → getGiftsByPerson()
GET    /api/planner/gifts/persons/:id        → getPersonDetail()
POST   /api/planner/gifts/persons            → create { name, notes? }
PATCH  /api/planner/gifts/persons/:id        → update { name?, notes? }
DELETE /api/planner/gifts/persons/:id        → delete (cascades events + year records)

// Gift Events
POST   /api/planner/gifts/persons/:personId/events  → create { eventType, customName?, dateMonth?, dateDay?, specificDate?, recurrence? }
PATCH  /api/planner/gifts/events/:id                → update event fields
DELETE /api/planner/gifts/events/:id                → delete

// Gift Year Records
PUT    /api/planner/gifts/events/:id/year/:year     → upsert { budget, spent, notes? }

// Planner budgets
GET    /api/planner/budget/:year             → get PlannerYearBudget (auto-create with defaults if missing)
PUT    /api/planner/budget/:year             → upsert { purchaseBudget?, giftBudget? }
```

**Commit:** `feat: planner APIs — purchases, gift persons/events, UK date utilities`

---

## Phase 6: Backend — Settings, Snapshots, Sessions

**Goal:** Household settings, snapshot management, and wizard session persistence APIs.

### Task 6.1: Create `apps/backend/src/routes/settings.routes.ts`

```
GET   /api/settings   → get HouseholdSettings (auto-create with defaults if missing)
PATCH /api/settings   → update { surplusBenchmarkPct?, isaAnnualLimit?, isaYearStartMonth?,
                                  isaYearStartDay?, stalenessThresholds? }
```

User profile (replaces ProfilePage) re-uses the existing `PATCH /api/auth/me` endpoint — no new route needed. Frontend just calls the auth endpoint.

### Task 6.2: Create `apps/backend/src/routes/snapshots.routes.ts`

On creation, `data` is auto-populated by calling `waterfallService.getWaterfallSummary()`:

```
GET    /api/snapshots       → list (id, name, isAuto, createdAt only — not full data)
GET    /api/snapshots/:id   → full snapshot including data
POST   /api/snapshots       → create { name, isAuto? } — data populated automatically
PATCH  /api/snapshots/:id   → rename { name } — validate uniqueness (catch P2002 → 409)
DELETE /api/snapshots/:id   → delete
```

**Auto Jan 1 snapshot:** In the waterfall summary endpoint, check: if today is Jan 1 and no "January [YEAR] — Auto" snapshot exists for this household, create it silently. This runs on first page load of the new year.

### Task 6.3: Create `apps/backend/src/routes/review-session.routes.ts`

```
GET    /api/review-session   → current session or null
POST   /api/review-session   → create/reset (step 0, empty confirmedItems/updatedItems)
PATCH  /api/review-session   → update { currentStep?, confirmedItems?, updatedItems? }
DELETE /api/review-session   → abandon (delete record)
```

### Task 6.4: Create `apps/backend/src/routes/setup-session.routes.ts`

```
GET    /api/setup-session   → current session or null
POST   /api/setup-session   → create/reset
PATCH  /api/setup-session   → update { currentStep?, data? }
DELETE /api/setup-session   → clear
```

**Commit:** `feat: settings, snapshot, and wizard session APIs`

---

## Phase 7: Frontend Foundation

**Goal:** New routing, two-panel layout component, new top nav, delete old pages and services.

### Task 7.1: Delete obsolete frontend files

Delete all files and directories listed in "What to Delete" (frontend section). Run `bun run build` after; fix any import errors.

### Task 7.2: Update `apps/frontend/src/App.tsx`

Replace protected routes:
```tsx
// Protected routes
<Route path="/"          element={<Navigate to="/overview" replace />} />
<Route path="/overview"  element={<OverviewPage />} />
<Route path="/wealth"    element={<WealthPage />} />
<Route path="/planner"   element={<PlannerPage />} />
<Route path="/settings"  element={<SettingsPage />} />
// Auth routes — unchanged
<Route path="/login"                 element={<LoginPage />} />
<Route path="/register"              element={<RegisterPage />} />
<Route path="/accept-invite/:token"  element={<AcceptInvitePage />} />
```

Create stub page files (each just renders `<div>Coming soon</div>`):
- `apps/frontend/src/pages/OverviewPage.tsx`
- `apps/frontend/src/pages/WealthPage.tsx`
- `apps/frontend/src/pages/PlannerPage.tsx`
- `apps/frontend/src/pages/SettingsPage.tsx`

### Task 7.3: Create `apps/frontend/src/components/layout/TwoPanelLayout.tsx`

```tsx
interface TwoPanelLayoutProps {
  left: React.ReactNode
  right: React.ReactNode | null
  rightPlaceholder?: string  // default: "Select any item to see its detail"
}

// Structure:
// <div className="flex h-full overflow-hidden">
//   <aside className="w-72 min-w-72 border-r overflow-y-auto shrink-0 p-4">
//     {left}
//   </aside>
//   <main className="flex-1 overflow-y-auto p-6">
//     {right ?? <PlaceholderMessage text={rightPlaceholder} />}
//   </main>
// </div>

// PlaceholderMessage: centred, text-muted-foreground, italic
```

### Task 7.4: Create new `apps/frontend/src/components/layout/Layout.tsx`

```tsx
const navItems = [
  { label: 'Overview', path: '/overview' },
  { label: 'Wealth',   path: '/wealth' },
  { label: 'Planner',  path: '/planner' },
  { label: 'Settings', path: '/settings' },
]

// Top bar:
//   Left: "finplan" wordmark + HouseholdSwitcher (reuse existing component)
//   Centre: nav items with active state (useLocation to match path)
//   Right: user display name + "Sign out" button
```

### Task 7.5: Create frontend services

Create each service file following the same HTTP client pattern as `auth.service.ts` (accepts `token: string`, returns typed responses):

- `apps/frontend/src/services/waterfall.service.ts`
- `apps/frontend/src/services/wealth.service.ts`
- `apps/frontend/src/services/planner.service.ts`
- `apps/frontend/src/services/settings.service.ts`
- `apps/frontend/src/services/snapshot.service.ts`

### Task 7.6: Create `apps/frontend/src/utils/format.ts`

```typescript
export const formatCurrency = (n: number): string =>
  new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    maximumFractionDigits: 0,
  }).format(n)

export const formatPct = (n: number): string => `${n.toFixed(2)}%`
```

Use `formatCurrency` everywhere a `£` value is displayed. No ad-hoc formatting in components.

### Task 7.7: Error handling — global setup

In `apps/frontend/src/main.tsx`, configure a TanStack Query `QueryClient` with a global mutation error handler:

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    mutations: {
      onError: (error: unknown) => {
        if (isAxiosError(error) && error.response?.status === 401) {
          useAuthStore.getState().clearAuth()
          window.location.href = '/login'
        } else {
          toast.error('Something went wrong. Please try again.')
        }
      },
    },
  },
})
```

Add `<Toaster />` (Sonner) to `Layout.tsx`:
```tsx
import { Toaster } from 'sonner'
// Inside Layout return:
<Toaster position="bottom-right" richColors />
```

Install if not present: `bun add sonner`

### Task 7.8: Confirm form stack

All inline edit forms use: `react-hook-form` + `@hookform/resolvers/zod` + shadcn `<Form>` components.

Install if not present: `bun add react-hook-form @hookform/resolvers`

This is the standard pattern for every form in the app — wizard steps, right-panel edit forms, and settings panels.

### Task 7.9: Create `<DefinitionTooltip>` component

All financial terms defined in `definitions.md` must show a hover tooltip at every location listed in that document. This is the only in-app mechanism for explaining terminology (no standalone glossary).

```tsx
// apps/frontend/src/components/common/DefinitionTooltip.tsx

const DEFINITIONS: Record<string, string> = {
  Waterfall: "The way FinPlan structures your finances — income at the top, committed spend deducted first, then discretionary spend, leaving your surplus at the bottom.",
  "Committed Spend": "Money you've contracted or obligated yourself to pay — outgoings you can't immediately choose to stop.",
  "Discretionary Spend": "Spending you choose to make each month and could choose to reduce or stop.",
  Surplus: "What's left after your committed and discretionary spend is deducted from your income.",
  "Net Income": "Your take-home pay after tax, National Insurance, and any other deductions — what actually arrives in your account.",
  "One-Off Income": "A single, non-recurring payment — for example, a bonus or an inheritance.",
  "Annual Income": "Income that recurs once a year. Shown in the waterfall divided by 12 so it contributes a fair monthly share.",
  "Amortised (÷12)": "An annual amount spread evenly across 12 months.",
  ISA: "Individual Savings Account — a UK savings or investment account where interest and gains are free from tax.",
  "ISA Allowance": "The maximum you can pay into ISAs in a single tax year — currently £20,000 per person.",
  "Tax Year": "The UK tax year runs from 6 April to 5 April the following year.",
  "Equity Value": "The portion of an asset you own outright — the market value minus any outstanding debt secured against it.",
  Liquidity: "How quickly and easily an asset can be converted to cash.",
  "Net Worth": "The total value of everything you own (your assets) minus everything you owe (your liabilities).",
  Snapshot: "A saved, read-only record of your waterfall at a specific point in time.",
  Staleness: "A signal that a value hasn't been reviewed or confirmed within the expected timeframe and may no longer be accurate.",
  "Held on Behalf Of": "Savings managed by your household but legally owned by someone else.",
  Projection: "An estimated future balance calculated from the current value plus the linked monthly contribution, compounded at the recorded interest rate.",
}

interface Props {
  term: keyof typeof DEFINITIONS
  children: React.ReactNode
}

// Wraps children in a shadcn <Tooltip> with the definition as content.
// Use the dotted underline convention (border-b border-dotted cursor-help) on the trigger.
export function DefinitionTooltip({ term, children }: Props) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="border-b border-dotted border-current cursor-help">{children}</span>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs">{DEFINITIONS[term]}</TooltipContent>
    </Tooltip>
  )
}
```

Wire up in components at the locations specified in `definitions.md`. Key placements:
- `WaterfallLeftPanel`: "COMMITTED", "DISCRETIONARY", "SURPLUS" section headers
- `ItemDetailPanel`: "Net Income" label for income sources; "÷12" label for annual/yearly items
- `AccountListPanel` (Savings): "ISA Allowance" bar label
- `AccountDetailPanel`: "Equity Value" label for property/vehicles/other; "Projection" label
- `WealthLeftPanel`: "Net Worth" headline; "Liquidity" breakdown header
- `SnapshotTimeline`: "Snapshot" label
- Any "Held on behalf of" section header
- `StalenessIndicator` tooltip trigger text (or alongside it)

### Task 7.10: Verify routing

Start the frontend dev server, navigate to `/overview`, `/wealth`, `/planner`, `/settings`. All should render without errors.

**Commit:** `feat: frontend foundation — routing, two-panel layout, new nav, service stubs`

---

## Phase 8: Frontend — Overview Page

**Goal:** Full waterfall UI: left panel, right panel item detail, history charts, cashflow calendar.

### Task 8.1: TanStack Query hooks (`apps/frontend/src/hooks/useWaterfall.ts`)

```typescript
export const useWaterfallSummary  = () => useQuery({ queryKey: ['waterfall'], queryFn: ... })
export const useWaterfallHistory  = (itemType, itemId) =>
  useQuery({ queryKey: ['waterfall-history', itemType, itemId], queryFn: ..., enabled: !!itemId })
export const useCashflowCalendar  = (year) => useQuery({ queryKey: ['cashflow', year], queryFn: ... })
export const useSnapshots         = () => useQuery({ queryKey: ['snapshots'], queryFn: ... })
export const useSnapshot          = (id) => useQuery({ queryKey: ['snapshot', id], queryFn: ..., enabled: !!id })
export const useHouseholdSettings = () => useQuery({ queryKey: ['settings'], queryFn: ... })

// Mutations — all invalidate ['waterfall'] on success:
export const useCreateIncomeSource    = () => useMutation(...)
export const useUpdateIncomeSource    = () => useMutation(...)
export const useDeleteIncomeSource    = () => useMutation(...)
export const useConfirmItem           = () => useMutation(...)  // generic confirm
// ... repeat pattern for committed, yearly, discretionary, savings
```

### Task 8.2: `WaterfallLeftPanel.tsx`

State: `selectedItem: SelectedWaterfallItem | null` (lifted to `OverviewPage`).

```
▼ INCOME         £8,856
├─ Josh Salary   £5,148    [⚠ if stale]
│     monthly
├─ Annual Bonus  £416      [⚠ if stale]
│     ÷12                  ← show "÷12" label below name for annual frequency sources
└─ Cat Salary    £3,708
                 ──────
▼ COMMITTED      £4,817
├─ Monthly       £4,575    → clicking expands to show CommittedBills list
└─ Yearly (÷12)    £242 ⚠  → clicking opens cashflow calendar
                 ──────
▼ DISCRETIONARY  £3,830
├─ Food            £650
├─ ▼ Savings     £1,000    → expandable toggle
│   ├─ Tandem      £700
│   └─ Trading     £300
├─ Petrol          £100
└─ ··· N more              → "show all" toggle
                 ──────
▼ SURPLUS          £209
├─ Unallocated     £209
└─ [Increase savings ▸]    → sets selectedItem to savings row
```

Truncation: show first 5 discretionary items; "··· N more" expands the rest.

Surplus indicator: if `surplus.percentOfIncome < settings.surplusBenchmarkPct`, show amber text + tooltip from `definitions.md`.

Staleness: each item shows `<StalenessIndicator>` (built in Phase 12, stub for now).

### Task 8.3: `ItemDetailPanel.tsx` (right panel)

Rendered in the right panel based on `selectedItem`. All item types share the structure:

```tsx
// Header: item name
// Value: £X / month  (or £X total for yearly bills, with ÷12 note)
// Staleness: "Last reviewed: [time ago]" with ⚠ if stale
// HistoryChart (see Task 8.4)
// Footer: [ Edit ]   [ Still correct ✓ ]
//   Edit: replaces chart with inline form; submit calls PATCH then invalidates queries
//   Still correct: calls POST /:id/confirm; shows success toast
//
// For income sources only, show a secondary action below the button pair:
//   "End this income source" (text link, not a primary button)
//   → opens a small inline prompt: "When did this income end?" with a date input (defaults today)
//   → submit calls POST /api/waterfall/income/:id/end { endedAt }
//   → source removed from live waterfall; history preserved
// Ended sources can be re-activated from Settings → Income sources (ended list)
```

Special case — Yearly Bills row selected: show ÷12 monthly average + link "View cashflow calendar ▸" that changes right panel to CashflowCalendar (breadcrumb: `← Committed / Yearly Bills`).

### Task 8.4: `HistoryChart.tsx`

```tsx
// Props: data: { recordedAt: string; value: number }[], snapshotDate?: string
// Recharts LineChart; x-axis = date, y-axis = £ value
// If snapshotDate provided: add ReferenceLine at that date (amber dashed)
// Reduced motion: check window.matchMedia('(prefers-reduced-motion: reduce)') → isAnimationActive={false}
// Empty state: "No history yet" muted text if data.length < 2
```

### Task 8.5: `CashflowCalendar.tsx`

```tsx
// Breadcrumb: "← Committed / Yearly Bills" (button resets selectedItem to yearly bills row)
// Header: "Yearly Bills — {year} Cashflow   Monthly pot: £{avg}"
// List of 12 months, each row:
//   Jan  +£242  →  Pot: £242
//   Apr  +£242  −£487 Josh Car Insurance  →  Pot: £481  ✓ Covered
//   Sep  +£242  −£597 (two bills)         →  Pot: −£82  ⚠ Shortfall

// When shortfall detected: show nudge card (non-advisory arithmetic only):
//   "⚠ {month} looks tight — {n} bills land ({total} total). Your pot will have £{pot} by then.
//    Options:
//    · Increase your monthly contribution by £{x} to cover this
//    · Draw £{abs(pot)} from existing savings when the bills fall due"
```

### Task 8.6: `SnapshotTimeline.tsx`

```tsx
// Sits above the waterfall panel in OverviewPage
// Horizontal scroll: ◂  [dot] ··· [dot] ··· [Now]  ▸
//   Dots: one per snapshot, labelled with name (truncated)
//   [Now]: always at right end
// Clicking dot: parent sets viewingSnapshot state
// Clicking [Now]: clears viewingSnapshot
// [+ Save snapshot] button at right of timeline → opens CreateSnapshotModal

// When viewingSnapshot set:
//   Show banner: "Viewing: {name}  ·  [Return to current ▸]"
//   Left panel renders from viewingSnapshot.data (not live API)
//   All Edit / Still correct buttons hidden/disabled
```

### Task 8.7: `CreateSnapshotModal.tsx`

```tsx
// Input pre-populated: "{Month} {Year}"
// On submit: POST /api/snapshots { name }
// 409 → inline error: "A snapshot with this name already exists — choose a different name."
// Success → close modal, invalidate ['snapshots']
```

### Task 8.8: Empty state

If summary has no income sources and no committed bills: render in left panel:
```
Your waterfall is empty.

[ Set up your waterfall from scratch ▸ ]
```
CTA opens `WaterfallSetupWizard` (Phase 15 — for now, just console.log('open wizard')).

### Task 8.9: `[Review ▸]` button and `[+ Save snapshot]` in OverviewPage header

In `OverviewPage.tsx`, add to the page header row:
```tsx
// Header: "Overview    March 2026    [Review ▸]"
// [Review ▸] button: opens ReviewWizard overlay (Phase 14 — stub as console.log('open review'))
// [+ Save snapshot] button lives on the SnapshotTimeline (already in Task 8.6) — no duplicate needed here
<button onClick={() => console.log('open review wizard')}>Review ▸</button>
```

This stub ensures Phase 14 has a working entry point when the ReviewWizard is wired up.

**Commit:** `feat: overview page — waterfall, item detail, history charts, cashflow, snapshots`

---

## Phase 9: Frontend — Wealth Page

**Goal:** Wealth page with left panel asset class nav, account lists, account detail, ISA bar, projections, nudges.

### Task 9.1: TanStack Query hooks (`apps/frontend/src/hooks/useWealth.ts`)

```typescript
export const useWealthSummary  = () => useQuery({ queryKey: ['wealth'] })
export const useWealthAccounts = (assetClass?: AssetClass) =>
  useQuery({ queryKey: ['wealth-accounts', assetClass ?? 'all'] })
export const useWealthAccount  = (id: string) =>
  useQuery({ queryKey: ['wealth-account', id], enabled: !!id })
export const useISAAllowance   = () => useQuery({ queryKey: ['isa-allowance'] })
// Mutations: createAccount, updateAccount, updateValuation, confirmAccount, deleteAccount
```

### Task 9.2: `WealthLeftPanel.tsx`

```
TOTAL NET WORTH
£258,122
↑ £14,200 this yr

By liquidity:
  Cash & Savings      £47,311
  Inv. & Pensions    £162,922
  Property & Veh.     £47,889

──────────────────────

Savings     £37,900  ●   (● = currently selected)
Pensions   £162,922
Investments  £9,411
Property    £47,889
Vehicles         £0
Other            £0

──────────────────────

Held on behalf of
  LR           £6,101
  (excluded from net worth)
```

Clicking an asset class row (or trust section) sets `selectedClass` state → populates right panel.

### Task 9.3: `AccountListPanel.tsx` (right panel — asset class selected)

```
{Asset Class Name}
──────────────────────────────────────────────
Tandem ISA        £17,300   3.40%   Updated 15 Jan ✓
→ £700/mo from waterfall  ·  Projected Dec 2026: £25,700

Trading 212 ISA   £18,500   4.30%   Updated 15 Jan ✓
→ £300/mo from waterfall  ·  Projected Dec 2026: £22,100

Zopa Savings       £2,100   7.10%   Updated 15 Jan ✓
→ £0/mo from waterfall

[Nudge card if applicable — see nudge rules below]

[ISA allowance bar if any ISA accounts — see Task 9.4]

[ + Add {asset class} account ]
```

**Nudge rules (savings only):**
- Higher-rate account with unused contribution capacity → show arithmetic: "Zopa (7.10%) has headroom — redirecting from Tandem could earn ~£X more per year."
- One nudge maximum per panel; silence if all already optimised.

**"Updated [date] ✓"**: green ✓ if not stale, amber ⚠ if stale (using staleness utility from Phase 12).

Clicking an account row: sets `selectedAccount`, renders `AccountDetailPanel`.

### Task 9.4: ISA allowance bar

```tsx
// Rendered below account list when assetClass === 'savings'
// Data from useISAAllowance()
// One bar per person who owns ISA accounts:
//   Josh ISA allowance: £8,400 of £20,000  ████░░░░  Apr deadline
//   Cat ISA allowance:  £3,200 of £20,000  ██░░░░░░  Apr deadline
// "Apr deadline" = April 5 of current tax year
```

### Task 9.5: `AccountDetailPanel.tsx` (right panel — account selected)

```
← {Asset Class}  /  {Account Name}
──────────────────────────────────────────────
Balance       £17,300
Interest      3.40%           (savings only)
Contribution  £700/mo  (from waterfall — Savings allocation)
Last updated  15 Jan 2026

[HistoryChart — balance over time, same component as waterfall]

Projected (at £700/mo):
Dec 2026: £25,700

[ Edit ]   [ Update valuation ]
```

"Update valuation" → inline form within panel: `{ balance: number, valuationDate: date (defaults today) }`. Submit calls `POST /api/wealth/accounts/:id/valuation`.

"Edit" → inline form to update metadata (name, provider, interest rate, ISA flag etc.). For ISA accounts, include a **"Contributions this tax year (Apr–Mar)"** field (`isaYearContribution`). Label should note: "Enter the total you have contributed to this ISA since 6 April." On first render after the UK tax year rolls over (today ≥ 6 April and the account's `updatedAt` predates the most recent 6 April), show an amber banner above the ISA allowance bar: "It's a new tax year — your ISA allowance has reset. Update your contributions for each ISA account."

Trust accounts: identical panel with "Held on behalf of [Name]" banner at top.

**Commit:** `feat: wealth page — accounts, valuations, ISA bar, projections, nudges`

---

## Phase 10: Frontend — Planner Page

**Goal:** Purchases and gifts with left panel summaries, right panel lists and detail.

### Task 10.1: TanStack Query hooks (`apps/frontend/src/hooks/usePlanner.ts`)

```typescript
export const usePurchases      = (year: number) => useQuery({ queryKey: ['purchases', year] })
export const useGiftsUpcoming  = (year: number) => useQuery({ queryKey: ['gifts-upcoming', year] })
export const useGiftsByPerson  = (year: number) => useQuery({ queryKey: ['gifts-persons', year] })
export const useGiftPerson     = (id: string)   => useQuery({ queryKey: ['gift-person', id], enabled: !!id })
export const usePlannerBudget  = (year: number) => useQuery({ queryKey: ['planner-budget', year] })
```

### Task 10.2: Year selector

```tsx
// In PlannerPage header:
// "Planner   ‹ 2025   2026 ›"
// year state defaults to new Date().getFullYear()
// Prior years: pass year prop to all queries; all mutations disabled when year < currentYear
```

### Task 10.3: `PlannerLeftPanel.tsx`

```
PURCHASES  ●
Budget      £6,000
Scheduled  £10,110 ⚠   (amber/red when scheduled > budget)
Spent        £5,172

──────────────────

GIFTS
Budget      £2,400
Estimated   £2,623 ⚠
Spent        £1,180
```

Clicking "PURCHASES" or "GIFTS" sets `selectedSection`.

### Task 10.4: Purchase right panel (`PurchaseListPanel.tsx`)

List of purchase items from `usePurchases(year)`:
```
● London Trip         £1,000   In progress
● Kitchen repaint     £2,000   In progress
✓ Backdoor            £1,117   Done
...
[ + Add purchase ]
```

Clicking an item → breadcrumb detail view with all fields. Edit opens inline form within the panel.

### Task 10.5: Gifts right panel — toggle views

Header of right panel when Gifts selected:
```
Gifts                           [Upcoming ▾]  (dropdown to switch to "By person")
```

**Upcoming view** (default, sorted by nextDate):
```
Coming up
  Cat · Birthday     14 Apr   Budget £20    Spent £0     ○
  LR · Birthday      02 May   Budget £150   Spent £0     ○
  ...
Done this year
  Cat · Christmas    ✓         Budget £100   Spent £100
[ + Add person ]
```

**By person view**:
```
Cat        Budget £220   Spent £100  ○
Josh       Budget £100   Spent £0    ○
...
[ + Add person ]
```

Clicking any person or event row → `GiftPersonDetailPanel` (breadcrumb: `← Gifts / {Name}`):
```
Birthday     14 Apr    Budget £20    Spent £0     ○
Christmas    25 Dec    Budget £100   Spent £100   ✓

Total  Budget £120   Spent £100

Notes:

[ + Add event ]   [ Edit person ]
```

Clicking an event row: expands it inline showing budget, spent, notes fields (editable). No deeper panel depth.

Status symbols: ✓ (spent ≥ budget), ○ (upcoming or partial), ⚠ (over budget).

**Commit:** `feat: planner page — purchases, gifts, upcoming/by-person views`

---

## Phase 11: Frontend — Settings Page

**Goal:** All configurable options plus household management and snapshot manager.

### Task 11.1: `SettingsPage.tsx` layout

Left nav with sections (same TwoPanelLayout pattern, or a simpler single-column with section headers on desktop):

```
Profile
Staleness thresholds
Surplus benchmark
ISA settings
──────────────────
Household
  Members & Invitations
──────────────────
Snapshots
Trust accounts
──────────────────
Waterfall
  Rebuild from scratch
```

### Task 11.2: Individual settings panels

- **Profile**: Name input + submit → `PATCH /api/auth/me { name }`
- **Staleness thresholds**: One `<input type="number">` per item type (months). Labels: "Income sources", "Monthly bills", "Yearly bills", "Discretionary categories", "Savings allocations", "Wealth accounts". Submit → `PATCH /api/settings { stalenessThresholds }`
- **Surplus benchmark**: Percentage input (default 10%). Submit → `PATCH /api/settings { surplusBenchmarkPct }`
- **ISA settings**: Three fields:
  - Annual limit input (default £20,000) → `isaAnnualLimit`
  - Tax year start month (1–12, default 4) → `isaYearStartMonth`
  - Tax year start day (1–31, default 6) → `isaYearStartDay`
  - Submit → `PATCH /api/settings { isaAnnualLimit, isaYearStartMonth, isaYearStartDay }`
  - Label: "UK default: 6 April. Only change if you are in a different jurisdiction."
- **Household**: Move household management content from old ProfilePage → here. Members list, invite by email (QR code flow), remove member, rename household. All existing service calls reused.
- **Snapshots**: List all snapshots with name, date, rename (inline), delete (confirm dialog). Calls `GET/PATCH/DELETE /api/snapshots`.
- **Trust accounts**: List all `WealthAccount` where `isTrust: true`, grouped by `trustBeneficiaryName`. Add by creating a WealthAccount with `isTrust: true`. Rename by PATCH WealthAccount. This is a convenience view — actual accounts managed via Wealth page.
- **Waterfall → Rebuild from scratch**: Button → confirm dialog: "This will permanently delete all income sources, bills, and discretionary categories. Are you sure?" → on confirm: call `DELETE /api/waterfall/all` (implemented in Phase 3), then redirect to `/overview` (empty state will show wizard CTA).

**Commit:** `feat: settings page — all sections, household management, snapshot manager`

---

## Phase 12: Staleness System

**Goal:** Cross-cutting staleness indicators on all waterfall and wealth items.

### Task 12.1: `apps/frontend/src/utils/staleness.ts`

```typescript
import { differenceInMonths, parseISO } from 'date-fns'
// Install if not present: bun add date-fns

export function isStale(lastReviewedAt: string, thresholdMonths: number): boolean {
  return differenceInMonths(new Date(), parseISO(lastReviewedAt)) >= thresholdMonths
}

export function stalenessLabel(lastReviewedAt: string): string {
  const months = differenceInMonths(new Date(), parseISO(lastReviewedAt))
  if (months === 0) return 'Last reviewed: this month'
  if (months === 1) return 'Last reviewed: 1 month ago'
  return `Last reviewed: ${months} months ago`
}
```

### Task 12.2: `StalenessIndicator.tsx`

```tsx
// apps/frontend/src/components/common/StalenessIndicator.tsx
interface Props { lastReviewedAt: string; thresholdMonths: number }

// If stale: render amber ⚠ icon with Tooltip "Not reviewed for X months"
// If not stale: render nothing (silence = approval)
```

### Task 12.3: Wire staleness into Overview

In `WaterfallLeftPanel.tsx`, import `isStale` and `useHouseholdSettings`. For each item row, add `<StalenessIndicator lastReviewedAt={item.lastReviewedAt} thresholdMonths={settings.stalenessThresholds[itemType]} />`.

In `ItemDetailPanel.tsx`, show `stalenessLabel(item.lastReviewedAt)` below the value. If stale, show ⚠ prefix.

### Task 12.4: Wire staleness into Wealth

In `AccountListPanel.tsx`, replace the placeholder ✓/⚠ with `<StalenessIndicator>` for each account. In `AccountDetailPanel.tsx`, show `"Last updated: {date}"` + staleness label.

**Commit:** `feat: staleness indicators — overview and wealth pages`

---

## Phase 13: Snapshot System

**Goal:** Timeline navigator, snapshot creation, read-only snapshot view with per-item history markers.

This phase wires up the snapshot UI that was partially stubbed in Phase 8.

### Task 13.1: Complete `SnapshotTimeline.tsx`

The timeline must correctly position dots relative to `createdAt` dates. Use a simple proportional layout (oldest snapshot to today = full width). Dots are absolutely positioned.

If there are no snapshots: show only "[Now]" at right. The `[+ Save snapshot]` button is always visible.

### Task 13.2: Snapshot mode in `OverviewPage`

```tsx
const [viewingSnapshot, setViewingSnapshot] = useState<Snapshot | null>(null)

// When viewingSnapshot !== null:
//   Pass snapshot.data to WaterfallLeftPanel as prop (override live data)
//   Pass snapshotDate={viewingSnapshot.createdAt} to all HistoryCharts
//   Pass disabled={true} to all ItemDetailPanels
```

### Task 13.3: Snapshot creation triggers

Three triggers all open `CreateSnapshotModal`:
1. `[+ Save snapshot]` button on timeline — immediate
2. After Review Wizard completion (Phase 14) — opens modal as part of wizard summary step
3. On "significant value change" (income source or primary housing committed bill changes): prompt "Save a snapshot before updating?" with Yes/No/Don't ask options. If Yes: opens modal, then continues with the pending update.

For trigger 3: detect in the Update mutation for **income sources only** (not committed bills — that scope was too broad). If the `amount` field changed: show the prompt before calling the PATCH. If user dismisses (Yes/No): proceed without snapshot. Do not add a "Don't ask" option — it is not in the spec and has no defined persistence mechanism.

**Commit:** `feat: snapshot system — timeline nav, read-only view, creation triggers`

---

## Phase 14: Review Wizard

**Goal:** Full-screen review wizard, 6 steps, stale-first ordering, exit/resume, snapshot on completion.

### Task 14.1: `ReviewWizard.tsx` — full-screen overlay

```tsx
// Entry: [Review ▸] button in OverviewPage header
// Opens as full-screen <div> with z-index over the app
// On open: GET /api/review-session first:
//   - If session exists (partial progress): resume from session.currentStep
//   - If no session: POST /api/review-session (create fresh, step 0)
// On [✕ Exit]: close overlay only — do NOT delete the session.
//   Partial progress is preserved; re-opening resumes from the same step.
// Session is deleted only on "Save & finish" (end of Step 5) or an explicit "Abandon review" action.

const STEPS = ['Income', 'Bills', 'Yearly', 'Discretionary', 'Wealth', 'Summary']
```

### Task 14.2: Step content

Data per step:
- Step 0 Income: `GET /api/waterfall/income`
- Step 1 Monthly Bills: `GET /api/waterfall/committed`
- Step 2 Yearly Bills: `GET /api/waterfall/yearly`
- Step 3 Discretionary: `GET /api/waterfall/discretionary` + `GET /api/waterfall/savings`
- Step 4 Wealth: `GET /api/wealth/accounts`
- Step 5 Summary: derive from session.updatedItems + session.confirmedItems

Items are sorted: stale first (oldest `lastReviewedAt` first), then fresh items below.

Card for each item:
```tsx
// Header: "{name}"   ⚠ {N} months (if stale)
// Body: "{£value} / month  ·  Last reviewed: {date}"
// Footer (button pair — affirmative on right):
//   [ Update ]   [ Still correct ✓ ]
//
// "Still correct":
//   POST /api/waterfall/:type/:id/confirm (or wealth equivalent)
//   PATCH /api/review-session: add to confirmedItems[type]
//   Mark card as resolved (green ✓ in header)
//
// "Update":
//   Expand inline form within the card (no modal)
//   On submit: PATCH item
//   PATCH /api/review-session: add to updatedItems[itemId] = { from, to }
//   Mark card as resolved
```

Non-stale items: group below stale items, collapsed by default, with "Confirm all remaining ({n})" button that batch-confirms them all in one call.

### Task 14.3: Summary step (Step 5)

```
Updated
├─ Cat Salary   £3,708 → £3,950   (+£242/mo)
└─ Electric       £173 → £195     (+£22/mo)

Confirmed unchanged  (12 items)

New surplus: £197 / month   (was £209)

┌────────────────────────────────────────────────┐
│ Save snapshot as: [ March 2026 Review        ] │
│                           [ Save & finish ]    │
└────────────────────────────────────────────────┘
```

"Save & finish":
1. `POST /api/snapshots { name }`
2. `DELETE /api/review-session`
3. Close wizard
4. Invalidate ['waterfall', 'snapshots']
5. Overview timeline shows new dot

**Commit:** `feat: review wizard — 6 steps, staleness sorting, inline edit, snapshot on finish`

---

## Phase 15: Waterfall Creation Wizard

**Goal:** 7-step guided setup for new/rebuilt waterfall. Exit/resume. Opening snapshot.

### Task 15.1: `WaterfallSetupWizard.tsx` — full-screen overlay

Entry points:
1. Overview empty state CTA
2. Settings → Waterfall → "Rebuild from scratch" (after confirm dialog)

On open:
- `GET /api/setup-session` → if exists, resume from `currentStep`
- If not: `POST /api/setup-session`
- After "Rebuild": `DELETE /api/waterfall/all` first, then `POST /api/setup-session`

On `[✕ Exit]`: close without deleting session — data is preserved for resume.

### Task 15.2: Step content

All data is saved to the real DB immediately (not buffered in session). The session only tracks `currentStep`.

- **Step 0 — Household**: Show household name (editable inline), list current members, link to invite flow in Settings.

- **Step 1 — Income**: Inline "Add income source" form. List of added sources. Can edit/delete within the step.

- **Step 2 — Monthly Bills**: Same pattern — inline add form + list.

- **Step 3 — Yearly Bills**: Add form includes `dueMonth` select (Jan–Dec). List shows each bill with its due month.

- **Step 4 — Discretionary**: Add spending categories with monthly budget. List + edit/delete.

- **Step 5 — Savings**: Add savings allocations (name, monthly amount). Each allocation has optional "Link to Wealth account" dropdown showing existing WealthAccounts of class `savings`. If no accounts exist, show "Add a savings account first on the Wealth page."

- **Step 6 — Summary**:
  - Render full waterfall (read-only) with calculated surplus
  - "Save opening snapshot?" checkbox (default checked)
  - Snapshot name pre-populated: "Initial setup — {Month Year}" (editable)
  - `[ Finish ]` button → if checkbox checked: create snapshot → delete setup session → navigate to `/overview`

### Task 15.3: Persist step on navigation

On clicking "Next" or "Back": `PATCH /api/setup-session { currentStep: newStep }`.

**Commit:** `feat: waterfall creation wizard — 7 steps, exit/resume, opening snapshot`

---

## Verification

After all phases:

1. **Full new user journey**
   - Register → land on empty Overview → CTA launches Waterfall Creation Wizard
   - Complete all 7 steps → Overview shows waterfall with surplus
   - Click each item → right panel detail with history chart, edit, confirm

2. **Review Wizard flow**
   - Open Review Wizard → items sorted stale-first
   - Update one item → confirm all remaining → summary shows changes
   - Save snapshot → timeline updates with new dot → click dot → read-only view

3. **Cashflow calendar**
   - Add yearly bills including two in the same month
   - Committed → Yearly row → "View cashflow calendar" → shortfall month shows nudge

4. **Wealth page**
   - Add savings account → update valuation → history chart shows data point
   - Add ISA account → ISA bar appears → enter `isaYearContribution`

5. **Planner**
   - Add purchases → scheduled flag → budget vs scheduled ⚠ indicator
   - Add gift person → add birthday event → appears in Upcoming view

6. **Staleness**
   - Set staleness threshold to 0 in Settings → all items show ⚠

7. **Snapshot uniqueness**
   - Try saving two snapshots with the same name → inline error appears

8. **Multi-household**
   - Create second household → switch → waterfall is independent

9. **Trust savings**
   - Create WealthAccount with `isTrust: true` → appears in "Held on behalf of" → excluded from net worth

10. **Build check**
    ```bash
    bun run build   # from repo root — must pass with no errors
    bun run lint    # fix any warnings before claiming done
    ```
