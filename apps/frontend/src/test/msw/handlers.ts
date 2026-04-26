// apps/frontend/src/test/msw/handlers.ts
import { http, HttpResponse } from "msw";

// ─── Shared fixtures ──────────────────────────────────────────────────────────
export const mockUser = {
  id: "user-1",
  email: "test@example.com",
  name: "Test User",
  activeHouseholdId: "household-1",
  createdAt: "2025-01-01T00:00:00Z",
  updatedAt: "2025-01-01T00:00:00Z",
  preferences: {
    currency: "GBP",
    dateFormat: "DD/MM/YYYY",
    theme: "light",
    defaultInflationRate: 2.5,
  },
};

export const mockAccount = {
  id: "acc-1",
  userId: "user-1",
  name: "Test Account",
  type: "current",
  subtype: null,
  currency: "GBP",
  balance: 1000,
  isActive: true,
  description: null,
  metadata: {},
  createdAt: "2025-01-01T00:00:00Z",
  updatedAt: "2025-01-01T00:00:00Z",
};

export const mockTransaction = {
  id: "tx-1",
  userId: "user-1",
  accountId: "acc-1",
  categoryId: "cat-1",
  subcategoryId: null,
  liabilityId: null,
  date: "2025-01-15T00:00:00Z",
  amount: 100,
  type: "expense",
  name: "Test Transaction",
  description: null,
  memo: null,
  tags: [],
  isRecurring: false,
  recurringRuleId: null,
  isGenerated: false,
  overriddenFields: [],
  generatedAt: null,
  recurrence: "none",
  recurrence_end_date: null,
  metadata: {},
  createdAt: "2025-01-15T00:00:00Z",
  updatedAt: "2025-01-15T00:00:00Z",
};

// ─── Auth check helper ────────────────────────────────────────────────────────
function requireAuth(request: Request) {
  if (!request.headers.get("authorization")?.startsWith("Bearer ")) {
    return HttpResponse.json(
      { error: { code: "AUTHENTICATION_ERROR", message: "No authorization token provided" } },
      { status: 401 }
    );
  }
  return null;
}

// ─── Auth handlers ────────────────────────────────────────────────────────────
export const authHandlers = [
  // CSRF endpoint is intentionally public — no auth required
  http.get("/api/auth/csrf-token", () => HttpResponse.json({ csrfToken: "test-csrf-token" })),
  http.post("/api/auth/login", () =>
    HttpResponse.json({ user: mockUser, accessToken: "test-token", refreshToken: "refresh-token" })
  ),
  http.post("/api/auth/register", () =>
    HttpResponse.json({ user: mockUser, accessToken: "test-token", refreshToken: "refresh-token" })
  ),
  http.post("/api/auth/logout", () => new HttpResponse(null, { status: 200 })),
  http.post("/api/auth/refresh", () => HttpResponse.json({ accessToken: "new-access-token" })),
  http.get("/api/auth/me", ({ request }) => {
    const err = requireAuth(request);
    return err ?? HttpResponse.json({ user: mockUser });
  }),
  http.patch("/api/auth/me", ({ request }) => {
    const err = requireAuth(request);
    return err ?? HttpResponse.json({ user: mockUser });
  }),
];

// ─── Account handlers ─────────────────────────────────────────────────────────
export const accountHandlers = [
  http.get("/api/accounts", ({ request }) => {
    const err = requireAuth(request);
    return err ?? HttpResponse.json({ accounts: [mockAccount] });
  }),
  http.get("/api/accounts/:id/summary", ({ request }) => {
    const err = requireAuth(request);
    return (
      err ??
      HttpResponse.json({ account: mockAccount, transactionCount: 5, recentTransactions: [] })
    );
  }),
  http.get("/api/accounts/:id", ({ request }) => {
    const err = requireAuth(request);
    return err ?? HttpResponse.json({ account: mockAccount });
  }),
  http.post("/api/accounts", ({ request }) => {
    const err = requireAuth(request);
    return err ?? HttpResponse.json({ account: mockAccount }, { status: 201 });
  }),
  http.put("/api/accounts/:id", ({ request }) => {
    const err = requireAuth(request);
    return err ?? HttpResponse.json({ account: mockAccount });
  }),
  http.delete("/api/accounts/:id", ({ request }) => {
    const err = requireAuth(request);
    return err ?? HttpResponse.json({ message: "Account deleted successfully" });
  }),
];

// ─── Transaction handlers ─────────────────────────────────────────────────────
export const transactionHandlers = [
  // summary must come before :id to avoid wrong match
  http.get("/api/transactions/summary", ({ request }) => {
    const err = requireAuth(request);
    return (
      err ??
      HttpResponse.json({
        totalIncome: 1000,
        totalExpenses: 500,
        netFlow: 500,
        transactionCount: 10,
      })
    );
  }),
  // collection must come before /:id to avoid wrong match
  http.get("/api/transactions", ({ request }) => {
    const err = requireAuth(request);
    return (
      err ??
      HttpResponse.json({
        transactions: [mockTransaction],
        pagination: { total: 1, limit: 50, offset: 0, hasMore: false },
      })
    );
  }),
  http.get("/api/transactions/:id", ({ request }) => {
    const err = requireAuth(request);
    return err ?? HttpResponse.json({ transaction: mockTransaction });
  }),
  http.post("/api/transactions", ({ request }) => {
    const err = requireAuth(request);
    return err ?? HttpResponse.json({ transaction: mockTransaction }, { status: 201 });
  }),
  http.put("/api/transactions/:id", ({ request }) => {
    const err = requireAuth(request);
    return err ?? HttpResponse.json({ transaction: mockTransaction });
  }),
  http.delete("/api/transactions/:id", ({ request }) => {
    const err = requireAuth(request);
    return err ?? HttpResponse.json({ message: "Transaction deleted" });
  }),
];

// ─── Goal handlers ────────────────────────────────────────────────────────────
export const mockGoal = {
  id: "goal-1",
  userId: "user-1",
  name: "Emergency Fund",
  description: null,
  type: "savings",
  targetAmount: 10000,
  currentAmount: 2500,
  targetDate: "2026-12-31T00:00:00Z",
  priority: "medium" as const,
  status: "active" as const,
  icon: null,
  metadata: {},
  createdAt: "2025-01-01T00:00:00Z",
  updatedAt: "2025-01-01T00:00:00Z",
};

export const mockEnhancedGoal = {
  ...mockGoal,
  contributions: [],
  progressPercentage: 25,
  daysRemaining: null,
  averageMonthlyContribution: 0,
  projectedCompletionDate: null,
  recommendedMonthlyContribution: null,
  isOnTrack: false,
};

export const goalHandlers = [
  // summary must come before :id to avoid wrong match
  http.get("/api/goals/summary", ({ request }) => {
    const err = requireAuth(request);
    return (
      err ??
      HttpResponse.json({
        totalSaved: 2500,
        totalTarget: 10000,
        activeGoals: 1,
        completedGoals: 0,
        byType: [],
        byPriority: [],
      })
    );
  }),
  http.get("/api/goals", ({ request }) => {
    const err = requireAuth(request);
    return err ?? HttpResponse.json({ goals: [mockEnhancedGoal] });
  }),
  http.get("/api/goals/:id/contributions", ({ request }) => {
    const err = requireAuth(request);
    return err ?? HttpResponse.json({ contributions: [] });
  }),
  http.get("/api/goals/:id", ({ request }) => {
    const err = requireAuth(request);
    return err ?? HttpResponse.json({ goal: mockGoal });
  }),
  http.post("/api/goals", ({ request }) => {
    const err = requireAuth(request);
    return err ?? HttpResponse.json({ goal: mockGoal }, { status: 201 });
  }),
  http.put("/api/goals/:id", ({ request }) => {
    const err = requireAuth(request);
    return err ?? HttpResponse.json({ goal: mockGoal });
  }),
  http.delete("/api/goals/:id", ({ request }) => {
    const err = requireAuth(request);
    return err ?? HttpResponse.json({ message: "Goal deleted" });
  }),
  http.post("/api/goals/:id/contributions", ({ request }) => {
    const err = requireAuth(request);
    return err ?? HttpResponse.json({ goal: mockGoal }, { status: 201 });
  }),
  http.post("/api/goals/:id/link-transaction", ({ request }) => {
    const err = requireAuth(request);
    return err ?? HttpResponse.json({ goal: mockGoal }, { status: 201 });
  }),
];

// ─── Liability handlers ───────────────────────────────────────────────────────
export const mockLiability = {
  id: "liability-1",
  userId: "user-1",
  name: "Test Mortgage",
  type: "mortgage",
  currentBalance: 200000,
  interestRate: 3.5,
  interestType: "fixed",
  openDate: "2020-01-01T00:00:00Z",
  termEndDate: "2055-01-01T00:00:00Z",
  metadata: {},
  createdAt: "2025-01-01T00:00:00Z",
  updatedAt: "2025-01-01T00:00:00Z",
  linkedAsset: {
    id: "asset-1",
    name: "Test Property",
    type: "housing",
    currentValue: 250000,
  },
};
export const liabilityHandlers = [
  http.get("/api/liabilities", ({ request }) => {
    const err = requireAuth(request);
    return err ?? HttpResponse.json({ liabilities: [mockLiability] });
  }),
  http.get("/api/liabilities/:id", ({ request }) => {
    const err = requireAuth(request);
    return err ?? HttpResponse.json({ liability: mockLiability });
  }),
  http.post("/api/liabilities", ({ request }) => {
    const err = requireAuth(request);
    return err ?? HttpResponse.json({ liability: mockLiability }, { status: 201 });
  }),
  http.put("/api/liabilities/:id", ({ request }) => {
    const err = requireAuth(request);
    return err ?? HttpResponse.json({ liability: mockLiability });
  }),
  http.delete("/api/liabilities/:id", ({ request }) => {
    const err = requireAuth(request);
    return err ?? HttpResponse.json({ message: "Liability deleted" });
  }),
];

// ─── Asset handlers ───────────────────────────────────────────────────────────
export const mockAsset = {
  id: "asset-1",
  userId: "user-1",
  name: "Test Property",
  type: "housing",
  currentValue: 250000,
  purchaseValue: 200000,
  purchaseDate: "2020-06-15T00:00:00Z",
  expectedGrowthRate: 3.0,
  liquidityType: "illiquid",
  metadata: {},
  createdAt: "2025-01-01T00:00:00Z",
  updatedAt: "2025-01-01T00:00:00Z",
  linkedLiability: {
    id: "liability-1",
    name: "Test Mortgage",
    type: "mortgage",
    currentBalance: 200000,
  },
};

export const mockEnhancedAsset = {
  ...mockAsset,
  valueHistory: [],
  totalGain: 50000,
  totalGainPercent: 25,
};
export const assetHandlers = [
  http.get("/api/assets", ({ request }) => {
    const err = requireAuth(request);
    return err ?? HttpResponse.json({ assets: [mockEnhancedAsset] });
  }),
  http.get("/api/assets/:id", ({ request }) => {
    const err = requireAuth(request);
    return err ?? HttpResponse.json({ asset: mockAsset });
  }),
  http.post("/api/assets", ({ request }) => {
    const err = requireAuth(request);
    return err ?? HttpResponse.json({ asset: mockAsset }, { status: 201 });
  }),
  http.put("/api/assets/:id", ({ request }) => {
    const err = requireAuth(request);
    return err ?? HttpResponse.json({ asset: mockAsset });
  }),
  http.delete("/api/assets/:id", ({ request }) => {
    const err = requireAuth(request);
    return err ?? HttpResponse.json({ message: "Asset deleted" });
  }),
];

// ─── Budget handlers ──────────────────────────────────────────────────────────
const mockBudget = {
  id: "budget-1",
  userId: "user-1",
  name: "Monthly Budget",
  period: "monthly",
  startDate: "2025-01-01T00:00:00Z",
  endDate: "2025-01-31T00:00:00Z",
  isActive: true,
  createdAt: "2025-01-01T00:00:00Z",
  updatedAt: "2025-01-01T00:00:00Z",
};
export const budgetHandlers = [
  http.get("/api/budgets", ({ request }) => {
    const err = requireAuth(request);
    return err ?? HttpResponse.json({ budgets: [mockBudget] });
  }),
  http.get("/api/budgets/:id", ({ request }) => {
    const err = requireAuth(request);
    return (
      err ??
      HttpResponse.json({
        budget: {
          ...mockBudget,
          categoryGroups: [],
          totalAllocated: 0,
          totalSpent: 0,
          totalRemaining: 0,
          unallocated: 0,
          expectedIncome: 0,
        },
      })
    );
  }),
  http.post("/api/budgets", ({ request }) => {
    const err = requireAuth(request);
    return err ?? HttpResponse.json({ budget: mockBudget }, { status: 201 });
  }),
  http.put("/api/budgets/:id", ({ request }) => {
    const err = requireAuth(request);
    return err ?? HttpResponse.json({ budget: mockBudget });
  }),
  http.delete("/api/budgets/:id", ({ request }) => {
    const err = requireAuth(request);
    return err ?? HttpResponse.json({ message: "Budget deleted" });
  }),
];

// ─── Category handlers ────────────────────────────────────────────────────────
const mockCategory = {
  id: "cat-1",
  userId: null,
  name: "Food",
  type: "expense",
  color: "#FF0000",
  icon: null,
  isSystemCategory: false,
  parentCategoryId: null,
  sortOrder: 0,
  createdAt: "2025-01-01T00:00:00Z",
  updatedAt: "2025-01-01T00:00:00Z",
};
export const categoryHandlers = [
  http.get("/api/categories", ({ request }) => {
    const err = requireAuth(request);
    return err ?? HttpResponse.json({ categories: [mockCategory] });
  }),
];

// ─── Household handlers ───────────────────────────────────────────────────────
const mockHousehold = {
  id: "household-1",
  name: "My Household",
  createdAt: "2025-01-01T00:00:00Z",
  updatedAt: "2025-01-01T00:00:00Z",
};
export const householdHandlers = [
  http.get("/api/households", ({ request }) => {
    const err = requireAuth(request);
    return (
      err ??
      HttpResponse.json({
        households: [
          {
            householdId: mockHousehold.id,
            userId: "user-1",
            role: "owner",
            joinedAt: "2025-01-01T00:00:00Z",
            household: { ...mockHousehold, _count: { members: 1 } },
          },
        ],
      })
    );
  }),
  http.post("/api/households", ({ request }) => {
    const err = requireAuth(request);
    return err ?? HttpResponse.json({ household: mockHousehold }, { status: 201 });
  }),
  http.get("/api/households/:id", ({ request }) => {
    const err = requireAuth(request);
    return err ?? HttpResponse.json({ household: { ...mockHousehold, members: [], invites: [] } });
  }),
  http.patch("/api/households/:id", ({ request }) => {
    const err = requireAuth(request);
    return err ?? HttpResponse.json({ household: mockHousehold });
  }),
  http.post("/api/households/:id/switch", ({ request }) => {
    const err = requireAuth(request);
    return err ?? HttpResponse.json({ success: true });
  }),
  http.post("/api/households/:id/invite", ({ request }) => {
    const err = requireAuth(request);
    return (
      err ??
      HttpResponse.json(
        { token: "mock-invite-token", invitedEmail: "invitee@example.com" },
        { status: 201 }
      )
    );
  }),
  http.get("/api/auth/invite/:token", () =>
    HttpResponse.json({
      householdId: "household-1",
      householdName: "My Household",
      emailRequired: true,
      maskedInvitedEmail: "i******@example.com",
    })
  ),
  http.post("/api/auth/invite/:token/accept", () =>
    HttpResponse.json({ user: mockUser, accessToken: "test-token" }, { status: 201 })
  ),
  http.post("/api/auth/invite/:token/join", ({ request }) => {
    const err = requireAuth(request);
    return err ?? HttpResponse.json({ household: mockHousehold });
  }),
  http.delete("/api/households/:id/members/:memberId", ({ request }) => {
    const err = requireAuth(request);
    return err ?? HttpResponse.json({ success: true });
  }),
  http.delete("/api/households/:id/invites/:inviteId", ({ request }) => {
    const err = requireAuth(request);
    return err ?? HttpResponse.json({ success: true });
  }),
  http.delete("/api/households/:id", ({ request }) => {
    const err = requireAuth(request);
    return err ?? new HttpResponse(null, { status: 204 });
  }),
];

// ─── Recurring rule handlers ──────────────────────────────────────────────────
export const mockRecurringRule = {
  id: "rule-1",
  userId: "user-1",
  frequency: "monthly",
  interval: 1,
  startDate: "2025-01-01T00:00:00Z",
  endDate: null,
  occurrences: null,
  lastGeneratedDate: null,
  isActive: true,
  templateTransaction: {
    accountId: "acc-1",
    amount: 500,
    type: "expense",
    categoryId: "cat-1",
    subcategoryId: null,
    name: "Monthly Rent",
    description: null,
    memo: null,
    tags: [],
  },
  version: 1,
  createdAt: "2025-01-01T00:00:00Z",
  updatedAt: "2025-01-01T00:00:00Z",
};

export const recurringHandlers = [
  // preview and materialize must come before :id to avoid wrong match
  http.post("/api/recurring-rules/preview", ({ request }) => {
    const err = requireAuth(request);
    return err ?? HttpResponse.json({ occurrences: ["2025-01-01", "2025-02-01", "2025-03-01"] });
  }),
  http.post("/api/recurring-rules/materialize", ({ request }) => {
    const err = requireAuth(request);
    return err ?? HttpResponse.json({ message: "Materialized 3 transactions", count: 3 });
  }),
  http.get("/api/recurring-rules", ({ request }) => {
    const err = requireAuth(request);
    return err ?? HttpResponse.json({ recurringRules: [mockRecurringRule] });
  }),
  http.get("/api/recurring-rules/:id", ({ request }) => {
    const err = requireAuth(request);
    return err ?? HttpResponse.json({ recurringRule: mockRecurringRule });
  }),
  http.post("/api/recurring-rules", ({ request }) => {
    const err = requireAuth(request);
    return err ?? HttpResponse.json({ recurringRule: mockRecurringRule }, { status: 201 });
  }),
  http.put("/api/recurring-rules/:id", ({ request }) => {
    const err = requireAuth(request);
    return err ?? HttpResponse.json({ recurringRule: mockRecurringRule });
  }),
  http.delete("/api/recurring-rules/:id", ({ request }) => {
    const err = requireAuth(request);
    return err ?? HttpResponse.json({ message: "Recurring rule deleted" });
  }),
];

// ─── Dashboard handlers ───────────────────────────────────────────────────────
export const dashboardHandlers = [
  http.get("/api/dashboard/summary", ({ request }) => {
    const err = requireAuth(request);
    return (
      err ??
      HttpResponse.json({
        period: { startDate: "2025-01-01T00:00:00Z", endDate: "2025-01-31T00:00:00Z" },
        summary: {
          totalBalance: 5000,
          totalCash: 5000,
          totalAssets: 100000,
          totalLiabilities: 50000,
          netWorth: 55000,
          monthlyIncome: 4000,
          monthlyExpense: 2500,
          netCashFlow: 1500,
          savingsRate: "37.5",
        },
        accounts: [mockAccount],
        recentTransactions: [],
        topCategories: [],
        transactionCounts: { income: 5, expense: 8, total: 13 },
      })
    );
  }),
  http.get("/api/dashboard/net-worth-trend", ({ request }) => {
    const err = requireAuth(request);
    return err ?? HttpResponse.json({ trend: [] });
  }),
  http.get("/api/dashboard/income-expense-trend", ({ request }) => {
    const err = requireAuth(request);
    return err ?? HttpResponse.json({ trend: [] });
  }),
];

export const handlers = [
  ...authHandlers,
  ...accountHandlers,
  ...transactionHandlers,
  ...goalHandlers,
  ...liabilityHandlers,
  ...assetHandlers,
  ...budgetHandlers,
  ...categoryHandlers,
  ...householdHandlers,
  ...recurringHandlers,
  ...dashboardHandlers,
];
