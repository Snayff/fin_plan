import { beforeEach, describe, expect, it, mock } from 'bun:test';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../test/helpers/render';

const createBudgetMock = mock(() => Promise.resolve({ budget: {} }));
const updateBudgetMock = mock(() => Promise.resolve({ budget: {} }));

const showSuccessMock = mock(() => {});
const showErrorMock = mock(() => {});

mock.module('../../services/budget.service', () => ({
  budgetService: {
    createBudget: createBudgetMock,
    updateBudget: updateBudgetMock,
  },
}));

mock.module('../../lib/toast', () => ({
  showSuccess: showSuccessMock,
  showError: showErrorMock,
}));

import BudgetForm from './BudgetForm';

describe('BudgetForm', () => {
  beforeEach(() => {
    createBudgetMock.mockReset();
    updateBudgetMock.mockReset();
    showSuccessMock.mockReset();
    showErrorMock.mockReset();

    createBudgetMock.mockResolvedValue({ budget: { id: 'budget-1' } });
    updateBudgetMock.mockResolvedValue({ budget: { id: 'budget-1' } });
  });

  it('auto-calculates end date when start date/period changes for non-custom periods', () => {
    renderWithProviders(<BudgetForm />);

    const startDateInput = screen.getByLabelText(/start date/i) as HTMLInputElement;
    const endDateInput = screen.getByLabelText(/end date/i) as HTMLInputElement;
    const periodSelect = screen.getByLabelText(/period/i) as HTMLSelectElement;

    fireEvent.change(startDateInput, { target: { value: '2026-01-01' } });
    expect(endDateInput.value).toBe('2026-01-31');

    fireEvent.change(periodSelect, { target: { value: 'quarterly' } });
    expect(endDateInput.value).toBe('2026-03-31');

    fireEvent.change(periodSelect, { target: { value: 'annual' } });
    expect(endDateInput.value).toBe('2026-12-31');

    fireEvent.change(periodSelect, { target: { value: 'custom' } });
    expect(endDateInput.disabled).toBe(false);
  });

  it('submits create payload and calls onSuccess in create mode', async () => {
    const user = userEvent.setup();
    const onSuccess = mock(() => {});

    renderWithProviders(<BudgetForm onSuccess={onSuccess} />);

    fireEvent.change(screen.getByLabelText(/budget name/i), { target: { value: '  January Budget  ' } });
    fireEvent.change(screen.getByLabelText(/start date/i), { target: { value: '2026-01-01' } });

    await user.click(screen.getByRole('button', { name: /create budget/i }));

    await waitFor(() => {
      expect(createBudgetMock).toHaveBeenCalledWith({
        name: 'January Budget',
        period: 'monthly',
        startDate: '2026-01-01',
        endDate: '2026-01-31',
      });
    });

    await waitFor(() => {
      expect(showSuccessMock).toHaveBeenCalledWith('Budget created successfully!');
      expect(onSuccess).toHaveBeenCalled();
    });
  });

  it('pre-populates and submits update payload in edit mode', async () => {
    const user = userEvent.setup();

    renderWithProviders(
      <BudgetForm
        budget={{
          id: 'budget-123',
          name: 'Existing Budget',
          period: 'custom',
          startDate: '2026-02-01T00:00:00.000Z',
          endDate: '2026-02-28T00:00:00.000Z',
        }}
      />
    );

    expect((screen.getByLabelText(/budget name/i) as HTMLInputElement).value).toBe('Existing Budget');
    expect((screen.getByLabelText(/start date/i) as HTMLInputElement).value).toBe('2026-02-01');
    expect((screen.getByLabelText(/end date/i) as HTMLInputElement).value).toBe('2026-02-28');

    fireEvent.change(screen.getByLabelText(/budget name/i), { target: { value: 'Updated Budget' } });

    await user.click(screen.getByRole('button', { name: /update budget/i }));

    await waitFor(() => {
      expect(updateBudgetMock).toHaveBeenCalledWith('budget-123', {
        name: 'Updated Budget',
        period: 'custom',
        startDate: '2026-02-01',
        endDate: '2026-02-28',
      });
    });

    await waitFor(() => {
      expect(showSuccessMock).toHaveBeenCalledWith('Budget updated successfully!');
    });
  });
});
