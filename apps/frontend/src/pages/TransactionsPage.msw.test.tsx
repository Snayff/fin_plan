// MSW-based tests for TransactionsPage — no mock.module() calls.
import { describe, it, expect, beforeEach } from 'bun:test';
import { screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import userEvent from '@testing-library/user-event';
import { server } from '../test/msw/server';
import { setAuthenticated } from '../test/helpers/auth';
import { renderWithProviders } from '../test/helpers/render';
import { mockTransaction } from '../test/msw/handlers';
import TransactionsPage from './TransactionsPage';

describe('TransactionsPage (MSW)', () => {
  beforeEach(() => {
    setAuthenticated();
  });

  it('renders the Transactions heading', async () => {
    renderWithProviders(<TransactionsPage />);
    await waitFor(() => {
      expect(screen.getByText('Transactions')).toBeTruthy();
    });
  });

  it('renders transaction name from MSW handler', async () => {
    renderWithProviders(<TransactionsPage />);
    await waitFor(() => {
      expect(screen.getByText(mockTransaction.name)).toBeTruthy();
    });
  });

  it('renders the Add Transaction button', async () => {
    renderWithProviders(<TransactionsPage />);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /add transaction/i })).toBeTruthy();
    });
  });

  it('shows error state and recovers when Retry is clicked', async () => {
    const user = userEvent.setup();
    let callCount = 0;
    server.use(
      http.get('/api/transactions', () => {
        callCount++;
        if (callCount === 1) {
          return HttpResponse.json(
            { error: { code: 'VALIDATION_ERROR', message: 'Invalid data provided. Please check your input and try again.' } },
            { status: 400 }
          );
        }
        return HttpResponse.json({
          transactions: [{ ...mockTransaction, name: 'Groceries' }],
          pagination: { total: 1, limit: 1000, offset: 0, hasMore: false },
        });
      })
    );

    renderWithProviders(<TransactionsPage />);

    await waitFor(() => {
      expect(screen.getByText('Unable to load transactions right now.')).toBeTruthy();
    });
    // 4xx — no auto-retry
    expect(callCount).toBe(1);

    await user.click(screen.getByRole('button', { name: /retry/i }));

    await waitFor(() => {
      expect(screen.getByText('Groceries')).toBeTruthy();
    });
    expect(callCount).toBe(2);
  });
});
