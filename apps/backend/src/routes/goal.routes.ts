import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { goalService } from '../services/goal.service';
import { authMiddleware } from '../middleware/auth.middleware';
import {
  createGoalSchema,
  updateGoalSchema,
  createGoalContributionSchema,
  linkTransactionToGoalSchema,
} from '@finplan/shared';

const periodBoundariesSchema = z.object({
  monthStart: z.string().datetime({ message: 'monthStart must be an ISO 8601 datetime' }).optional(),
  yearStart: z.string().datetime({ message: 'yearStart must be an ISO 8601 datetime' }).optional(),
  periodEnd: z.string().datetime({ message: 'periodEnd must be an ISO 8601 datetime' }).optional(),
}).refine(
  (data) => {
    if (data.periodEnd && data.monthStart) {
      return new Date(data.periodEnd) >= new Date(data.monthStart);
    }
    return true;
  },
  { message: 'periodEnd must be on or after monthStart' }
);

export async function goalRoutes(fastify: FastifyInstance) {
  // Get all goals for current user with progress data
  fastify.get('/goals', { preHandler: [authMiddleware] }, async (request, reply) => {
    const householdId = request.householdId!;

    const periodResult = periodBoundariesSchema.safeParse(request.query);
    if (!periodResult.success) {
      return reply.status(400).send({
        error: { message: periodResult.error.issues[0]?.message ?? 'Invalid period parameters' },
      });
    }
    const { monthStart, yearStart, periodEnd } = periodResult.data;

    // Always return enhanced data (with progress calculations) for consistency
    const goals = await goalService.getUserGoalsWithProgress(householdId, { monthStart, yearStart, periodEnd });
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
