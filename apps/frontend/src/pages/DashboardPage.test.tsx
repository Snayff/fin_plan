// MSW-based tests for DashboardPage — no mock.module() calls.
import { describe, it, expect, beforeEach } from 'bun:test';
import { screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { setAuthenticated } from '../test/helpers/auth';
import { renderWithProviders } from '../test/helpers/render';
import { server } from '../test/msw/server';
import { mockAccount } from '../test/msw/handlers';
import DashboardPage from './DashboardPage';

describe('DashboardPage (MSW)', () => {
  beforeEach(() => {
    setAuthenticated();
  });

  it('renders the Dashboard heading', async () => {
    renderWithProviders(<DashboardPage />);
    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeTruthy();
    });
  });

  it('renders the Net Worth summary card', async () => {
    renderWithProviders(<DashboardPage />);
    await waitFor(() => {
      expect(screen.getByText('Net Worth')).toBeTruthy();
    });
  });

  it('renders the Income summary card with data from MSW', async () => {
    renderWithProviders(<DashboardPage />);
    await waitFor(() => {
      expect(screen.getByText('Income')).toBeTruthy();
    });
  });

  it('renders the Expenses summary card', async () => {
    renderWithProviders(<DashboardPage />);
    await waitFor(() => {
      expect(screen.getByText('Expenses')).toBeTruthy();
    });
  });

  it('renders account name from MSW handler', async () => {
    renderWithProviders(<DashboardPage />);
    await waitFor(() => {
      expect(screen.getByText(mockAccount.name)).toBeTruthy();
    });
  });

  it('renders the Net Worth Trend chart section', async () => {
    renderWithProviders(<DashboardPage />);
    await waitFor(() => {
      expect(screen.getByText('Net Worth Trend')).toBeTruthy();
    });
  });

  it('renders the Income vs Expenses chart section', async () => {
    renderWithProviders(<DashboardPage />);
    await waitFor(() => {
      expect(screen.getByText('Income vs Expenses')).toBeTruthy();
    });
  });

  it('shows an error banner when the summary API returns 500', async () => {
    server.use(
      http.get('/api/dashboard/summary', () =>
        HttpResponse.json(
          { error: { code: 'INTERNAL_SERVER_ERROR', message: 'Internal server error' } },
          { status: 500 }
        )
      )
    );
    renderWithProviders(<DashboardPage />);
    await waitFor(() => {
      expect(screen.getByText(/error loading dashboard/i)).toBeTruthy();
    });
  });
});
