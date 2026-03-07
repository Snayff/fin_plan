// MSW-based tests for ProfilePage — no mock.module() calls.
import { describe, it, expect, beforeEach } from 'bun:test';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { setAuthenticated, mockUser } from '../test/helpers/auth';
import { renderWithProviders } from '../test/helpers/render';
import ProfilePage from './ProfilePage';

describe('ProfilePage (MSW)', () => {
  beforeEach(() => {
    setAuthenticated();
  });

  it('renders the Profile heading', async () => {
    renderWithProviders(<ProfilePage />);
    await waitFor(() => {
      expect(screen.getByText('Profile')).toBeTruthy();
    });
  });

  it('renders the Account and Household tabs', async () => {
    renderWithProviders(<ProfilePage />);
    await waitFor(() => {
      expect(screen.getByRole('tab', { name: /account/i })).toBeTruthy();
      expect(screen.getByRole('tab', { name: /household/i })).toBeTruthy();
    });
  });

  it('shows the Your Name card on the Account tab by default', async () => {
    renderWithProviders(<ProfilePage />);
    await waitFor(() => {
      expect(screen.getByText('Your Name')).toBeTruthy();
    });
  });

  it('pre-fills the name field with the authenticated user name', async () => {
    renderWithProviders(<ProfilePage />);
    await waitFor(() => {
      const input = screen.getByLabelText(/display name/i) as HTMLInputElement;
      expect(input.value).toBe('Test User');
    });
  });
});

describe('ProfilePage — Household tab layout', () => {
  beforeEach(() => {
    setAuthenticated({ ...mockUser, activeHouseholdId: 'household-1' } as any);
  });

  it('shows "Create New Household" as the first card on the Household tab', async () => {
    renderWithProviders(<ProfilePage />);
    const householdTab = screen.getByRole('tab', { name: /household/i });
    await userEvent.click(householdTab);

    await waitFor(() => {
      expect(screen.getByText('Create New Household')).toBeTruthy();
    });

    // Create New Household title must appear before Household card title in DOM
    // CardTitle renders as a div in this shadcn/ui setup (not h3)
    // Query within the tabpanel to avoid matching the "Household" tab button
    const tabPanel = screen.getByRole('tabpanel', { name: /household/i });
    const allNodes = Array.from(tabPanel.querySelectorAll('*'));
    const createEl = screen.getByText('Create New Household');
    const householdCardTitle = Array.from(tabPanel.querySelectorAll('div'))
      .find((el) => el.textContent === 'Household');

    expect(householdCardTitle).toBeDefined();
    const createIdx = allNodes.indexOf(createEl);
    const householdIdx = allNodes.indexOf(householdCardTitle!);
    expect(createIdx).toBeLessThan(householdIdx);
  });
});
