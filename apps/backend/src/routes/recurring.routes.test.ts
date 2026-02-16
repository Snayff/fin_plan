import { describe, it, expect, mock, beforeEach, beforeAll, afterAll } from 'bun:test';
import type { FastifyInstance } from 'fastify';
import { buildTestApp } from '../test/helpers/fastify';
import { errorHandler } from '../middleware/errorHandler';
import { AuthenticationError } from '../utils/errors';

mock.module('../services/recurring.service', () => ({
  recurringService: {
    getRecurringRules: mock(() => {}),
    getRecurringRuleById: mock(() => {}),
    createRecurringRule: mock(() => {}),
    updateRecurringRule: mock(() => {}),
    deleteRecurringRule: mock(() => {}),
    previewOccurrences: mock(() => {}),
    materializeAllToday: mock(() => {}),
  },
}));

mock.module('../services/audit.service', () => ({
  auditService: {
    log: mock(() => {}),
  },
}));

mock.module('../middleware/auth.middleware', () => ({
  authMiddleware: mock(() => {}),
}));

import { recurringService } from '../services/recurring.service';
import { authMiddleware } from '../middleware/auth.middleware';
import { recurringRoutes } from './recurring.routes';

let app: FastifyInstance;

beforeAll(async () => {
  app = await buildTestApp();
  app.setErrorHandler(errorHandler);
  await app.register(recurringRoutes, { prefix: '/api' });
  await app.ready();
});

afterAll(async () => {
  await app.close();
});

beforeEach(() => {
  (authMiddleware as any).mockImplementation(async (request: any) => {
    const authHeader = request.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw new AuthenticationError('No authorization token provided');
    }
    request.user = { userId: 'user-1', email: 'test@test.com' };
  });
});

const authHeaders = { authorization: 'Bearer valid-token' };

const mockRecurringRule = {
  id: '550e8400-e29b-41d4-a716-446655440001',
  userId: '550e8400-e29b-41d4-a716-446655440000',
  frequency: 'monthly',
  interval: 1,
  startDate: new Date('2026-01-01'),
  endDate: null,
  occurrences: null,
  isActive: true,
  templateTransaction: {
    accountId: '550e8400-e29b-41d4-a716-446655440002',
    type: 'expense',
    amount: 1000,
    name: 'Rent',
    categoryId: '550e8400-e29b-41d4-a716-446655440003',
  },
  version: 1,
  createdAt: new Date(),
  updatedAt: new Date(),
  lastGeneratedDate: null,
};

describe('GET /api/recurring-rules', () => {
  it('returns 200 with recurring rules list', async () => {
    (recurringService.getRecurringRules as any).mockResolvedValue([mockRecurringRule]);

    const response = await app.inject({
      method: 'GET',
      url: '/api/recurring-rules',
      headers: authHeaders,
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().recurringRules).toHaveLength(1);
    expect(response.json().recurringRules[0].id).toBe('550e8400-e29b-41d4-a716-446655440001');
  });

  it('returns 401 without auth', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/recurring-rules',
    });

    expect(response.statusCode).toBe(401);
  });
});

describe('GET /api/recurring-rules/:id', () => {
  it('returns 200 with single recurring rule', async () => {
    (recurringService.getRecurringRuleById as any).mockResolvedValue(mockRecurringRule);

    const response = await app.inject({
      method: 'GET',
      url: '/api/recurring-rules/rule-1',
      headers: authHeaders,
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().recurringRule.id).toBe('550e8400-e29b-41d4-a716-446655440001');
    expect(response.json().recurringRule.frequency).toBe('monthly');
  });
});

describe('POST /api/recurring-rules', () => {
  it('returns 201 with valid input', async () => {
    (recurringService.createRecurringRule as any).mockResolvedValue(mockRecurringRule);

    const response = await app.inject({
      method: 'POST',
      url: '/api/recurring-rules',
      headers: authHeaders,
      payload: {
        frequency: 'monthly',
        interval: 1,
        startDate: '2026-01-01',
        isActive: true,
        templateTransaction: {
          accountId: '550e8400-e29b-41d4-a716-446655440002',
          type: 'expense',
          amount: 1000,
          name: 'Rent',
        },
      },
    });

    expect(response.statusCode).toBe(201);
    expect(response.json().recurringRule.frequency).toBe('monthly');
  });

  it('calls service with parsed data', async () => {
    (recurringService.createRecurringRule as any).mockResolvedValue(mockRecurringRule);

    await app.inject({
      method: 'POST',
      url: '/api/recurring-rules',
      headers: authHeaders,
      payload: {
        frequency: 'weekly',
        interval: 2,
        startDate: '2026-02-01',
        occurrences: 10,
        isActive: true,
        templateTransaction: {
          accountId: '550e8400-e29b-41d4-a716-446655440004',
          type: 'income',
          amount: 500,
          name: 'Freelance',
          categoryId: '550e8400-e29b-41d4-a716-446655440005',
        },
      },
    });

    expect(recurringService.createRecurringRule).toHaveBeenCalledWith(
      'user-1',
      expect.objectContaining({
        frequency: 'weekly',
        interval: 2,
        occurrences: 10,
      })
    );
  });

  it('returns 400 for missing required fields', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/recurring-rules',
      headers: authHeaders,
      payload: {
        frequency: 'monthly',
        // Missing interval, startDate, templateTransaction
      },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json().error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 400 for invalid frequency', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/recurring-rules',
      headers: authHeaders,
      payload: {
        frequency: 'invalid_frequency',
        interval: 1,
        startDate: '2026-01-01',
        templateTransaction: {
          accountId: 'acc-1',
          type: 'expense',
          amount: 1000,
          name: 'Test',
        },
      },
    });

    expect(response.statusCode).toBe(400);
  });

  it('returns 400 for invalid template transaction', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/recurring-rules',
      headers: authHeaders,
      payload: {
        frequency: 'monthly',
        interval: 1,
        startDate: '2026-01-01',
        isActive: true,
        templateTransaction: {
          // Missing accountId, type, amount, name
          description: 'Test',
        },
      },
    });

    expect(response.statusCode).toBe(400);
  });
});

describe('PUT /api/recurring-rules/:id', () => {
  it('returns 200 with updated recurring rule', async () => {
    const updated = {
      ...mockRecurringRule,
      templateTransaction: {
        ...mockRecurringRule.templateTransaction,
        amount: 1100,
      },
      version: 2,
    };
    (recurringService.updateRecurringRule as any).mockResolvedValue(updated);

    const response = await app.inject({
      method: 'PUT',
      url: '/api/recurring-rules/550e8400-e29b-41d4-a716-446655440001',
      headers: authHeaders,
      payload: {
        templateTransaction: {
          accountId: '550e8400-e29b-41d4-a716-446655440002',
          type: 'expense',
          amount: 1100,
          name: 'Rent',
        },
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().recurringRule.templateTransaction.amount).toBe(1100);
    expect(response.json().recurringRule.version).toBe(2);
  });

  it('can update frequency and interval', async () => {
    const updated = {
      ...mockRecurringRule,
      frequency: 'weekly',
      interval: 2,
      version: 2,
    };
    (recurringService.updateRecurringRule as any).mockResolvedValue(updated);

    const response = await app.inject({
      method: 'PUT',
      url: '/api/recurring-rules/rule-1',
      headers: authHeaders,
      payload: {
        frequency: 'weekly',
        interval: 2,
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().recurringRule.frequency).toBe('weekly');
  });

  it('can deactivate recurring rule', async () => {
    const updated = { ...mockRecurringRule, isActive: false, version: 2 };
    (recurringService.updateRecurringRule as any).mockResolvedValue(updated);

    const response = await app.inject({
      method: 'PUT',
      url: '/api/recurring-rules/rule-1',
      headers: authHeaders,
      payload: {
        isActive: false,
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().recurringRule.isActive).toBe(false);
  });
});

describe('DELETE /api/recurring-rules/:id', () => {
  it('returns 200 on successful delete', async () => {
    (recurringService.deleteRecurringRule as any).mockResolvedValue({
      message: 'Recurring rule deleted',
    });

    const response = await app.inject({
      method: 'DELETE',
      url: '/api/recurring-rules/rule-1',
      headers: authHeaders,
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().message).toContain('deleted');
  });

  it('calls service with correct parameters', async () => {
    (recurringService.deleteRecurringRule as any).mockResolvedValue({
      message: 'Recurring rule deleted',
    });

    await app.inject({
      method: 'DELETE',
      url: '/api/recurring-rules/rule-1',
      headers: authHeaders,
    });

    expect(recurringService.deleteRecurringRule).toHaveBeenCalledWith('rule-1', 'user-1');
  });
});

describe('POST /api/recurring-rules/preview', () => {
  it('returns 200 with preview dates', async () => {
    const previewDates = [
      '2026-01-01T00:00:00.000Z',
      '2026-02-01T00:00:00.000Z',
      '2026-03-01T00:00:00.000Z',
      '2026-04-01T00:00:00.000Z',
      '2026-05-01T00:00:00.000Z',
    ];
    (recurringService.previewOccurrences as any).mockResolvedValue(previewDates);

    const response = await app.inject({
      method: 'POST',
      url: '/api/recurring-rules/preview',
      headers: authHeaders,
      payload: {
        frequency: 'monthly',
        interval: 1,
        startDate: '2026-01-01',
        endDate: null,
        occurrences: null,
        limit: 5,
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().occurrences).toHaveLength(5);
    expect(response.json().occurrences[0]).toContain('2026-01-01');
  });

  it('supports limiting occurrences by count', async () => {
    const previewDates = ['2026-01-01T00:00:00.000Z', '2026-02-01T00:00:00.000Z'];
    (recurringService.previewOccurrences as any).mockResolvedValue(previewDates);

    const response = await app.inject({
      method: 'POST',
      url: '/api/recurring-rules/preview',
      headers: authHeaders,
      payload: {
        frequency: 'monthly',
        interval: 1,
        startDate: '2026-01-01',
        occurrences: 2,
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().occurrences).toHaveLength(2);
  });

  it('supports limiting occurrences by end date', async () => {
    const previewDates = ['2026-01-01T00:00:00.000Z', '2026-02-01T00:00:00.000Z'];
    (recurringService.previewOccurrences as any).mockResolvedValue(previewDates);

    const response = await app.inject({
      method: 'POST',
      url: '/api/recurring-rules/preview',
      headers: authHeaders,
      payload: {
        frequency: 'monthly',
        interval: 1,
        startDate: '2026-01-01',
        endDate: '2026-02-28',
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().occurrences).toHaveLength(2);
  });

  it('returns 400 for invalid preview input', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/recurring-rules/preview',
      headers: authHeaders,
      payload: {
        // Missing frequency and startDate
        interval: 1,
      },
    });

    expect(response.statusCode).toBe(400);
  });
});

describe('POST /api/recurring-rules/materialize', () => {
  it('returns 200 with materialization count', async () => {
    (recurringService.materializeAllToday as any).mockResolvedValue(5);

    const response = await app.inject({
      method: 'POST',
      url: '/api/recurring-rules/materialize',
      headers: authHeaders,
      payload: {},
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().count).toBe(5);
    expect(response.json().message).toContain('Materialized');
  });

  it('calls service with user ID', async () => {
    (recurringService.materializeAllToday as any).mockResolvedValue(3);

    await app.inject({
      method: 'POST',
      url: '/api/recurring-rules/materialize',
      headers: authHeaders,
      payload: {},
    });

    expect(recurringService.materializeAllToday).toHaveBeenCalledWith('user-1');
  });

  it('returns 0 count when no transactions to materialize', async () => {
    (recurringService.materializeAllToday as any).mockResolvedValue(0);

    const response = await app.inject({
      method: 'POST',
      url: '/api/recurring-rules/materialize',
      headers: authHeaders,
      payload: {},
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().count).toBe(0);
  });
});
