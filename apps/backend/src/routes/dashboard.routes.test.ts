import { describe, it, expect, mock, beforeEach, beforeAll, afterAll } from 'bun:test';
import type { FastifyInstance } from 'fastify';
import { buildTestApp } from '../test/helpers/fastify';
import { errorHandler } from '../middleware/errorHandler';
import { AuthenticationError } from '../utils/errors';

mock.module('../services/dashboard.service', () => ({
  dashboardService: {
    getDashboardSummary: mock(() => {}),
    getNetWorthTrend: mock(() => {}),
    getIncomeExpenseTrend: mock(() => {}),
  },
}));

mock.module('../middleware/auth.middleware', () => ({
  authMiddleware: mock(() => {}),
}));

import { dashboardService } from '../services/dashboard.service';
import { authMiddleware } from '../middleware/auth.middleware';
import { dashboardRoutes } from './dashboard.routes';

let app: FastifyInstance;

beforeAll(async () => {
  app = await buildTestApp();
  app.setErrorHandler(errorHandler);
  await app.register(dashboardRoutes, { prefix: '/api' });
  await app.ready();
});

afterAll(async () => {
  await app.close();
});

const authHeaders = { authorization: 'Bearer valid-token' };

const mockSummary = {
  period: {
    startDate: new Date('2025-01-01T00:00:00Z'),
    endDate: new Date('2025-01-31T23:59:59Z'),
  },
  summary: {
    totalBalance: 10000,
    totalCash: 10000,
    totalAssets: 50000,
    totalLiabilities: 20000,
    netWorth: 40000,
    monthlyIncome: 5000,
    monthlyExpense: 3000,
    netCashFlow: 2000,
    savingsRate: '40.00',
  },
  accounts: [],
  recentTransactions: [],
  topCategories: [],
  transactionCounts: { income: 5, expense: 8, total: 13 },
};

const mockNetWorthTrend = [
  { month: '2024-08', balance: 8000, cash: 8000, assets: 45000, liabilities: 20000, netWorth: 33000 },
  { month: '2024-09', balance: 9000, cash: 9000, assets: 47000, liabilities: 20000, netWorth: 36000 },
  { month: '2024-10', balance: 10000, cash: 10000, assets: 50000, liabilities: 20000, netWorth: 40000 },
];

const mockIncomeExpenseTrend = [
  { month: '2024-08', income: 5000, expense: 3000, net: 2000 },
  { month: '2024-09', income: 5500, expense: 3200, net: 2300 },
  { month: '2024-10', income: 5000, expense: 2800, net: 2200 },
];

beforeEach(() => {
  // Reset all service mock call histories
  for (const method of Object.values(dashboardService) as any[]) {
    if (typeof method?.mockReset === 'function') method.mockReset();
  }

  // Re-apply default mock return values
  (dashboardService.getDashboardSummary as any).mockResolvedValue(mockSummary);
  (dashboardService.getNetWorthTrend as any).mockResolvedValue(mockNetWorthTrend);
  (dashboardService.getIncomeExpenseTrend as any).mockResolvedValue(mockIncomeExpenseTrend);

  // Re-apply auth middleware mock
  (authMiddleware as any).mockImplementation(async (request: any) => {
    const authHeader = request.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw new AuthenticationError('No authorization token provided');
    }
    request.user = { userId: 'user-1', email: 'test@test.com' };
    request.householdId = 'household-1';
  });
});

describe('GET /api/dashboard/summary', () => {
  it('returns 200 with dashboard summary', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/dashboard/summary',
      headers: authHeaders,
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.period).toBeDefined();
    expect(body.summary).toBeDefined();
    expect(body.summary.netWorth).toBe(40000);
    expect(body.summary.monthlyIncome).toBe(5000);
    expect(body.summary.monthlyExpense).toBe(3000);
    expect(body.transactionCounts.total).toBe(13);
  });

  it('calls service with householdId and no options when no query params', async () => {
    await app.inject({
      method: 'GET',
      url: '/api/dashboard/summary',
      headers: authHeaders,
    });

    expect(dashboardService.getDashboardSummary).toHaveBeenCalledWith(
      'household-1',
      expect.objectContaining({})
    );
  });

  it('calls service with parsed date options when query params provided', async () => {
    await app.inject({
      method: 'GET',
      url: '/api/dashboard/summary?startDate=2025-01-01&endDate=2025-01-31',
      headers: authHeaders,
    });

    expect(dashboardService.getDashboardSummary).toHaveBeenCalledWith(
      'household-1',
      expect.objectContaining({
        startDate: expect.any(Date),
        endDate: expect.any(Date),
      })
    );
  });

  it('returns summary with accounts and transaction counts', async () => {
    const summaryWithAccounts = {
      ...mockSummary,
      accounts: [{ id: 'acc-1', name: 'Checking', type: 'current', currency: 'GBP', balance: 10000 }],
    };
    (dashboardService.getDashboardSummary as any).mockResolvedValue(summaryWithAccounts);

    const response = await app.inject({
      method: 'GET',
      url: '/api/dashboard/summary',
      headers: authHeaders,
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.accounts).toHaveLength(1);
    expect(body.transactionCounts.total).toBe(13);
  });

  it('returns 401 without auth', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/dashboard/summary',
    });

    expect(response.statusCode).toBe(401);
  });
});

describe('GET /api/dashboard/net-worth-trend', () => {
  it('returns 200 with net worth trend data', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/dashboard/net-worth-trend',
      headers: authHeaders,
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.trend).toBeDefined();
    expect(body.trend).toHaveLength(3);
    expect(body.trend[0].month).toBe('2024-08');
    expect(body.trend[0].netWorth).toBe(33000);
  });

  it('calls service with householdId and default months (6)', async () => {
    await app.inject({
      method: 'GET',
      url: '/api/dashboard/net-worth-trend',
      headers: authHeaders,
    });

    expect(dashboardService.getNetWorthTrend).toHaveBeenCalledWith('household-1', 6);
  });

  it('calls service with custom months when provided', async () => {
    await app.inject({
      method: 'GET',
      url: '/api/dashboard/net-worth-trend?months=12',
      headers: authHeaders,
    });

    expect(dashboardService.getNetWorthTrend).toHaveBeenCalledWith('household-1', 12);
  });

  it('returns empty trend array when no data', async () => {
    (dashboardService.getNetWorthTrend as any).mockResolvedValue([]);

    const response = await app.inject({
      method: 'GET',
      url: '/api/dashboard/net-worth-trend',
      headers: authHeaders,
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.trend).toHaveLength(0);
  });

  it('returns 401 without auth', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/dashboard/net-worth-trend',
    });

    expect(response.statusCode).toBe(401);
  });
});

describe('GET /api/dashboard/income-expense-trend', () => {
  it('returns 200 with income/expense trend data', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/dashboard/income-expense-trend',
      headers: authHeaders,
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.trend).toBeDefined();
    expect(body.trend).toHaveLength(3);
    expect(body.trend[0].income).toBe(5000);
    expect(body.trend[0].expense).toBe(3000);
    expect(body.trend[0].net).toBe(2000);
  });

  it('calls service with householdId and default months (6)', async () => {
    await app.inject({
      method: 'GET',
      url: '/api/dashboard/income-expense-trend',
      headers: authHeaders,
    });

    expect(dashboardService.getIncomeExpenseTrend).toHaveBeenCalledWith('household-1', 6);
  });

  it('calls service with custom months when provided', async () => {
    await app.inject({
      method: 'GET',
      url: '/api/dashboard/income-expense-trend?months=3',
      headers: authHeaders,
    });

    expect(dashboardService.getIncomeExpenseTrend).toHaveBeenCalledWith('household-1', 3);
  });

  it('returns empty trend array when no data', async () => {
    (dashboardService.getIncomeExpenseTrend as any).mockResolvedValue([]);

    const response = await app.inject({
      method: 'GET',
      url: '/api/dashboard/income-expense-trend',
      headers: authHeaders,
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.trend).toHaveLength(0);
  });

  it('returns 401 without auth', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/dashboard/income-expense-trend',
    });

    expect(response.statusCode).toBe(401);
  });
});
