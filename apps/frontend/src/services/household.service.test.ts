import { describe, it, expect, beforeEach } from 'bun:test';
import { setAuthenticated } from '../test/helpers/auth';
import { householdService } from './household.service';

beforeEach(() => setAuthenticated());

describe('householdService.getHouseholds', () => {
  it('returns households list from GET /api/households', async () => {
    const result = await householdService.getHouseholds();
    expect(result.households).toHaveLength(1);
    expect(result.households[0].household.id).toBe('household-1');
  });
});

describe('householdService.createHousehold', () => {
  it('sends POST to /api/households and returns created household', async () => {
    const result = await householdService.createHousehold('My Household');
    expect(result.household.id).toBe('household-1');
  });
});

describe('householdService.switchHousehold', () => {
  it('sends POST to /api/households/:id/switch and returns success', async () => {
    const result = await householdService.switchHousehold('household-1');
    expect(result.success).toBe(true);
  });
});
