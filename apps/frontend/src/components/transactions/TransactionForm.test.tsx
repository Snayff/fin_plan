import { beforeEach, describe, expect, it, mock } from 'bun:test';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { renderWithProviders } from '../../test/helpers/render';

// Stable account UUID for valid schema parsing
const ACCOUNT_ID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

const getAccountsMock = mock(() =>
  Promise.resolve({
    accounts: [
      {
        id: ACCOUNT_ID,
        name: 'Current Account',
        type: 'current',
        balance: 1000,
        currency: 'GBP',
        isActive: true,
      },
    ],
  })
);

const getCategoriesMock = mock(() =>
  Promise.resolve({ categories: [] })
);

const getLiabilitiesMock = mock(() =>
  Promise.resolve({ liabilities: [] })
);

const createTransactionMock = mock(() =>
  Promise.resolve({ transaction: { id: 'tx-1' } })
);

const updateTransactionMock = mock(() =>
  Promise.resolve({ transaction: { id: 'tx-1' } })
);

const showSuccessMock = mock(() => {});
const showErrorMock = mock(() => {});

mock.module('../../services/transaction.service', () => ({
  transactionService: {
    createTransaction: createTransactionMock,
    updateTransaction: updateTransactionMock,
  },
}));

mock.module('../../services/account.service', () => ({
  accountService: {
    getAccounts: getAccountsMock,
  },
}));

mock.module('../../services/category.service', () => ({
  categoryService: {
    getCategories: getCategoriesMock,
  },
}));

mock.module('../../services/liability.service', () => ({
  liabilityService: {
    getLiabilities: getLiabilitiesMock,
  },
}));

mock.module('../../lib/toast', () => ({
  showSuccess: showSuccessMock,
  showError: showErrorMock,
}));

import TransactionForm from './TransactionForm';

function submitForm() {
  const form = document.querySelector('form')!;
  fireEvent.submit(form);
}

describe('TransactionForm', () => {
  beforeEach(() => {
    getAccountsMock.mockReset();
    getCategoriesMock.mockReset();
    getLiabilitiesMock.mockReset();
    createTransactionMock.mockReset();
    updateTransactionMock.mockReset();
    showSuccessMock.mockReset();
    showErrorMock.mockReset();

    getAccountsMock.mockResolvedValue({
      accounts: [
        {
          id: ACCOUNT_ID,
          name: 'Current Account',
          type: 'current',
          balance: 1000,
          currency: 'GBP',
          isActive: true,
        },
      ],
    });
    getCategoriesMock.mockResolvedValue({ categories: [] });
    getLiabilitiesMock.mockResolvedValue({ liabilities: [] });
    createTransactionMock.mockResolvedValue({ transaction: { id: 'tx-1' } });
    updateTransactionMock.mockResolvedValue({ transaction: { id: 'tx-1' } });
  });

  it('shows toast error and does not submit when name is empty', async () => {
    renderWithProviders(<TransactionForm />);

    // Wait for form to finish loading
    await waitFor(() => {
      expect(screen.queryByText(/loading form data/i)).toBeNull();
    });

    // Leave name empty, set valid amount
    fireEvent.change(screen.getByLabelText(/^name \*/i), { target: { value: '' } });
    fireEvent.change(screen.getByLabelText(/^amount \*/i), { target: { value: '50' } });

    submitForm();

    expect(showErrorMock).toHaveBeenCalledWith('Please fix the errors below.');
    expect(createTransactionMock).not.toHaveBeenCalled();
  });

  it('shows inline error for name field when name is empty', async () => {
    renderWithProviders(<TransactionForm />);

    await waitFor(() => {
      expect(screen.queryByText(/loading form data/i)).toBeNull();
    });

    fireEvent.change(screen.getByLabelText(/^name \*/i), { target: { value: '' } });
    fireEvent.change(screen.getByLabelText(/^amount \*/i), { target: { value: '50' } });

    submitForm();

    await waitFor(() => {
      expect(screen.getByText(/transaction name is required/i)).toBeDefined();
    });
  });

  it('shows toast error when amount is zero', async () => {
    renderWithProviders(<TransactionForm />);

    await waitFor(() => {
      expect(screen.queryByText(/loading form data/i)).toBeNull();
    });

    fireEvent.change(screen.getByLabelText(/^name \*/i), { target: { value: 'Grocery Shopping' } });
    // Set amount to 0 (invalid — schema requires positive)
    fireEvent.change(screen.getByLabelText(/^amount \*/i), { target: { value: '0' } });

    submitForm();

    expect(showErrorMock).toHaveBeenCalledWith('Please fix the errors below.');
    expect(createTransactionMock).not.toHaveBeenCalled();
  });

  it('submits successfully with valid data in create mode', async () => {
    const onSuccess = mock(() => {});
    renderWithProviders(<TransactionForm onSuccess={onSuccess} />);

    await waitFor(() => {
      expect(screen.queryByText(/loading form data/i)).toBeNull();
    });

    // Wait for account auto-select to happen
    await waitFor(() => {
      const accountSelect = screen.getByLabelText(/target account/i) as HTMLSelectElement;
      expect(accountSelect.value).toBe(ACCOUNT_ID);
    });

    fireEvent.change(screen.getByLabelText(/^name \*/i), { target: { value: 'Monthly Salary' } });
    fireEvent.change(screen.getByLabelText(/^amount \*/i), { target: { value: '2500' } });

    submitForm();

    await waitFor(() => {
      expect(createTransactionMock).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Monthly Salary',
          amount: 2500,
          accountId: ACCOUNT_ID,
        })
      );
    });

    await waitFor(() => {
      expect(showSuccessMock).toHaveBeenCalledWith('Transaction created!');
      expect(onSuccess).toHaveBeenCalled();
    });
  });
});
