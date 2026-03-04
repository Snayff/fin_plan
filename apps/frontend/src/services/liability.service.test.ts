import { describe, it, expect, beforeEach } from 'bun:test';
import { setAuthenticated } from '../test/helpers/auth';
import { liabilityService } from './liability.service';

beforeEach(() => setAuthenticated());

describe('liabilityService.getLiabilities', () => {
  it('returns liabilities list from GET /api/liabilities', async () => {
    const result = await liabilityService.getLiabilities();
    expect(result.liabilities).toHaveLength(1);
    expect(result.liabilities[0].id).toBe('liability-1');
  });
});

describe('liabilityService.createLiability', () => {
  it('sends POST to /api/liabilities and returns created liability', async () => {
    const result = await liabilityService.createLiability({
      name: 'Test Mortgage',
      type: 'mortgage',
      currentBalance: 200000,
      interestRate: 3.5,
      interestType: 'fixed',
      openDate: '2020-01-01T00:00:00Z',
      termEndDate: '2055-01-01T00:00:00Z',
    });
    expect(result.liability.id).toBe('liability-1');
  });
});

describe('liabilityService.deleteLiability', () => {
  it('sends DELETE to /api/liabilities/:id and returns success message', async () => {
    const result = await liabilityService.deleteLiability('liability-1');
    expect(result.message).toBe('Liability deleted');
  });
});
