import { beforeEach, describe, expect, it, mock } from 'bun:test';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../test/helpers/render';

const getAllTransactionsMock = mock<(limit?: number) => Promise<any>>(() =>
  Promise.resolve({
    transactions: [],
    pagination: {
      total: 0,
      limit: 1000,
      offset: 0,
      hasMore: false,
    },
  })
);

const getAccountsMock = mock<() => Promise<any>>(() =>
  Promise.resolve({
    accounts: [],
  })
);

const getCategoriesMock = mock<() => Promise<any>>(() =>
  Promise.resolve({
    categories: [],
  })
);

const deleteTransactionMock = mock<(id: string) => Promise<any>>(() =>
  Promise.resolve({ message: 'ok' })
);

mock.module('../services/transaction.service', () => ({
  transactionService: {
    getAllTransactions: getAllTransactionsMock,
    deleteTransaction: deleteTransactionMock,
  },
}));

mock.module('../services/account.service', () => ({
  accountService: {
    getAccounts: getAccountsMock,
  },
}));

mock.module('../services/category.service', () => ({
  categoryService: {
    getCategories: getCategoriesMock,
  },
}));

mock.module('../lib/toast', () => ({
  showSuccess: mock(() => {}),
  showError: mock(() => {}),
}));

import TransactionsPage from './TransactionsPage';

describe('TransactionsPage', () => {
  beforeEach(() => {
    getAllTransactionsMock.mockReset();
    getAccountsMock.mockReset();
    getCategoriesMock.mockReset();
    deleteTransactionMock.mockReset();

    getAccountsMock.mockResolvedValue({ accounts: [] });
    getCategoriesMock.mockResolvedValue({ categories: [] });
    deleteTransactionMock.mockResolvedValue({ message: 'ok' });
  });

  it('shows an error state and recovers when retry is clicked', async () => {
    const user = userEvent.setup();

    getAllTransactionsMock
      .mockRejectedValueOnce({
        message: 'Invalid data provided. Please check your input and try again.',
        statusCode: 400,
      })
      .mockResolvedValueOnce({
        transactions: [
          {
            id: 'tx-1',
            userId: 'user-1',
            accountId: 'acc-1',
            categoryId: null,
            subcategoryId: null,
            liabilityId: null,
            date: '2026-02-16T00:00:00.000Z',
            amount: 120,
            type: 'expense',
            name: 'Groceries',
            description: null,
            memo: null,
            tags: [],
            isRecurring: false,
            recurringRuleId: null,
            recurrence: 'none',
            recurrence_end_date: null,
            metadata: {},
            createdAt: '2026-02-16T00:00:00.000Z',
            updatedAt: '2026-02-16T00:00:00.000Z',
            account: {
              id: 'acc-1',
              name: 'Main Account',
              type: 'current',
            },
            category: null,
            subcategory: null,
          },
        ],
        pagination: {
          total: 1,
          limit: 1000,
          offset: 0,
          hasMore: false,
        },
      });

    renderWithProviders(<TransactionsPage />);

    await waitFor(() => {
      expect(screen.getByText('Unable to load transactions right now.')).toBeTruthy();
    });

    // Should not auto-retry on 4xx.
    expect(getAllTransactionsMock).toHaveBeenCalledTimes(1);
    expect(getAllTransactionsMock).toHaveBeenCalledWith(1000);

    await user.click(screen.getByRole('button', { name: /retry/i }));

    await waitFor(() => {
      expect(getAllTransactionsMock).toHaveBeenCalledTimes(2);
      expect(screen.getByText('Groceries')).toBeTruthy();
    });
  });
});
