import { beforeEach, describe, expect, it, mock } from 'bun:test';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../test/helpers/render';

const ACCOUNT_ID = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

const getAccountsMock = mock(() =>
  Promise.resolve({
    accounts: [
      {
        id: ACCOUNT_ID,
        name: 'Current Account',
        type: 'checking',
        balance: 1000,
        currency: 'GBP',
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
      },
    ],
  })
);

const getCategoriesMock = mock(() =>
  Promise.resolve({ categories: [] })
);

const createRecurringRuleMock = mock(() =>
  Promise.resolve({ recurringRule: { id: 'rule-1' } })
);

const updateRecurringRuleMock = mock(() =>
  Promise.resolve({ recurringRule: { id: 'rule-1' } })
);

const previewOccurrencesMock = mock(() =>
  Promise.resolve({ occurrences: [] })
);

const showSuccessMock = mock(() => {});
const showErrorMock = mock(() => {});

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

mock.module('../../services/recurring.service', () => ({
  recurringService: {
    createRecurringRule: createRecurringRuleMock,
    updateRecurringRule: updateRecurringRuleMock,
    previewOccurrences: previewOccurrencesMock,
  },
}));

mock.module('../../lib/toast', () => ({
  showSuccess: showSuccessMock,
  showError: showErrorMock,
}));

import RecurringRuleForm from './RecurringRuleForm';

describe('RecurringRuleForm', () => {
  beforeEach(() => {
    getAccountsMock.mockReset();
    getCategoriesMock.mockReset();
    createRecurringRuleMock.mockReset();
    updateRecurringRuleMock.mockReset();
    previewOccurrencesMock.mockReset();
    showSuccessMock.mockReset();
    showErrorMock.mockReset();

    getAccountsMock.mockResolvedValue({
      accounts: [
        {
          id: ACCOUNT_ID,
          name: 'Current Account',
          type: 'checking',
          balance: 1000,
          currency: 'GBP',
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z',
        },
      ],
    });
    getCategoriesMock.mockResolvedValue({ categories: [] });
    createRecurringRuleMock.mockResolvedValue({ recurringRule: { id: 'rule-1' } });
    updateRecurringRuleMock.mockResolvedValue({ recurringRule: { id: 'rule-1' } });
    previewOccurrencesMock.mockResolvedValue({ occurrences: [] });
  });

  it('shows toast error when submitting with no name', async () => {
    renderWithProviders(<RecurringRuleForm />);

    // Wait for accounts to load (form is hidden until accounts are available)
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /create recurring rule/i })).toBeTruthy();
    });

    // Clear name, set valid amount
    fireEvent.change(screen.getByLabelText(/transaction name/i), { target: { value: '' } });
    fireEvent.change(screen.getByLabelText(/amount/i), { target: { value: '50' } });

    // Use fireEvent.submit to bypass HTML5 required validation
    fireEvent.submit(screen.getByRole('button', { name: /create recurring rule/i }).closest('form')!);

    expect(showErrorMock).toHaveBeenCalledWith('Please fix the errors below.');
    expect(createRecurringRuleMock).not.toHaveBeenCalled();
  });

  it('shows toast error when submitting with zero amount', async () => {
    renderWithProviders(<RecurringRuleForm />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /create recurring rule/i })).toBeTruthy();
    });

    fireEvent.change(screen.getByLabelText(/transaction name/i), { target: { value: 'Rent' } });
    // Leave amount at 0 (default)

    fireEvent.submit(screen.getByRole('button', { name: /create recurring rule/i }).closest('form')!);

    expect(showErrorMock).toHaveBeenCalledWith('Please fix the errors below.');
    expect(createRecurringRuleMock).not.toHaveBeenCalled();
  });

  it('shows toast error when endDate is before startDate', async () => {
    renderWithProviders(<RecurringRuleForm />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /create recurring rule/i })).toBeTruthy();
    });

    fireEvent.change(screen.getByLabelText(/transaction name/i), { target: { value: 'Rent' } });
    fireEvent.change(screen.getByLabelText(/amount/i), { target: { value: '500' } });
    fireEvent.change(screen.getByLabelText(/start date/i), { target: { value: '2026-06-01' } });
    fireEvent.change(screen.getByLabelText(/end date/i), { target: { value: '2026-01-01' } });

    fireEvent.submit(screen.getByRole('button', { name: /create recurring rule/i }).closest('form')!);

    expect(showErrorMock).toHaveBeenCalledWith('Please fix the errors below.');
    expect(createRecurringRuleMock).not.toHaveBeenCalled();
  });

  it('submits valid create payload and calls showSuccess', async () => {
    const onSuccess = mock(() => {});
    renderWithProviders(<RecurringRuleForm onSuccess={onSuccess} />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /create recurring rule/i })).toBeTruthy();
    });

    fireEvent.change(screen.getByLabelText(/transaction name/i), { target: { value: 'Monthly Rent' } });
    fireEvent.change(screen.getByLabelText(/amount/i), { target: { value: '1200' } });
    fireEvent.change(screen.getByLabelText(/account/i), { target: { value: ACCOUNT_ID } });
    fireEvent.change(screen.getByLabelText(/start date/i), { target: { value: '2026-04-01' } });

    fireEvent.submit(screen.getByRole('button', { name: /create recurring rule/i }).closest('form')!);

    await waitFor(() => {
      expect(createRecurringRuleMock).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(showSuccessMock).toHaveBeenCalledWith('Recurring rule created!');
      expect(onSuccess).toHaveBeenCalled();
    });
  });

  it('does not call showError on successful submission', async () => {
    renderWithProviders(<RecurringRuleForm />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /create recurring rule/i })).toBeTruthy();
    });

    fireEvent.change(screen.getByLabelText(/transaction name/i), { target: { value: 'Salary' } });
    fireEvent.change(screen.getByLabelText(/amount/i), { target: { value: '3000' } });
    fireEvent.change(screen.getByLabelText(/account/i), { target: { value: ACCOUNT_ID } });
    fireEvent.change(screen.getByLabelText(/start date/i), { target: { value: '2026-04-01' } });

    fireEvent.submit(screen.getByRole('button', { name: /create recurring rule/i }).closest('form')!);

    await waitFor(() => {
      expect(createRecurringRuleMock).toHaveBeenCalled();
    });

    expect(showErrorMock).not.toHaveBeenCalledWith('Please fix the errors below.');
  });
});
