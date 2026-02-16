import { beforeEach, describe, expect, it, mock } from 'bun:test';
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../test/helpers/render';
import type { Category, EnhancedBudget } from '../types';

const getBudgetByIdMock = mock<(id: string) => Promise<{ budget: EnhancedBudget }>>((id: string) =>
  Promise.resolve({
    budget: {
      id,
      userId: 'user-1',
      name: 'Default Budget',
      period: 'monthly',
      startDate: '2026-01-01T00:00:00.000Z',
      endDate: '2026-01-31T00:00:00.000Z',
      isActive: true,
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
const addBudgetItemMock = mock(() => Promise.resolve({ item: {} }));
const updateBudgetItemMock = mock(() => Promise.resolve({ item: {} }));
const deleteBudgetItemMock = mock(() => Promise.resolve({ message: 'ok' }));
const removeCategoryFromBudgetMock = mock(() => Promise.resolve({ message: 'ok' }));
const deleteBudgetMock = mock(() => Promise.resolve({ message: 'ok' }));

const getCategoriesMock = mock<() => Promise<{ categories: Category[] }>>(() => Promise.resolve({ categories: [] }));

const showSuccessMock = mock(() => {});
const showErrorMock = mock(() => {});

const navigateMock = mock(() => {});

mock.module('../services/budget.service', () => ({
  budgetService: {
    getBudgetById: getBudgetByIdMock,
    addBudgetItem: addBudgetItemMock,
    updateBudgetItem: updateBudgetItemMock,
    deleteBudgetItem: deleteBudgetItemMock,
    removeCategoryFromBudget: removeCategoryFromBudgetMock,
    deleteBudget: deleteBudgetMock,
  },
}));

mock.module('../services/category.service', () => ({
  categoryService: {
    getCategories: getCategoriesMock,
  },
}));

mock.module('../lib/toast', () => ({
  showSuccess: showSuccessMock,
  showError: showErrorMock,
}));

mock.module('react-router-dom', () => ({
  Link: ({ to, children, ...props }: any) => (
    <a href={typeof to === 'string' ? to : '#'} {...props}>
      {children}
    </a>
  ),
  useParams: () => ({ id: 'budget-1' }),
  useNavigate: () => navigateMock,
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

import BudgetDetailPage from './BudgetDetailPage';

function buildBudgetPayload() {
  return {
    budget: {
      id: 'budget-1',
      userId: 'user-1',
      name: 'Main Budget',
      period: 'monthly' as const,
      startDate: '2026-01-01T00:00:00.000Z',
      endDate: '2026-01-31T00:00:00.000Z',
      isActive: true,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      expectedIncome: 5000,
      totalAllocated: 2000,
      totalSpent: 800,
      totalRemaining: 1200,
      unallocated: 3000,
      categoryGroups: [
        {
          categoryId: 'cat-housing',
          categoryName: 'Housing',
          categoryColor: '#ff0000',
          categoryIcon: '🏠',
          allocated: 1500,
          spent: 1200,
          remaining: 300,
          percentUsed: 80,
          isOverBudget: false,
          items: [
            {
              id: 'item-rent',
              budgetId: 'budget-1',
              categoryId: 'cat-housing',
              allocatedAmount: 1500,
              carryover: false,
              rolloverAmount: null,
              notes: 'Rent',
              category: {
                id: 'cat-housing',
                name: 'Housing',
                color: '#ff0000',
                icon: '🏠',
              },
            },
          ],
        },
      ],
    },
  };
}

describe('BudgetDetailPage', () => {
  beforeEach(() => {
    getBudgetByIdMock.mockReset();
    addBudgetItemMock.mockReset();
    updateBudgetItemMock.mockReset();
    deleteBudgetItemMock.mockReset();
    removeCategoryFromBudgetMock.mockReset();
    deleteBudgetMock.mockReset();
    getCategoriesMock.mockReset();
    showSuccessMock.mockReset();
    showErrorMock.mockReset();
    navigateMock.mockReset();

    getBudgetByIdMock.mockResolvedValue(buildBudgetPayload());
    getCategoriesMock.mockResolvedValue({
      categories: [
        {
          id: 'cat-housing',
          userId: 'user-1',
          name: 'Housing',
          type: 'expense',
          parentCategoryId: null,
          color: '#ff0000',
          icon: '🏠',
          isSystemCategory: false,
          sortOrder: 0,
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
        {
          id: 'cat-food',
          userId: 'user-1',
          name: 'Food',
          type: 'expense',
          parentCategoryId: null,
          color: '#00ff00',
          icon: '🍽️',
          isSystemCategory: false,
          sortOrder: 1,
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
        {
          id: 'cat-income',
          userId: 'user-1',
          name: 'Salary',
          type: 'income',
          parentCategoryId: null,
          color: '#0000ff',
          icon: '💼',
          isSystemCategory: false,
          sortOrder: 2,
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
      ],
    });
  });

  it('renders budget summary and category groups', async () => {
    renderWithProviders(<BudgetDetailPage />, { initialEntries: ['/budget/budget-1'] });

    await waitFor(() => {
      expect(screen.getByText('Main Budget')).toBeTruthy();
    });

    expect(getBudgetByIdMock).toHaveBeenCalledWith('budget-1');
    expect(screen.getByText('Expected Income')).toBeTruthy();
    expect(screen.getByText('Total Allocated')).toBeTruthy();
    expect(screen.getByText('Total Spent')).toBeTruthy();
    expect(screen.getByText('Remaining')).toBeTruthy();
    expect(screen.getByText('Unallocated')).toBeTruthy();

    expect(screen.getByText('Category Groups')).toBeTruthy();
    expect(screen.getByText('Housing')).toBeTruthy();
    expect(screen.getByText('Rent')).toBeTruthy();

    expect(screen.getByText('Available Categories')).toBeTruthy();
    expect(screen.getByText('Food')).toBeTruthy();
    expect(screen.queryByText('Salary')).toBeNull();
  });

  it('adds a new item inline for an existing category', async () => {
    const user = userEvent.setup();

    renderWithProviders(<BudgetDetailPage />, { initialEntries: ['/budget/budget-1'] });

    await waitFor(() => {
      expect(screen.getByText('Housing')).toBeTruthy();
    });

    await user.click(screen.getByRole('button', { name: /\+ add item/i }));

    const amountInput = screen.getByPlaceholderText('0.00') as HTMLInputElement;
    const descriptionInput = screen.getByPlaceholderText('Description') as HTMLInputElement;

    fireEvent.change(descriptionInput, { target: { value: 'Utilities' } });
    fireEvent.change(amountInput, { target: { value: '250' } });

    const addButtons = screen.getAllByRole('button', { name: /^add$/i });
    await user.click(addButtons[0]!);

    await waitFor(() => {
      expect(addBudgetItemMock).toHaveBeenCalledWith('budget-1', {
        categoryId: 'cat-housing',
        allocatedAmount: 250,
        notes: 'Utilities',
      });
      expect(showSuccessMock).toHaveBeenCalledWith('Budget item added successfully!');
    });
  });

  it('edits and updates an existing budget item inline', async () => {
    const user = userEvent.setup();

    renderWithProviders(<BudgetDetailPage />, { initialEntries: ['/budget/budget-1'] });

    await waitFor(() => {
      expect(screen.getByText('Rent')).toBeTruthy();
    });

    await user.click(screen.getByRole('button', { name: /^edit$/i }));

    const amountInput = screen.getByDisplayValue('1500') as HTMLInputElement;
    const notesInput = screen.getByDisplayValue('Rent') as HTMLInputElement;

    fireEvent.change(notesInput, { target: { value: 'Rent Updated' } });
    fireEvent.change(amountInput, { target: { value: '1600' } });

    await user.click(screen.getByRole('button', { name: /^save$/i }));

    await waitFor(() => {
      expect(updateBudgetItemMock).toHaveBeenCalledWith('budget-1', 'item-rent', {
        allocatedAmount: 1600,
        notes: 'Rent Updated',
      });
      expect(showSuccessMock).toHaveBeenCalledWith('Budget item updated successfully!');
    });
  });

  it('deletes an item, removes a category, and deletes budget from header action', async () => {
    const user = userEvent.setup();

    renderWithProviders(<BudgetDetailPage />, { initialEntries: ['/budget/budget-1'] });

    await waitFor(() => {
      expect(screen.getByText('Housing')).toBeTruthy();
    });

    const deleteButtons = screen.getAllByRole('button', { name: /^delete$/i });
    await user.click(deleteButtons[0]!);

    await waitFor(() => {
      expect(deleteBudgetItemMock).toHaveBeenCalledWith('budget-1', 'item-rent');
      expect(showSuccessMock).toHaveBeenCalledWith('Budget item deleted successfully!');
    });

    await user.click(screen.getByRole('button', { name: /remove category/i }));

    await waitFor(() => {
      expect(removeCategoryFromBudgetMock).toHaveBeenCalledWith('budget-1', 'cat-housing');
      expect(showSuccessMock).toHaveBeenCalledWith('Category removed from budget successfully!');
    });

    await user.click(screen.getByRole('button', { name: /delete budget/i }));
    await waitFor(() => {
      expect(screen.getByTestId('mock-confirm-dialog')).toBeTruthy();
    });

    const confirmDialog = screen.getByTestId('mock-confirm-dialog');
    await user.click(within(confirmDialog).getByRole('button', { name: /^delete$/i }));

    await waitFor(() => {
      expect(deleteBudgetMock).toHaveBeenCalledWith('budget-1');
      expect(showSuccessMock).toHaveBeenCalledWith('Budget deleted successfully!');
      expect(navigateMock).toHaveBeenCalledWith('/budget');
    });
  });
});
