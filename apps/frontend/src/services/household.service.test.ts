import { describe, it, expect, beforeEach } from 'bun:test';
import { setAuthenticated } from '../test/helpers/auth';
import { householdService } from './household.service';

beforeEach(() => setAuthenticated());

describe('householdService.getHouseholds', () => {
  it('returns households list from GET /api/households', async () => {
    const result = await householdService.getHouseholds();
    expect(result.households).toHaveLength(1);
    expect(result.households[0]!.household.id).toBe('household-1');
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

describe('householdService.inviteMember', () => {
  it('sends optional email and returns invite metadata', async () => {
    const result = await householdService.inviteMember('household-1', 'invitee@example.com');
    expect(result.token).toBe('mock-invite-token');
    expect(result.invitedEmail).toBe('invitee@example.com');
  });
});

describe('householdService.validateInvite', () => {
  it('returns masked invite metadata', async () => {
    const result = await householdService.validateInvite('invite-token');
    expect(result.householdName).toBe('My Household');
    expect(result.emailRequired).toBe(true);
    expect(result.maskedInvitedEmail).toBe('i******@example.com');
  });
});
