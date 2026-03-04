import { describe, it, expect, mock, beforeEach, beforeAll, afterAll } from 'bun:test';
import type { FastifyInstance } from 'fastify';
import { buildTestApp } from '../test/helpers/fastify';
import { errorHandler } from '../middleware/errorHandler';
import { AuthenticationError } from '../utils/errors';

mock.module('../services/transaction.service', () => ({
  transactionService: {
    getTransactions: mock(() => {}),
    getTransactionById: mock(() => {}),
    getTransactionSummary: mock(() => {}),
    createTransaction: mock(() => {}),
    updateTransaction: mock(() => {}),
    deleteTransaction: mock(() => {}),
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

import { transactionService } from '../services/transaction.service';
import { authMiddleware } from '../middleware/auth.middleware';
import { transactionRoutes } from './transaction.routes';

let app: FastifyInstance;

beforeAll(async () => {
  app = await buildTestApp();
  app.setErrorHandler(errorHandler);
  await app.register(transactionRoutes, { prefix: '/api' });
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
    request.householdId = 'household-1';
  });
});

const authHeaders = { authorization: 'Bearer valid-token' };

const mockTransaction = {
  id: 'tx-1',
  userId: 'user-1',
  accountId: '00000000-0000-0000-0000-000000000001',
  liabilityId: null,
  categoryId: null,
  subcategoryId: null,
  date: new Date('2025-01-15T12:00:00Z'),
  amount: 100.0,
  type: 'expense' as const,
  name: 'Test Transaction',
  description: null,
  memo: null,
  tags: [],
  isRecurring: false,
  recurrence: 'none' as const,
  recurringRuleId: null,
  recurrence_end_date: null,
  metadata: {},
  createdAt: new Date('2025-01-15T12:00:00Z'),
  updatedAt: new Date('2025-01-15T12:00:00Z'),
};

describe('GET /api/transactions', () => {
  it('returns 200 with transactions list', async () => {
    (transactionService.getTransactions as any).mockResolvedValue({
      transactions: [mockTransaction],
      pagination: { total: 1, limit: 50, offset: 0, hasMore: false },
    });

    const response = await app.inject({
      method: 'GET',
      url: '/api/transactions',
      headers: authHeaders,
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.transactions).toBeDefined();
    expect(body.transactions).toHaveLength(1);
    expect(body.pagination).toBeDefined();
  });

  it('returns 401 without auth', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/transactions',
    });

    expect(response.statusCode).toBe(401);
  });

  it('calls service with householdId and passes query filters', async () => {
    (transactionService.getTransactions as any).mockResolvedValue({
      transactions: [],
      pagination: { total: 0, limit: 50, offset: 0, hasMore: false },
    });

    await app.inject({
      method: 'GET',
      url: '/api/transactions?type=expense&limit=10',
      headers: authHeaders,
    });

    expect(transactionService.getTransactions).toHaveBeenCalledWith(
      'household-1',
      expect.objectContaining({ type: 'expense' }),
      expect.objectContaining({ limit: 10 })
    );
  });
});

describe('GET /api/transactions/:id', () => {
  it('returns 200 with single transaction', async () => {
    (transactionService.getTransactionById as any).mockResolvedValue(mockTransaction);

    const response = await app.inject({
      method: 'GET',
      url: '/api/transactions/tx-1',
      headers: authHeaders,
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().transaction.id).toBe('tx-1');
  });

  it('returns 401 without auth', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/transactions/tx-1',
    });

    expect(response.statusCode).toBe(401);
  });
});

describe('GET /api/transactions/summary', () => {
  it('returns 200 with transaction summary', async () => {
    const summary = {
      totalIncome: 5000,
      totalExpenses: 3000,
      netAmount: 2000,
      byCategory: [],
    };
    (transactionService.getTransactionSummary as any).mockResolvedValue(summary);

    const response = await app.inject({
      method: 'GET',
      url: '/api/transactions/summary',
      headers: authHeaders,
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().totalIncome).toBe(5000);
  });
});

describe('POST /api/transactions', () => {
  it('returns 201 with created transaction', async () => {
    (transactionService.createTransaction as any).mockResolvedValue(mockTransaction);

    const response = await app.inject({
      method: 'POST',
      url: '/api/transactions',
      headers: authHeaders,
      payload: {
        accountId: '00000000-0000-0000-0000-000000000001',
        amount: 100,
        type: 'expense',
        name: 'Test Transaction',
        date: '2025-01-15',
      },
    });

    expect(response.statusCode).toBe(201);
    const body = response.json();
    expect(body.transaction).toBeDefined();
    expect(body.transaction.id).toBe('tx-1');
  });

  it('calls service with householdId and validated data', async () => {
    (transactionService.createTransaction as any).mockResolvedValue(mockTransaction);

    await app.inject({
      method: 'POST',
      url: '/api/transactions',
      headers: authHeaders,
      payload: {
        accountId: '00000000-0000-0000-0000-000000000001',
        amount: 250,
        type: 'income',
        name: 'Salary',
        date: '2025-01-15',
      },
    });

    expect(transactionService.createTransaction).toHaveBeenCalledWith(
      'household-1',
      expect.objectContaining({
        accountId: '00000000-0000-0000-0000-000000000001',
        amount: 250,
        type: 'income',
        name: 'Salary',
      })
    );
  });

  it('returns 400 when required fields are missing', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/transactions',
      headers: authHeaders,
      payload: { amount: 100 },
    });

    expect(response.statusCode).toBe(400);
  });

  it('returns 400 for invalid transaction type', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/transactions',
      headers: authHeaders,
      payload: {
        accountId: '00000000-0000-0000-0000-000000000001',
        amount: 100,
        type: 'invalid_type',
        name: 'Test',
        date: '2025-01-15',
      },
    });

    expect(response.statusCode).toBe(400);
  });

  it('returns 401 without auth', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/transactions',
      payload: {
        accountId: '00000000-0000-0000-0000-000000000001',
        amount: 100,
        type: 'expense',
        name: 'Test',
        date: '2025-01-15',
      },
    });

    expect(response.statusCode).toBe(401);
  });
});

describe('PUT /api/transactions/:id', () => {
  it('returns 200 with updated transaction', async () => {
    const updated = { ...mockTransaction, name: 'Updated Transaction', amount: 200 };
    (transactionService.updateTransaction as any).mockResolvedValue(updated);

    const response = await app.inject({
      method: 'PUT',
      url: '/api/transactions/tx-1',
      headers: authHeaders,
      payload: { name: 'Updated Transaction', amount: 200 },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().transaction.name).toBe('Updated Transaction');
  });

  it('returns 400 for invalid updateScope query param', async () => {
    const response = await app.inject({
      method: 'PUT',
      url: '/api/transactions/tx-1?updateScope=bad_scope',
      headers: authHeaders,
      payload: { name: 'Test' },
    });

    expect(response.statusCode).toBe(400);
  });

  it('returns 401 without auth', async () => {
    const response = await app.inject({
      method: 'PUT',
      url: '/api/transactions/tx-1',
      payload: { name: 'Test' },
    });

    expect(response.statusCode).toBe(401);
  });
});

describe('DELETE /api/transactions/:id', () => {
  it('returns 200 with deletion confirmation message', async () => {
    (transactionService.deleteTransaction as any).mockResolvedValue({
      message: 'Transaction deleted successfully',
    });

    const response = await app.inject({
      method: 'DELETE',
      url: '/api/transactions/tx-1',
      headers: authHeaders,
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.message).toBeTruthy();
  });

  it('calls service with transaction id and householdId', async () => {
    (transactionService.deleteTransaction as any).mockResolvedValue({
      message: 'Transaction deleted successfully',
    });

    await app.inject({
      method: 'DELETE',
      url: '/api/transactions/tx-abc-123',
      headers: authHeaders,
    });

    expect(transactionService.deleteTransaction).toHaveBeenCalledWith(
      'tx-abc-123',
      'household-1'
    );
  });

  it('returns 401 without auth', async () => {
    const response = await app.inject({
      method: 'DELETE',
      url: '/api/transactions/tx-1',
    });

    expect(response.statusCode).toBe(401);
  });
});
