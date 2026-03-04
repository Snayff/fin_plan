// MSW-based tests for LiabilitiesPage — no mock.module() calls.
import { describe, it, expect, beforeEach } from 'bun:test';
import { screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { setAuthenticated } from '../test/helpers/auth';
import { renderWithProviders } from '../test/helpers/render';
import { server } from '../test/msw/server';
import { mockLiability } from '../test/msw/handlers';
import type { EnhancedLiability } from '../types';
import LiabilitiesPage from './LiabilitiesPage';

// Full EnhancedLiability fixture with the extra fields the page requires.
const mockEnhancedLiability: EnhancedLiability = {
  ...mockLiability,
  transactions: [],
  monthsRemaining: 360,
  projectedBalanceAtTermEnd: 0,
  projectedInterestAccrued: 50000,
  projectedTransactionImpact: 0,
  projectionSchedule: [],
};

describe('LiabilitiesPage (MSW)', () => {
  beforeEach(() => {
    setAuthenticated();
    server.use(
      http.get('/api/liabilities', () =>
        HttpResponse.json({ liabilities: [mockEnhancedLiability] })
      )
    );
  });

  it('renders the Liabilities heading', async () => {
    renderWithProviders(<LiabilitiesPage />);
    await waitFor(() => {
      expect(screen.getByText('Liabilities')).toBeTruthy();
    });
  });

  it('renders liability name from MSW handler', async () => {
    renderWithProviders(<LiabilitiesPage />);
    await waitFor(() => {
      // The name appears in both the card heading and the summary "Highest Rate" label.
      const elements = screen.getAllByText(mockLiability.name);
      expect(elements).toHaveLength(2);
    });
  });

  it('renders the Add Liability button', async () => {
    renderWithProviders(<LiabilitiesPage />);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /add liability/i })).toBeTruthy();
    });
  });
});
