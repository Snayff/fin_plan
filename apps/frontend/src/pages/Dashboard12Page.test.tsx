import { beforeEach, describe, expect, it } from 'bun:test';
import { screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { renderWithProviders } from '../test/helpers/render';
import { setAuthenticated } from '../test/helpers/auth';
import { server } from '../test/msw/server';
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
});
