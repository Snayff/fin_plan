// apps/frontend/src/test/msw/handlers.ts
import { http, HttpResponse } from 'msw';

// ─── Shared fixtures ──────────────────────────────────────────────────────────
export const mockUser = {
  id: 'user-1',
  email: 'test@test.com',
  name: 'Test User',
  activeHouseholdId: 'household-1',
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-01T00:00:00Z',
  preferences: { currency: 'GBP', dateFormat: 'DD/MM/YYYY', theme: 'light', defaultInflationRate: 2.5 },
};

export const mockAccount = {
  id: 'acc-1',
  name: 'Test Account',
  type: 'current',
  currency: 'GBP',
  openingBalance: 0,
  isActive: true,
  balance: 1000,
  userId: 'user-1',
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-01T00:00:00Z',
};

export const mockTransaction = {
  id: 'tx-1',
  userId: 'user-1',
  accountId: 'acc-1',
  categoryId: null,
  subcategoryId: null,
  liabilityId: null,
  date: '2025-01-15T00:00:00Z',
  amount: 100,
  type: 'expense',
  name: 'Test Transaction',
  description: null,
  memo: null,
  tags: [],
  isRecurring: false,
  recurringRuleId: null,
  recurrence: 'none',
  recurrence_end_date: null,
  metadata: {},
  createdAt: '2025-01-15T00:00:00Z',
  updatedAt: '2025-01-15T00:00:00Z',
};

// ─── Auth check helper ────────────────────────────────────────────────────────
function requireAuth(request: Request) {
  if (!request.headers.get('authorization')?.startsWith('Bearer ')) {
    return HttpResponse.json(
      { error: { code: 'AUTHENTICATION_ERROR', message: 'No authorization token provided' } },
      { status: 401 }
    );
  }
  return null;
}

// ─── Auth handlers ────────────────────────────────────────────────────────────
export const authHandlers = [
  http.get('/api/auth/csrf-token', () => HttpResponse.json({ csrfToken: 'test-csrf-token' })),
  http.post('/api/auth/login', () =>
    HttpResponse.json({ user: mockUser, accessToken: 'test-token', refreshToken: 'refresh-token' })
  ),
  http.post('/api/auth/register', () =>
    HttpResponse.json({ user: mockUser, accessToken: 'test-token', refreshToken: 'refresh-token' })
  ),
  http.post('/api/auth/logout', () => new HttpResponse(null, { status: 200 })),
  http.post('/api/auth/refresh', () => HttpResponse.json({ accessToken: 'new-access-token' })),
  http.get('/api/auth/me', ({ request }) => {
    const err = requireAuth(request);
    return err ?? HttpResponse.json({ user: mockUser });
  }),
  http.patch('/api/auth/me', ({ request }) => {
    const err = requireAuth(request);
    return err ?? HttpResponse.json({ user: mockUser });
  }),
];

// ─── Account handlers ─────────────────────────────────────────────────────────
export const accountHandlers = [
  http.get('/api/accounts', ({ request }) => {
    const err = requireAuth(request);
    return err ?? HttpResponse.json({ accounts: [mockAccount] });
  }),
  http.get('/api/accounts/:id/summary', ({ request }) => {
    const err = requireAuth(request);
    return err ?? HttpResponse.json({ account: mockAccount, transactionCount: 5, recentTransactions: [] });
  }),
  http.get('/api/accounts/:id', ({ request }) => {
    const err = requireAuth(request);
    return err ?? HttpResponse.json({ account: mockAccount });
  }),
  http.post('/api/accounts', ({ request }) => {
    const err = requireAuth(request);
    return err ?? HttpResponse.json({ account: mockAccount }, { status: 201 });
  }),
  http.put('/api/accounts/:id', ({ request }) => {
    const err = requireAuth(request);
    return err ?? HttpResponse.json({ account: mockAccount });
  }),
  http.delete('/api/accounts/:id', ({ request }) => {
    const err = requireAuth(request);
    return err ?? HttpResponse.json({ message: 'Account deleted successfully' });
  }),
];

// ─── Transaction handlers ─────────────────────────────────────────────────────
export const transactionHandlers = [
  // summary must come before :id to avoid wrong match
  http.get('/api/transactions/summary', ({ request }) => {
    const err = requireAuth(request);
    return err ?? HttpResponse.json({ totalIncome: 1000, totalExpenses: 500, netFlow: 500, transactionCount: 10 });
  }),
  http.get('/api/transactions/:id', ({ request }) => {
    const err = requireAuth(request);
    return err ?? HttpResponse.json({ transaction: mockTransaction });
  }),
  http.get('/api/transactions', ({ request }) => {
    const err = requireAuth(request);
    return err ?? HttpResponse.json({
      transactions: [mockTransaction],
      pagination: { total: 1, limit: 50, offset: 0, hasMore: false },
    });
  }),
  http.post('/api/transactions', ({ request }) => {
    const err = requireAuth(request);
    return err ?? HttpResponse.json({ transaction: mockTransaction }, { status: 201 });
  }),
  http.put('/api/transactions/:id', ({ request }) => {
    const err = requireAuth(request);
    return err ?? HttpResponse.json({ transaction: mockTransaction });
  }),
  http.delete('/api/transactions/:id', ({ request }) => {
    const err = requireAuth(request);
    return err ?? HttpResponse.json({ message: 'Transaction deleted' });
  }),
];

// ─── Goal handlers ────────────────────────────────────────────────────────────
const mockGoal = {
  id: 'goal-1', userId: 'user-1', name: 'Emergency Fund', type: 'savings',
  targetAmount: 10000, currentAmount: 2500, targetDate: '2026-12-31T00:00:00Z',
  isCompleted: false, createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z',
};
export const goalHandlers = [
  http.get('/api/goals', ({ request }) => {
    const err = requireAuth(request);
    return err ?? HttpResponse.json({ goals: [mockGoal] });
  }),
  http.get('/api/goals/:id', ({ request }) => {
    const err = requireAuth(request);
    return err ?? HttpResponse.json({ goal: mockGoal });
  }),
  http.post('/api/goals', ({ request }) => {
    const err = requireAuth(request);
    return err ?? HttpResponse.json({ goal: mockGoal }, { status: 201 });
  }),
  http.put('/api/goals/:id', ({ request }) => {
    const err = requireAuth(request);
    return err ?? HttpResponse.json({ goal: mockGoal });
  }),
  http.delete('/api/goals/:id', ({ request }) => {
    const err = requireAuth(request);
    return err ?? HttpResponse.json({ message: 'Goal deleted' });
  }),
  http.post('/api/goals/:id/contributions', ({ request }) => {
    const err = requireAuth(request);
    return err ?? HttpResponse.json({ goal: mockGoal });
  }),
];

// ─── Liability handlers ───────────────────────────────────────────────────────
const mockLiability = {
  id: 'liability-1', userId: 'user-1', name: 'Test Mortgage', type: 'mortgage',
  currentBalance: 200000, interestRate: 3.5, interestType: 'fixed',
  openDate: '2020-01-01T00:00:00Z', termEndDate: '2055-01-01T00:00:00Z',
  createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z',
};
export const liabilityHandlers = [
  http.get('/api/liabilities', ({ request }) => {
    const err = requireAuth(request);
    return err ?? HttpResponse.json({ liabilities: [mockLiability] });
  }),
  http.get('/api/liabilities/:id', ({ request }) => {
    const err = requireAuth(request);
    return err ?? HttpResponse.json({ liability: mockLiability });
  }),
  http.post('/api/liabilities', ({ request }) => {
    const err = requireAuth(request);
    return err ?? HttpResponse.json({ liability: mockLiability }, { status: 201 });
  }),
  http.put('/api/liabilities/:id', ({ request }) => {
    const err = requireAuth(request);
    return err ?? HttpResponse.json({ liability: mockLiability });
  }),
  http.delete('/api/liabilities/:id', ({ request }) => {
    const err = requireAuth(request);
    return err ?? HttpResponse.json({ message: 'Liability deleted' });
  }),
];

// ─── Asset handlers ───────────────────────────────────────────────────────────
const mockAsset = {
  id: 'asset-1', userId: 'user-1', name: 'Test Property', type: 'housing',
  currentValue: 250000, purchaseValue: 200000, purchaseDate: '2020-06-15T00:00:00Z',
  expectedGrowthRate: 3.0, liquidityType: 'illiquid',
  createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z',
};
export const assetHandlers = [
  http.get('/api/assets', ({ request }) => {
    const err = requireAuth(request);
    return err ?? HttpResponse.json({ assets: [mockAsset] });
  }),
  http.get('/api/assets/:id', ({ request }) => {
    const err = requireAuth(request);
    return err ?? HttpResponse.json({ asset: mockAsset });
  }),
  http.post('/api/assets', ({ request }) => {
    const err = requireAuth(request);
    return err ?? HttpResponse.json({ asset: mockAsset }, { status: 201 });
  }),
  http.put('/api/assets/:id', ({ request }) => {
    const err = requireAuth(request);
    return err ?? HttpResponse.json({ asset: mockAsset });
  }),
  http.delete('/api/assets/:id', ({ request }) => {
    const err = requireAuth(request);
    return err ?? HttpResponse.json({ message: 'Asset deleted' });
  }),
];

// ─── Budget handlers ──────────────────────────────────────────────────────────
const mockBudget = {
  id: 'budget-1', userId: 'user-1', name: 'Monthly Budget', period: 'monthly',
  startDate: '2025-01-01T00:00:00Z', endDate: '2025-01-31T00:00:00Z',
  isActive: true, createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z',
};
export const budgetHandlers = [
  http.get('/api/budgets', ({ request }) => {
    const err = requireAuth(request);
    return err ?? HttpResponse.json({ budgets: [mockBudget] });
  }),
  http.get('/api/budgets/:id', ({ request }) => {
    const err = requireAuth(request);
    return err ?? HttpResponse.json({
      budget: { ...mockBudget, categoryGroups: [], totalAllocated: 0, totalSpent: 0, totalRemaining: 0, unallocated: 0, expectedIncome: 0 },
    });
  }),
  http.post('/api/budgets', ({ request }) => {
    const err = requireAuth(request);
    return err ?? HttpResponse.json({ budget: mockBudget }, { status: 201 });
  }),
  http.put('/api/budgets/:id', ({ request }) => {
    const err = requireAuth(request);
    return err ?? HttpResponse.json({ budget: mockBudget });
  }),
  http.delete('/api/budgets/:id', ({ request }) => {
    const err = requireAuth(request);
    return err ?? HttpResponse.json({ message: 'Budget deleted' });
  }),
];

// ─── Category handlers ────────────────────────────────────────────────────────
const mockCategory = {
  id: 'cat-1', name: 'Food', type: 'expense', color: '#FF0000', icon: '🍽️',
  isSystemCategory: false, parentCategoryId: null,
  createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z',
};
export const categoryHandlers = [
  http.get('/api/categories', ({ request }) => {
    const err = requireAuth(request);
    return err ?? HttpResponse.json({ categories: [mockCategory] });
  }),
];

// ─── Household handlers ───────────────────────────────────────────────────────
const mockHousehold = {
  id: 'household-1', name: 'My Household',
  createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z',
};
export const householdHandlers = [
  http.get('/api/households', ({ request }) => {
    const err = requireAuth(request);
    return err ?? HttpResponse.json({ households: [{ role: 'owner', household: mockHousehold }] });
  }),
  http.post('/api/households', ({ request }) => {
    const err = requireAuth(request);
    return err ?? HttpResponse.json({ household: mockHousehold }, { status: 201 });
  }),
  http.get('/api/households/:id', ({ request }) => {
    const err = requireAuth(request);
    return err ?? HttpResponse.json({ household: { ...mockHousehold, members: [], pendingInvites: [] } });
  }),
  http.post('/api/households/:id/switch', ({ request }) => {
    const err = requireAuth(request);
    return err ?? HttpResponse.json({ success: true });
  }),
];

// ─── Dashboard handlers ───────────────────────────────────────────────────────
export const dashboardHandlers = [
  http.get('/api/dashboard', ({ request }) => {
    const err = requireAuth(request);
    return err ?? HttpResponse.json({
      summary: {
        totalBalance: 5000, totalCash: 5000, totalAssets: 100000,
        totalLiabilities: 50000, netWorth: 55000,
        monthlyIncome: 4000, monthlyExpenses: 2500, savingsRate: 37.5,
      },
      recentTransactions: [],
      topCategories: [],
    });
  }),
];

export const handlers = [
  ...authHandlers, ...accountHandlers, ...transactionHandlers, ...goalHandlers,
  ...liabilityHandlers, ...assetHandlers, ...budgetHandlers, ...categoryHandlers,
  ...householdHandlers, ...dashboardHandlers,
];
