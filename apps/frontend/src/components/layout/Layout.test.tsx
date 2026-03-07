import { beforeEach, describe, expect, it } from 'bun:test';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { useLocation } from 'react-router-dom';
import { renderWithProviders } from '../../test/helpers/render';
import { mockUser, setAuthenticated } from '../../test/helpers/auth';
import { server } from '../../test/msw/server';
import Layout from './Layout';

const baseUser = {
  ...mockUser,
  activeHouseholdId: 'household-1',
} as any;

function mockHouseholds() {
  server.use(
    http.get('/api/households', () =>
      HttpResponse.json({
        households: [
          {
            householdId: 'household-1',
            userId: baseUser.id,
            role: 'owner',
            joinedAt: '2025-01-01T00:00:00Z',
            household: {
              id: 'household-1',
              name: 'Home Base',
              createdAt: '2025-01-01T00:00:00Z',
              updatedAt: '2025-01-01T00:00:00Z',
              _count: { members: 2 },
            },
          },
        ],
      })
    )
  );
}

function PathProbe() {
  const location = useLocation();
  return <div data-testid="path">{location.pathname}</div>;
}

describe('Layout', () => {
  beforeEach(() => {
    setAuthenticated(baseUser, 'mock-access-token');
    mockHouseholds();
  });

  it('opens user menu and navigates to /profile from View Profile', async () => {
    const user = userEvent.setup();

    renderWithProviders(
      <Layout>
        <PathProbe />
      </Layout>,
      { initialEntries: ['/dashboard'] }
    );

    await user.click(await screen.findByRole('button', { name: /test user/i }));
    await user.click(await screen.findByRole('button', { name: /view profile/i }));

    await waitFor(() => {
      expect(screen.getByTestId('path').textContent).toBe('/profile');
    });
  });

  it('shows Create household action and no Household settings action in switcher', async () => {
    const user = userEvent.setup();

    renderWithProviders(
      <Layout>
        <PathProbe />
      </Layout>,
      { initialEntries: ['/dashboard'] }
    );

    await user.click(await screen.findByRole('button', { name: /home base/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /create household/i })).toBeTruthy();
      expect(screen.queryByRole('button', { name: /household settings/i })).toBeNull();
    });
  });
});
