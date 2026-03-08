import { beforeEach, describe, expect, it } from 'bun:test';
import { screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { renderWithProviders } from '../test/helpers/render';
import { setAuthenticated, setUnauthenticated } from '../test/helpers/auth';
import { server } from '../test/msw/server';
import { useAuthStore } from '../stores/authStore';
import Dashboard12Page from './Dashboard12Page';

function primeFontLink(id: string) {
  const existing = document.getElementById(id);
  if (existing) existing.remove();

  const link = document.createElement('link');
  link.id = id;
  document.head.appendChild(link);
}

describe('Dashboard12Page', () => {
  beforeEach(() => {
    setAuthenticated();
    primeFontLink('dashboard12-fonts');
  });

  it('renders stable empty-state content when trend and category data are empty', async () => {
    server.use(
      http.get('/api/dashboard/summary', ({ request }) => {
        const auth = request.headers.get('authorization');
        if (!auth?.startsWith('Bearer ')) {
          return HttpResponse.json(
            { error: { code: 'AUTHENTICATION_ERROR', message: 'No authorization token provided' } },
            { status: 401 }
          );
        }

        return HttpResponse.json({
          period: { startDate: '2025-01-01T00:00:00Z', endDate: '2025-01-31T00:00:00Z' },
          summary: {
            totalBalance: 0,
            totalCash: 0,
            totalAssets: 0,
            totalLiabilities: 0,
            netWorth: 0,
            monthlyIncome: 0,
            monthlyExpense: 0,
            netCashFlow: 0,
            savingsRate: '0',
          },
          accounts: [],
          recentTransactions: [],
          topCategories: [],
          transactionCounts: { income: 0, expense: 0, total: 0 },
        });
      }),
      http.get('/api/dashboard/net-worth-trend', ({ request }) => {
        const auth = request.headers.get('authorization');
        if (!auth?.startsWith('Bearer ')) {
          return HttpResponse.json(
            { error: { code: 'AUTHENTICATION_ERROR', message: 'No authorization token provided' } },
            { status: 401 }
          );
        }

        return HttpResponse.json({ trend: [] });
      })
    );

    renderWithProviders(<Dashboard12Page />);

    await waitFor(() => {
      expect(screen.getByText('No trend data yet.')).toBeTruthy();
    });

    expect(screen.getByText('No spending data yet.')).toBeTruthy();
    expect(screen.getByText('No accounts yet.')).toBeTruthy();
    expect(screen.getByText('No transactions yet.')).toBeTruthy();
  });

  it('renders recent transactions when a transaction description is null', async () => {
    server.use(
      http.get('/api/dashboard/summary', ({ request }) => {
        const auth = request.headers.get('authorization');
        if (!auth?.startsWith('Bearer ')) {
          return HttpResponse.json(
            { error: { code: 'AUTHENTICATION_ERROR', message: 'No authorization token provided' } },
            { status: 401 }
          );
        }

        return HttpResponse.json({
          period: { startDate: '2025-01-01T00:00:00Z', endDate: '2025-01-31T00:00:00Z' },
          summary: {
            totalBalance: 5000,
            totalCash: 5000,
            totalAssets: 100000,
            totalLiabilities: 50000,
            netWorth: 55000,
            monthlyIncome: 4000,
            monthlyExpense: 2500,
            netCashFlow: 1500,
            savingsRate: '37.5',
          },
          accounts: [],
          recentTransactions: [
            {
              id: 'tx-1',
              userId: 'user-1',
              accountId: 'acc-1',
              categoryId: 'cat-1',
              subcategoryId: null,
              liabilityId: null,
              date: '2025-01-15T00:00:00Z',
              amount: 125,
              type: 'expense',
              name: 'Fallback Name',
              description: null,
              memo: null,
              tags: [],
              isRecurring: false,
              recurringRuleId: null,
              isGenerated: false,
              overriddenFields: [],
              generatedAt: null,
              recurrence: 'none',
              recurrence_end_date: null,
              metadata: {},
              createdAt: '2025-01-15T00:00:00Z',
              updatedAt: '2025-01-15T00:00:00Z',
              category: { id: 'cat-1', name: 'Food', color: '#FF0000' },
            },
          ],
          topCategories: [],
          transactionCounts: { income: 5, expense: 8, total: 13 },
        });
      })
    );

    renderWithProviders(<Dashboard12Page />);

    await waitFor(() => {
      expect(screen.getByText('Fallback Name')).toBeTruthy();
    });
  });

  it('does not request dashboard data while auth is still initializing', async () => {
    let summaryRequests = 0;
    let trendRequests = 0;

    setUnauthenticated();
    useAuthStore.setState({
      authStatus: 'initializing',
      isLoading: false,
      error: null,
    });

    server.use(
      http.get('/api/dashboard/summary', () => {
        summaryRequests += 1;
        return HttpResponse.json(
          { error: { code: 'AUTHENTICATION_ERROR', message: 'No authorization token provided' } },
          { status: 401 }
        );
      }),
      http.get('/api/dashboard/net-worth-trend', () => {
        trendRequests += 1;
        return HttpResponse.json(
          { error: { code: 'AUTHENTICATION_ERROR', message: 'No authorization token provided' } },
          { status: 401 }
        );
      })
    );

    renderWithProviders(<Dashboard12Page />);

    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(summaryRequests).toBe(0);
    expect(trendRequests).toBe(0);
  });
});
