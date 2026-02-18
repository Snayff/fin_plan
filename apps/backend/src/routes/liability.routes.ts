import { FastifyInstance } from 'fastify';
import { liabilityService } from '../services/liability.service';
import { authMiddleware } from '../middleware/auth.middleware';
import {
  createLiabilitySchema,
  updateLiabilitySchema,
} from '@finplan/shared';

export async function liabilityRoutes(fastify: FastifyInstance) {
  // Get all liabilities for current user with optional enhanced data
  fastify.get('/liabilities', { preHandler: [authMiddleware] }, async (request, reply) => {
    const userId = request.user!.userId;
    const { enhanced } = request.query as { enhanced?: string };

    // If enhanced=true, return with forecast data
    if (enhanced === 'true') {
      const liabilities = await liabilityService.getUserLiabilitiesWithForecast(userId);
      return reply.send({ liabilities });
    }

    // Otherwise return basic data
    const liabilities = await liabilityService.getUserLiabilities(userId);
    return reply.send({ liabilities });
  });

  // Get single liability by ID
  fastify.get('/liabilities/:id', { preHandler: [authMiddleware] }, async (request, reply) => {
    const userId = request.user!.userId;
    const { id } = request.params as { id: string };

    const liability = await liabilityService.getLiabilityById(id, userId);
    return reply.send({ liability });
  });

  // Get projection for a liability
  fastify.get('/liabilities/:id/projection', { preHandler: [authMiddleware] }, async (request, reply) => {
    const userId = request.user!.userId;
    const { id } = request.params as { id: string };

    const projection = await liabilityService.calculateLiabilityProjection(id, userId);
    return reply.send({ projection });
  });

  // Create new liability
  fastify.post('/liabilities', { preHandler: [authMiddleware] }, async (request, reply) => {
    const userId = request.user!.userId;
    const validatedData = createLiabilitySchema.parse(request.body);

    const liability = await liabilityService.createLiability(userId, validatedData);
    return reply.status(201).send({ liability });
  });

  // Update liability properties
  fastify.put('/liabilities/:id', { preHandler: [authMiddleware] }, async (request, reply) => {
    const userId = request.user!.userId;
    const { id } = request.params as { id: string };
    const validatedData = updateLiabilitySchema.parse(request.body);

    const liability = await liabilityService.updateLiability(id, userId, validatedData);
    return reply.send({ liability });
  });


  // Delete liability
  fastify.delete('/liabilities/:id', { preHandler: [authMiddleware] }, async (request, reply) => {
    const userId = request.user!.userId;
    const { id } = request.params as { id: string };

    const result = await liabilityService.deleteLiability(id, userId);
    return reply.send(result);
  });

  // Get liability summary (analytics)
  fastify.get('/liabilities/summary', { preHandler: [authMiddleware] }, async (request, reply) => {
    const userId = request.user!.userId;
    const summary = await liabilityService.getLiabilitySummary(userId);
    return reply.send(summary);
  });
}
