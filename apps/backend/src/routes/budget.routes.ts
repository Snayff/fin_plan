import { FastifyInstance } from 'fastify';
import { budgetService } from '../services/budget.service';
import { authMiddleware } from '../middleware/auth.middleware';
import {
  createBudgetSchema,
  updateBudgetSchema,
  addBudgetItemSchema,
  updateBudgetItemSchema,
} from '@finplan/shared';

export async function budgetRoutes(fastify: FastifyInstance) {
  // Get all budgets for current user
  fastify.get('/budgets', { preHandler: [authMiddleware] }, async (request, reply) => {
    const userId = request.user!.userId;
    const budgets = await budgetService.getUserBudgets(userId);
    return reply.send({ budgets });
  });

  // Get single budget by ID with tracking data
  fastify.get('/budgets/:id', { preHandler: [authMiddleware] }, async (request, reply) => {
    const userId = request.user!.userId;
    const { id } = request.params as { id: string };

    const budget = await budgetService.getBudgetWithTracking(id, userId);
    return reply.send({ budget });
  });

  // Create new budget
  fastify.post('/budgets', { preHandler: [authMiddleware] }, async (request, reply) => {
    const userId = request.user!.userId;
    const validatedData = createBudgetSchema.parse(request.body);

    const budget = await budgetService.createBudget(userId, validatedData);
    return reply.status(201).send({ budget });
  });

  // Update budget properties
  fastify.put('/budgets/:id', { preHandler: [authMiddleware] }, async (request, reply) => {
    const userId = request.user!.userId;
    const { id } = request.params as { id: string };
    const validatedData = updateBudgetSchema.parse(request.body);

    const budget = await budgetService.updateBudget(id, userId, validatedData);
    return reply.send({ budget });
  });

  // Delete budget
  fastify.delete('/budgets/:id', { preHandler: [authMiddleware] }, async (request, reply) => {
    const userId = request.user!.userId;
    const { id } = request.params as { id: string };

    const result = await budgetService.deleteBudget(id, userId);
    return reply.send(result);
  });

  // Add a line item to a budget
  fastify.post('/budgets/:id/items', { preHandler: [authMiddleware] }, async (request, reply) => {
    const userId = request.user!.userId;
    const { id } = request.params as { id: string };
    const validatedData = addBudgetItemSchema.parse(request.body);

    const item = await budgetService.addBudgetItem(id, userId, validatedData);
    return reply.status(201).send({ item });
  });

  // Update a budget line item
  fastify.put('/budgets/:budgetId/items/:itemId', { preHandler: [authMiddleware] }, async (request, reply) => {
    const userId = request.user!.userId;
    const { itemId } = request.params as { budgetId: string; itemId: string };
    const validatedData = updateBudgetItemSchema.parse(request.body);

    const item = await budgetService.updateBudgetItem(itemId, userId, validatedData);
    return reply.send({ item });
  });

  // Delete a budget line item
  fastify.delete('/budgets/:budgetId/items/:itemId', { preHandler: [authMiddleware] }, async (request, reply) => {
    const userId = request.user!.userId;
    const { itemId } = request.params as { budgetId: string; itemId: string };

    const result = await budgetService.deleteBudgetItem(itemId, userId);
    return reply.send(result);
  });

  // Remove all items for a category from a budget
  fastify.delete('/budgets/:id/categories/:categoryId', { preHandler: [authMiddleware] }, async (request, reply) => {
    const userId = request.user!.userId;
    const { id, categoryId } = request.params as { id: string; categoryId: string };

    const result = await budgetService.removeCategoryFromBudget(id, userId, categoryId);
    return reply.send(result);
  });
}
