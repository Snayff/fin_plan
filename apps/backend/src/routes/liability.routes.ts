import { FastifyInstance } from 'fastify';
import { liabilityService } from '../services/liability.service';
import { cacheService } from '../services/cache.service';
import { authMiddleware } from '../middleware/auth.middleware';
import {
  createLiabilitySchema,
  updateLiabilitySchema,
} from '@finplan/shared';

export async function liabilityRoutes(fastify: FastifyInstance) {
  // Get all liabilities for current user with optional enhanced data
  fastify.get('/liabilities', { preHandler: [authMiddleware] }, async (request, reply) => {
    const householdId = request.householdId!;
    const { enhanced } = request.query as { enhanced?: string };

    // If enhanced=true, return with forecast data
    if (enhanced === 'true') {
      const liabilities = await liabilityService.getUserLiabilitiesWithForecast(householdId);
      return reply.send({ liabilities });
    }

    // Otherwise return basic data
    const liabilities = await liabilityService.getUserLiabilities(householdId);
    return reply.send({ liabilities });
  });

  // Get liability summary (analytics)
  fastify.get('/liabilities/summary', { preHandler: [authMiddleware] }, async (request, reply) => {
    const householdId = request.householdId!;
    const summary = await liabilityService.getLiabilitySummary(householdId);
    return reply.send(summary);
  });

  // Get single liability by ID
  fastify.get('/liabilities/:id', { preHandler: [authMiddleware] }, async (request, reply) => {
    const householdId = request.householdId!;
    const { id } = request.params as { id: string };

    const liability = await liabilityService.getLiabilityById(id, householdId);
    return reply.send({ liability });
  });

  // Get projection for a liability
  fastify.get('/liabilities/:id/projection', { preHandler: [authMiddleware] }, async (request, reply) => {
    const householdId = request.householdId!;
    const { id } = request.params as { id: string };

    const projection = await liabilityService.calculateLiabilityProjection(id, householdId);
    return reply.send({ projection });
  });

  // Create new liability
  fastify.post('/liabilities', { preHandler: [authMiddleware] }, async (request, reply) => {
    const householdId = request.householdId!;
    const validatedData = createLiabilitySchema.parse(request.body);

    const liability = await liabilityService.createLiability(householdId, validatedData);
    void cacheService.invalidatePattern(`dashboard:*:${householdId}:*`);
    return reply.status(201).send({ liability });
  });

  // Update liability properties
  fastify.put('/liabilities/:id', { preHandler: [authMiddleware] }, async (request, reply) => {
    const householdId = request.householdId!;
    const { id } = request.params as { id: string };
    const validatedData = updateLiabilitySchema.parse(request.body);

    const liability = await liabilityService.updateLiability(id, householdId, validatedData);
    void cacheService.invalidatePattern(`dashboard:*:${householdId}:*`);
    return reply.send({ liability });
  });


  // Delete liability
  fastify.delete('/liabilities/:id', { preHandler: [authMiddleware] }, async (request, reply) => {
    const householdId = request.householdId!;
    const { id } = request.params as { id: string };

    const result = await liabilityService.deleteLiability(id, householdId);
    void cacheService.invalidatePattern(`dashboard:*:${householdId}:*`);
    return reply.send(result);
  });
}
