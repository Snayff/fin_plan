import { describe, it, expect, beforeEach } from 'bun:test';
import { setAuthenticated } from '../test/helpers/auth';
import { budgetService } from './budget.service';

beforeEach(() => setAuthenticated());

describe('budgetService.getBudgets', () => {
  it('returns budgets list from GET /api/budgets', async () => {
    const result = await budgetService.getBudgets();
    expect(result.budgets).toHaveLength(1);
    expect(result.budgets[0].id).toBe('budget-1');
  });
});

describe('budgetService.createBudget', () => {
  it('sends POST to /api/budgets and returns created budget', async () => {
    const result = await budgetService.createBudget({
      name: 'Monthly Budget',
      period: 'monthly',
      startDate: '2025-01-01T00:00:00Z',
      endDate: '2025-01-31T00:00:00Z',
    });
    expect(result.budget.id).toBe('budget-1');
  });
});

describe('budgetService.deleteBudget', () => {
  it('sends DELETE to /api/budgets/:id and returns success message', async () => {
    const result = await budgetService.deleteBudget('budget-1');
    expect(result.message).toBeTruthy();
  });
});
