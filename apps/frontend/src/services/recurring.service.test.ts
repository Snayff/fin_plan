import { describe, it, expect, beforeEach } from 'bun:test';
import { http, HttpResponse } from 'msw';
import { server } from '../test/msw/server';
import { setAuthenticated } from '../test/helpers/auth';
import { mockRecurringRule } from '../test/msw/handlers';
import { recurringService } from './recurring.service';

// Ensures authStore.user is non-null so handleTokenRefresh takes the
// updateAccessToken path rather than the cold-start getCurrentUser path,
// which would deadlock when /api/auth/me is overridden to return 401.
beforeEach(() => setAuthenticated());

// ─── getRecurringRules ────────────────────────────────────────────────────────

describe('recurringService.getRecurringRules', () => {
  it('returns list of recurring rules', async () => {
    const result = await recurringService.getRecurringRules();
    expect(result.recurringRules).toHaveLength(1);
    expect(result.recurringRules[0].id).toBe(mockRecurringRule.id);
    expect(result.recurringRules[0].frequency).toBe('monthly');
  });

  it('throws on 401 when unauthenticated', async () => {
    server.use(
      http.get('/api/recurring-rules', () =>
        HttpResponse.json({ error: { code: 'AUTHENTICATION_ERROR' } }, { status: 401 })
      ),
      http.post('/api/auth/refresh', () =>
        HttpResponse.json({ error: { code: 'AUTHENTICATION_ERROR' } }, { status: 401 })
      )
    );
    await expect(recurringService.getRecurringRules()).rejects.toMatchObject({ statusCode: 401 });
  });
});

// ─── getRecurringRule ─────────────────────────────────────────────────────────

describe('recurringService.getRecurringRule', () => {
  it('returns a single recurring rule by id', async () => {
    const result = await recurringService.getRecurringRule('rule-1');
    expect(result.recurringRule.id).toBe(mockRecurringRule.id);
  });
});

// ─── createRecurringRule ──────────────────────────────────────────────────────

describe('recurringService.createRecurringRule', () => {
  it('creates and returns a new recurring rule', async () => {
    const result = await recurringService.createRecurringRule({
      frequency: 'monthly',
      interval: 1,
      startDate: '2025-01-01',
      templateTransaction: {
        accountId: 'acc-1',
        amount: 500,
        type: 'expense',
        categoryId: 'cat-1',
        name: 'Monthly Rent',
      },
    });
    expect(result.recurringRule.id).toBe(mockRecurringRule.id);
    expect(result.recurringRule.frequency).toBe('monthly');
  });
});

// ─── updateRecurringRule ──────────────────────────────────────────────────────

describe('recurringService.updateRecurringRule', () => {
  it('updates and returns the recurring rule', async () => {
    const result = await recurringService.updateRecurringRule('rule-1', { interval: 2 });
    expect(result.recurringRule.id).toBe(mockRecurringRule.id);
  });
});

// ─── deleteRecurringRule ──────────────────────────────────────────────────────

describe('recurringService.deleteRecurringRule', () => {
  it('returns a success message on deletion', async () => {
    const result = await recurringService.deleteRecurringRule('rule-1');
    expect(result.message).toBe('Recurring rule deleted');
  });
});

// ─── previewOccurrences ───────────────────────────────────────────────────────

describe('recurringService.previewOccurrences', () => {
  it('returns an array of occurrence date strings', async () => {
    const result = await recurringService.previewOccurrences({
      frequency: 'monthly',
      interval: 1,
      startDate: '2025-01-01',
    });
    expect(Array.isArray(result.occurrences)).toBe(true);
    expect(result.occurrences).toHaveLength(3);
  });
});

// ─── materializeAll ───────────────────────────────────────────────────────────

describe('recurringService.materializeAll', () => {
  it('returns a message and count of materialized transactions', async () => {
    const result = await recurringService.materializeAll();
    expect(result.count).toBe(3);
    expect(typeof result.message).toBe('string');
  });
});
