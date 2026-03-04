import { describe, it, expect, mock, beforeEach, beforeAll, afterAll } from 'bun:test';
import type { FastifyInstance } from 'fastify';
import { buildTestApp } from '../test/helpers/fastify';
import { errorHandler } from '../middleware/errorHandler';
import { AuthenticationError } from '../utils/errors';

mock.module('../services/category.service', () => ({
  categoryService: {
    getUserCategories: mock(() => {}),
    getCategoriesByType: mock(() => {}),
  },
}));

mock.module('../middleware/auth.middleware', () => ({
  authMiddleware: mock(() => {}),
}));

import { categoryService } from '../services/category.service';
import { authMiddleware } from '../middleware/auth.middleware';
import { categoryRoutes } from './category.routes';

let app: FastifyInstance;

beforeAll(async () => {
  app = await buildTestApp();
  app.setErrorHandler(errorHandler);
  await app.register(categoryRoutes, { prefix: '/api' });
  await app.ready();
});

afterAll(async () => {
  await app.close();
});

const authHeaders = { authorization: 'Bearer valid-token' };

const mockCategory = {
  id: 'cat-1',
  userId: 'user-1',
  householdId: 'household-1',
  name: 'Groceries',
  type: 'expense' as const,
  parentCategoryId: null,
  color: '#FF0000',
  icon: 'tag',
  isSystemCategory: false,
  sortOrder: 0,
  createdAt: new Date('2025-01-01T00:00:00Z'),
  updatedAt: new Date('2025-01-01T00:00:00Z'),
};

const mockIncomeCategory = {
  ...mockCategory,
  id: 'cat-2',
  name: 'Salary',
  type: 'income' as const,
};

beforeEach(() => {
  // Reset all service mock call histories
  for (const method of Object.values(categoryService) as any[]) {
    if (typeof method?.mockReset === 'function') method.mockReset();
  }

  // Re-apply default mock return values
  (categoryService.getUserCategories as any).mockResolvedValue([mockCategory, mockIncomeCategory]);
  (categoryService.getCategoriesByType as any).mockResolvedValue([mockCategory]);

  // Re-apply auth middleware mock
  (authMiddleware as any).mockImplementation(async (request: any) => {
    const authHeader = request.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw new AuthenticationError('No authorization token provided');
    }
    request.user = { userId: 'user-1', email: 'test@test.com' };
    request.householdId = 'household-1';
  });
});

describe('GET /api/categories', () => {
  it('returns 200 with all categories', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/categories',
      headers: authHeaders,
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.categories).toBeDefined();
    expect(body.categories).toHaveLength(2);
  });

  it('calls service with householdId', async () => {
    (categoryService.getUserCategories as any).mockResolvedValue([mockCategory]);

    await app.inject({
      method: 'GET',
      url: '/api/categories',
      headers: authHeaders,
    });

    expect(categoryService.getUserCategories).toHaveBeenCalledWith('household-1');
  });

  it('returns empty array when no categories exist', async () => {
    (categoryService.getUserCategories as any).mockResolvedValue([]);

    const response = await app.inject({
      method: 'GET',
      url: '/api/categories',
      headers: authHeaders,
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.categories).toHaveLength(0);
  });

  it('returns 401 without auth', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/categories',
    });

    expect(response.statusCode).toBe(401);
  });
});

describe('GET /api/categories/:type', () => {
  it('returns 200 with expense categories', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/categories/expense',
      headers: authHeaders,
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.categories).toBeDefined();
    expect(body.categories).toHaveLength(1);
    expect(body.categories[0].id).toBe('cat-1');
  });

  it('returns 200 with income categories', async () => {
    (categoryService.getCategoriesByType as any).mockResolvedValue([mockIncomeCategory]);

    const response = await app.inject({
      method: 'GET',
      url: '/api/categories/income',
      headers: authHeaders,
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.categories).toBeDefined();
    expect(body.categories).toHaveLength(1);
    expect(body.categories[0].type).toBe('income');
  });

  it('calls service with householdId and type', async () => {
    await app.inject({
      method: 'GET',
      url: '/api/categories/expense',
      headers: authHeaders,
    });

    expect(categoryService.getCategoriesByType).toHaveBeenCalledWith('household-1', 'expense');
  });

  it('returns 400 for invalid category type', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/categories/invalid_type',
      headers: authHeaders,
    });

    expect(response.statusCode).toBe(400);
    const body = response.json();
    expect(body.error).toBeDefined();
  });

  it('returns 400 for numeric type param', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/categories/123',
      headers: authHeaders,
    });

    expect(response.statusCode).toBe(400);
    const body = response.json();
    expect(body.error).toBeDefined();
  });

  it('returns 401 without auth', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/categories/expense',
    });

    expect(response.statusCode).toBe(401);
  });
});
