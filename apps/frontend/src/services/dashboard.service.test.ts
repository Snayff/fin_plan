import { describe, it, expect, beforeEach } from 'bun:test';
import { http, HttpResponse } from 'msw';
import { server } from '../test/msw/server';
import { setAuthenticated } from '../test/helpers/auth';
import { dashboardService } from './dashboard.service';

beforeEach(() => setAuthenticated());

describe('dashboardService.getSummary', () => {
  it('returns summary data from GET /api/dashboard/summary', async () => {
    const result = await dashboardService.getSummary();
    expect(result.summary).toBeDefined();
    expect(result.summary.totalBalance).toBe(5000);
    expect(result.accounts).toHaveLength(1);
  });

  it('appends startDate and endDate query params when provided', async () => {
    let capturedUrl = '';
    server.use(
      http.get('/api/dashboard/summary', ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json({ summary: {}, accounts: [], recentTransactions: [], topCategories: [] });
      })
    );
    await dashboardService.getSummary({ startDate: '2025-01-01', endDate: '2025-12-31' });
    expect(capturedUrl).toContain('startDate=2025-01-01');
    expect(capturedUrl).toContain('endDate=2025-12-31');
  });

  it('omits query string when no options provided', async () => {
    let capturedUrl = '';
    server.use(
      http.get('/api/dashboard/summary', ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json({ summary: {}, accounts: [], recentTransactions: [], topCategories: [] });
      })
    );
    await dashboardService.getSummary();
    expect(capturedUrl).not.toContain('?');
  });

  it('throws on 401 when unauthenticated', async () => {
    server.use(
      http.get('/api/dashboard/summary', () =>
        HttpResponse.json({ error: { code: 'AUTHENTICATION_ERROR' } }, { status: 401 })
      ),
      http.post('/api/auth/refresh', () =>
        HttpResponse.json({ error: { code: 'AUTHENTICATION_ERROR' } }, { status: 401 })
      )
    );
    await expect(dashboardService.getSummary()).rejects.toMatchObject({ statusCode: 401 });
  });
});

describe('dashboardService.getNetWorthTrend', () => {
  it('returns trend array', async () => {
    const result = await dashboardService.getNetWorthTrend(6);
    expect(Array.isArray(result.trend)).toBe(true);
  });

  it('passes months param in URL', async () => {
    let capturedUrl = '';
    server.use(
      http.get('/api/dashboard/net-worth-trend', ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json({ trend: [] });
      })
    );
    await dashboardService.getNetWorthTrend(12);
    expect(capturedUrl).toContain('months=12');
  });

  it('defaults to 6 months', async () => {
    let capturedUrl = '';
    server.use(
      http.get('/api/dashboard/net-worth-trend', ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json({ trend: [] });
      })
    );
    await dashboardService.getNetWorthTrend();
    expect(capturedUrl).toContain('months=6');
  });
});

describe('dashboardService.getIncomeExpenseTrend', () => {
  it('returns trend array', async () => {
    const result = await dashboardService.getIncomeExpenseTrend(6);
    expect(Array.isArray(result.trend)).toBe(true);
  });

  it('passes months param in URL', async () => {
    let capturedUrl = '';
    server.use(
      http.get('/api/dashboard/income-expense-trend', ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json({ trend: [] });
      })
    );
    await dashboardService.getIncomeExpenseTrend(3);
    expect(capturedUrl).toContain('months=3');
  });
});
