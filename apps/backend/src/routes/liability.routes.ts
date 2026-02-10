import { FastifyInstance } from 'fastify';
import { liabilityService } from '../services/liability.service';
import { authMiddleware } from '../middleware/auth.middleware';
import {
  createLiabilitySchema,
  updateLiabilitySchema,
  allocatePaymentSchema,
} from '@finplan/shared';

export async function liabilityRoutes(fastify: FastifyInstance) {
  // Get all liabilities for current user with optional enhanced data
  fastify.get('/liabilities', { preHandler: [authMiddleware] }, async (request, reply) => {
    const userId = request.user!.userId;
    const { enhanced } = request.query as { enhanced?: string };

    // If enhanced=true, return with payment history
    if (enhanced === 'true') {
      const liabilities = await liabilityService.getUserLiabilitiesWithPayments(userId);
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

  // Get payment history for a liability
  fastify.get('/liabilities/:id/payments', { preHandler: [authMiddleware] }, async (request, reply) => {
    const userId = request.user!.userId;
    const { id } = request.params as { id: string };

    // Get enhanced data which includes payments
    const liabilities = await liabilityService.getUserLiabilitiesWithPayments(userId);
    const liability = liabilities.find(l => l.id === id);

    if (!liability) {
      return reply.status(404).send({ error: 'Liability not found' });
    }

    return reply.send({ payments: liability.payments });
  });

  // Get payoff projection for a liability
  fastify.get('/liabilities/:id/projection', { preHandler: [authMiddleware] }, async (request, reply) => {
    const userId = request.user!.userId;
    const { id } = request.params as { id: string };

    const projection = await liabilityService.calculatePayoffProjection(id, userId);
    return reply.send({ projection });
  });

  // Get unallocated expense transactions
  fastify.get('/liabilities/:id/unallocated', { preHandler: [authMiddleware] }, async (request, reply) => {
    const userId = request.user!.userId;
    const { id } = request.params as { id: string };

    const transactions = await liabilityService.getUnallocatedPayments(userId, id);
    return reply.send({ transactions });
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

  // Allocate transaction to liability payment
  fastify.post('/liabilities/:id/allocate', { preHandler: [authMiddleware] }, async (request, reply) => {
    const userId = request.user!.userId;
    const { id } = request.params as { id: string };
    const validatedData = allocatePaymentSchema.parse(request.body);

    const payment = await liabilityService.allocateTransactionToLiability(
      validatedData.transactionId,
      id,
      userId,
      validatedData.principalAmount,
      validatedData.interestAmount
    );

    return reply.status(201).send({ payment });
  });

  // Remove payment allocation
  fastify.delete('/liabilities/payments/:paymentId', { preHandler: [authMiddleware] }, async (request, reply) => {
    const userId = request.user!.userId;
    const { paymentId } = request.params as { paymentId: string };

    const result = await liabilityService.removePaymentAllocation(paymentId, userId);
    return reply.send(result);
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
