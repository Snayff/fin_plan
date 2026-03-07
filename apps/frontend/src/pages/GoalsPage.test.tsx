// MSW-based tests for GoalsPage — no mock.module() calls.
import { describe, it, expect, beforeEach } from 'bun:test';
import { screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { setAuthenticated } from '../test/helpers/auth';
import { renderWithProviders } from '../test/helpers/render';
import { server } from '../test/msw/server';
import { mockGoal, mockEnhancedGoal } from '../test/msw/handlers';
import GoalsPage from './GoalsPage';

describe('GoalsPage (MSW)', () => {
  beforeEach(() => {
    setAuthenticated();
    server.use(
      http.get('/api/goals', () =>
        HttpResponse.json({ goals: [mockEnhancedGoal] })
      )
    );
  });

  it('renders the Goals heading', async () => {
    renderWithProviders(<GoalsPage />);
    await waitFor(() => {
      expect(screen.getByText('Goals')).toBeTruthy();
    });
  });

  it('renders goal name from MSW handler', async () => {
    renderWithProviders(<GoalsPage />);
    await waitFor(() => {
      expect(screen.getByText(mockGoal.name)).toBeTruthy();
    });
  });

  it('renders the Add Goal button', async () => {
    renderWithProviders(<GoalsPage />);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /add goal/i })).toBeTruthy();
    });
  });

  it('shows an error banner when the API returns 500', async () => {
    server.use(
      http.get('/api/goals', () =>
        HttpResponse.json(
          { error: { code: 'INTERNAL_SERVER_ERROR', message: 'Internal server error' } },
          { status: 500 }
        )
      )
    );
    renderWithProviders(<GoalsPage />);
    await waitFor(() => {
      expect(screen.getByText(/error loading goals/i)).toBeTruthy();
    });
  });
});
