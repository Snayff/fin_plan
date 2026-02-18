import { beforeEach, describe, expect, it, mock } from 'bun:test';
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../test/helpers/render';
import type { BudgetSummary, EnhancedBudget } from '../types';

const getBudgetsMock = mock<() => Promise<{ budgets: BudgetSummary[] }>>(() => Promise.resolve({ budgets: [] }));
const getBudgetByIdMock = mock<(id: string) => Promise<{ budget: EnhancedBudget }>>((id: string) =>
  Promise.resolve({
    budget: {
      id,
      userId: 'user-1',
      name: 'Default Budget',
      period: 'monthly',
      startDate: '2026-01-01T00:00:00.000Z',
      endDate: '2026-01-31T00:00:00.000Z',
      isActive: false,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      categoryGroups: [],
      expectedIncome: 0,
      totalAllocated: 0,
      totalSpent: 0,
      totalRemaining: 0,
      unallocated: 0,
    },
  })
);
const deleteBudgetMock = mock(() => Promise.resolve({ message: 'ok' }));

const showSuccessMock = mock(() => {});
const showErrorMock = mock(() => {});

mock.module('../services/budget.service', () => ({
  budgetService: {
    getBudgets: getBudgetsMock,
    getBudgetById: getBudgetByIdMock,
    deleteBudget: deleteBudgetMock,
  },
}));

mock.module('../lib/toast', () => ({
  showSuccess: showSuccessMock,
  showError: showErrorMock,
}));

mock.module('../components/ui/Modal', () => ({
  default: ({ isOpen, title }: any) =>
    isOpen ? (
      <div data-testid="mock-modal">
        <h2>{title}</h2>
      </div>
    ) : null,
}));

mock.module('../components/ui/ConfirmDialog', () => ({
  default: ({ isOpen, title, onConfirm, confirmText = 'Confirm' }: any) =>
    isOpen ? (
      <div data-testid="mock-confirm-dialog">
        <p>{title}</p>
        <button onClick={onConfirm}>{confirmText}</button>
      </div>
    ) : null,
}));

import BudgetsPage from './BudgetsPage';

describe('BudgetsPage', () => {
  beforeEach(() => {
    getBudgetsMock.mockReset();
    getBudgetByIdMock.mockReset();
    deleteBudgetMock.mockReset();
    showSuccessMock.mockReset();
    showErrorMock.mockReset();

    getBudgetsMock.mockResolvedValue({ budgets: [] });
    deleteBudgetMock.mockResolvedValue({ message: 'Budget deleted successfully' });
  });

  it('renders empty state and opens create modal', async () => {
    renderWithProviders(<BudgetsPage />);

    await waitFor(() => {
      expect(getBudgetsMock).toHaveBeenCalled();
    });

    expect(screen.getByText(/no budgets yet/i)).toBeTruthy();
    expect(screen.getByRole('button', { name: /create your first budget/i })).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: /create new budget/i }));
    expect(screen.getByText('Create Budget')).toBeTruthy();
  });

  it('renders budgets, active summary cards, and detail-driven spending', async () => {
    getBudgetsMock.mockResolvedValue({
      budgets: [
        {
          id: 'budget-1',
          name: 'Household Budget',
          period: 'monthly',
          startDate: '2026-01-01T00:00:00.000Z',
          endDate: '2026-01-31T00:00:00.000Z',
          isActive: true,
          totalAllocated: 2000,
          itemCount: 2,
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
        {
          id: 'budget-2',
          name: 'Travel Budget',
          period: 'custom',
          startDate: '2026-02-01T00:00:00.000Z',
          endDate: '2026-02-20T00:00:00.000Z',
          isActive: false,
          totalAllocated: 600,
          itemCount: 1,
          createdAt: '2026-02-01T00:00:00.000Z',
          updatedAt: '2026-02-01T00:00:00.000Z',
        },
      ],
    });

    getBudgetByIdMock.mockImplementation(async (id: string) => {
      if (id === 'budget-1') {
        return {
          budget: {
            id,
            userId: 'user-1',
            name: 'Household Budget',
            period: 'monthly',
            startDate: '2026-01-01T00:00:00.000Z',
            endDate: '2026-01-31T00:00:00.000Z',
            isActive: true,
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-01T00:00:00.000Z',
            categoryGroups: [],
            expectedIncome: 5000,
            totalAllocated: 2000,
            totalSpent: 640,
            totalRemaining: 1360,
            unallocated: 3000,
          },
        };
      }

      return {
        budget: {
          id,
          userId: 'user-1',
          name: 'Travel Budget',
          period: 'custom',
          startDate: '2026-02-01T00:00:00.000Z',
          endDate: '2026-02-20T00:00:00.000Z',
          isActive: false,
          createdAt: '2026-02-01T00:00:00.000Z',
          updatedAt: '2026-02-01T00:00:00.000Z',
          categoryGroups: [],
          expectedIncome: 0,
          totalAllocated: 600,
          totalSpent: 120,
          totalRemaining: 480,
          unallocated: -600,
        },
      };
    });

    renderWithProviders(<BudgetsPage />);

    await waitFor(() => {
      expect(screen.getByText('Household Budget')).toBeTruthy();
      expect(screen.getByText('Travel Budget')).toBeTruthy();
    });

    expect(getBudgetByIdMock).toHaveBeenCalledWith('budget-1');
    expect(getBudgetByIdMock).toHaveBeenCalledWith('budget-2');

    expect(screen.getByText('Total Allocated')).toBeTruthy();
    expect(screen.getByText('Total Spent')).toBeTruthy();
    expect(screen.getByText('Remaining')).toBeTruthy();
    expect(screen.getByText('£2,000')).toBeTruthy();
    expect(screen.getByText('£640')).toBeTruthy();
    expect(screen.getByText('£1,360')).toBeTruthy();

    expect(screen.getByText('Monthly')).toBeTruthy();
    expect(screen.getByText('Custom')).toBeTruthy();
    expect(screen.getByText('32.0% used')).toBeTruthy();
  });

  it('deletes a budget through confirm flow', async () => {
    const user = userEvent.setup();

    getBudgetsMock.mockResolvedValue({
      budgets: [
        {
          id: 'budget-1',
          name: 'Household Budget',
          period: 'monthly',
          startDate: '2026-01-01T00:00:00.000Z',
          endDate: '2026-01-31T00:00:00.000Z',
          isActive: true,
          totalAllocated: 2000,
          itemCount: 2,
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
      ],
    });

    getBudgetByIdMock.mockResolvedValue({
      budget: {
        id: 'budget-1',
        userId: 'user-1',
        name: 'Household Budget',
        period: 'monthly',
        startDate: '2026-01-01T00:00:00.000Z',
        endDate: '2026-01-31T00:00:00.000Z',
        isActive: true,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
        categoryGroups: [],
        expectedIncome: 5000,
        totalAllocated: 2000,
        totalSpent: 640,
        totalRemaining: 1360,
        unallocated: 3000,
      },
    });

    renderWithProviders(<BudgetsPage />);

    await waitFor(() => {
      expect(screen.getByText('Household Budget')).toBeTruthy();
    });

    await user.click(screen.getByRole('button', { name: /^delete$/i }));

    await waitFor(() => {
      expect(screen.getByTestId('mock-confirm-dialog')).toBeTruthy();
    });

    const confirmDialog = screen.getByTestId('mock-confirm-dialog');
    await user.click(within(confirmDialog).getByRole('button', { name: /^delete$/i }));

    await waitFor(() => {
      expect(deleteBudgetMock).toHaveBeenCalledWith('budget-1');
      expect(showSuccessMock).toHaveBeenCalledWith('Budget deleted successfully!');
    });
  });
});
