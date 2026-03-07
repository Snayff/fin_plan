// MSW-based tests for AccountsPage — no mock.module() calls.
import { describe, it, expect, beforeEach } from 'bun:test';
import { screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { setAuthenticated } from '../test/helpers/auth';
import { renderWithProviders } from '../test/helpers/render';
import { server } from '../test/msw/server';
import { mockAccount } from '../test/msw/handlers';
import type { EnhancedAccount } from '../types';
import AccountsPage from './AccountsPage';

// Enhanced fixture — extends mockAccount with the extra fields AccountsPage requires.
const mockEnhancedAccount: EnhancedAccount = {
  ...mockAccount,
  balanceHistory: [
    { date: '2025-01-01T00:00:00Z', balance: 900 },
    { date: '2025-01-15T00:00:00Z', balance: 1000 },
  ],
  monthlyFlow: { income: 500, expense: 200 },
};

describe('AccountsPage (MSW)', () => {
  beforeEach(() => {
    setAuthenticated();
    // Override the /api/accounts handler to return the enhanced fixture.
    server.use(
      http.get('/api/accounts', () =>
        HttpResponse.json({ accounts: [mockEnhancedAccount] })
      )
    );
  });

  it('renders the Accounts heading', async () => {
    renderWithProviders(<AccountsPage />);
    await waitFor(() => {
      expect(screen.getByText('Accounts')).toBeTruthy();
    });
  });

  it('renders account name from MSW handler', async () => {
    renderWithProviders(<AccountsPage />);
    await waitFor(() => {
      expect(screen.getByText(mockAccount.name)).toBeTruthy();
    });
  });

  it('renders the Add Account button', async () => {
    renderWithProviders(<AccountsPage />);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /add account/i })).toBeTruthy();
    });
  });

  it('shows an error banner when the API returns 401', async () => {
    // Override to return 401 for this test
    server.use(
      http.get('/api/accounts', () =>
        HttpResponse.json(
          { error: { code: 'AUTHENTICATION_ERROR', message: 'No authorization token provided' } },
          { status: 401 }
        )
      )
    );
    renderWithProviders(<AccountsPage />);
    await waitFor(() => {
      expect(screen.getByText(/error loading accounts/i)).toBeTruthy();
    });
  });
});
