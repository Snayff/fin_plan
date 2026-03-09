import { FastifyInstance } from 'fastify';
import { goalService } from '../services/goal.service';
import { authMiddleware } from '../middleware/auth.middleware';
import {
  createGoalSchema,
  updateGoalSchema,
  createGoalContributionSchema,
  linkTransactionToGoalSchema,
} from '@finplan/shared';

export async function goalRoutes(fastify: FastifyInstance) {
  // Get all goals for current user with progress data
  fastify.get('/goals', { preHandler: [authMiddleware] }, async (request, reply) => {
    const householdId = request.householdId!;

    // Always return enhanced data (with progress calculations) for consistency
    const goals = await goalService.getUserGoalsWithProgress(householdId);
    return reply.send({ goals });
  });

  // Get goal summary (analytics)
  fastify.get('/goals/summary', { preHandler: [authMiddleware] }, async (request, reply) => {
    const householdId = request.householdId!;
    const summary = await goalService.getGoalSummary(householdId);
    return reply.send(summary);
  });

  // Get single goal by ID
  fastify.get('/goals/:id', { preHandler: [authMiddleware] }, async (request, reply) => {
    const householdId = request.householdId!;
    const { id } = request.params as { id: string };

    const goal = await goalService.getGoalById(id, householdId);
    return reply.send({ goal });
  });

  // Get contribution history for a goal
  fastify.get('/goals/:id/contributions', { preHandler: [authMiddleware] }, async (request, reply) => {
    const householdId = request.householdId!;
    const { id } = request.params as { id: string };

    const contributions = await goalService.getGoalContributions(id, householdId);
    return reply.send({ contributions });
  });

  // Create new goal
  fastify.post('/goals', { preHandler: [authMiddleware] }, async (request, reply) => {
    const householdId = request.householdId!;
    const validatedData = createGoalSchema.parse(request.body);

    const goal = await goalService.createGoal(householdId, validatedData);
    return reply.status(201).send({ goal });
  });

  // Update goal properties
  fastify.put('/goals/:id', { preHandler: [authMiddleware] }, async (request, reply) => {
    const householdId = request.householdId!;
    const { id } = request.params as { id: string };
    const validatedData = updateGoalSchema.parse(request.body);

    const goal = await goalService.updateGoal(id, householdId, validatedData);
    return reply.send({ goal });
  });

  // Add a manual contribution to a goal
  fastify.post('/goals/:id/contributions', { preHandler: [authMiddleware] }, async (request, reply) => {
    const householdId = request.householdId!;
    const { id } = request.params as { id: string };
    const validatedData = createGoalContributionSchema.parse(request.body);

    const result = await goalService.addContribution(id, householdId, validatedData);
    return reply.status(201).send(result);
  });

  // Link an existing transaction to a goal as a contribution
  fastify.post('/goals/:id/link-transaction', { preHandler: [authMiddleware] }, async (request, reply) => {
    const householdId = request.householdId!;
    const { id } = request.params as { id: string };
    const validatedData = linkTransactionToGoalSchema.parse(request.body);

    const result = await goalService.linkTransactionToGoal(id, householdId, validatedData);
    return reply.send(result);
  });

  // Delete goal
  fastify.delete('/goals/:id', { preHandler: [authMiddleware] }, async (request, reply) => {
    const householdId = request.householdId!;
    const { id } = request.params as { id: string };

    const result = await goalService.deleteGoal(id, householdId);
    return reply.send(result);
  });
}
