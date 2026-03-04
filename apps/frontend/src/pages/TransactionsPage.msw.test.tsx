// NOTE: This file does NOT use mock.module() — it relies on MSW for HTTP interception.
// The existing TransactionsPage.test.tsx uses mock.module() which pollutes the module
// registry; keeping MSW-based tests in a separate file avoids that conflict.
import { describe, it, expect, beforeEach } from 'bun:test';
import { screen, waitFor } from '@testing-library/react';
import { setAuthenticated } from '../test/helpers/auth';
import { renderWithProviders } from '../test/helpers/render';
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
    // mockTransaction.name === 'Test Transaction'
    await waitFor(() => {
      expect(screen.getByText('Test Transaction')).toBeTruthy();
    });
  });

  it('renders the Add Transaction button', async () => {
    renderWithProviders(<TransactionsPage />);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /add transaction/i })).toBeTruthy();
    });
  });
});
