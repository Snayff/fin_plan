import { describe, it, expect, beforeEach } from 'bun:test';
import { setAuthenticated } from '../test/helpers/auth';
import { goalService } from './goal.service';

beforeEach(() => setAuthenticated());

describe('goalService.getGoals', () => {
  it('returns goals list from GET /api/goals', async () => {
    const result = await goalService.getGoals();
    expect(result.goals).toHaveLength(1);
    expect(result.goals[0].id).toBe('goal-1');
  });
});

describe('goalService.createGoal', () => {
  it('sends POST to /api/goals and returns created goal', async () => {
    const result = await goalService.createGoal({
      name: 'Emergency Fund',
      type: 'savings',
      targetAmount: 10000,
      priority: 'medium',
    });
    expect(result.goal.id).toBe('goal-1');
  });
});

describe('goalService.deleteGoal', () => {
  it('sends DELETE to /api/goals/:id and returns success message', async () => {
    const result = await goalService.deleteGoal('goal-1');
    expect(result.message).toBeTruthy();
  });
});
