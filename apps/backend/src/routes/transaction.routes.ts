import { FastifyInstance } from 'fastify';
import { transactionService } from '../services/transaction.service';
import { authMiddleware } from '../middleware/auth.middleware';
import { createTransactionSchema, updateTransactionSchema } from '@finplan/shared';

export async function transactionRoutes(fastify: FastifyInstance) {
  // Get transactions with filters and pagination
  fastify.get(
    '/transactions',
    { preHandler: [authMiddleware] },
    async (request, reply) => {
      const userId = request.user!.userId;
      const {
        accountId,
        type,
        categoryId,
        startDate,
        endDate,
        minAmount,
        maxAmount,
        search,
        tags,
        limit,
        offset,
        orderBy,
        orderDir,
      } = request.query as any;

      const filters: any = {};
      if (accountId) filters.accountId = accountId;
      if (type) filters.type = type;
      if (categoryId) filters.categoryId = categoryId;
      if (startDate) filters.startDate = startDate;
      if (endDate) filters.endDate = endDate;
      if (minAmount) filters.minAmount = Number(minAmount);
      if (maxAmount) filters.maxAmount = Number(maxAmount);
      if (search) filters.search = search;
      if (tags) filters.tags = Array.isArray(tags) ? tags : [tags];

      const options: any = {};
      if (limit) options.limit = Number(limit);
      if (offset) options.offset = Number(offset);
      if (orderBy) options.orderBy = orderBy;
      if (orderDir) options.orderDir = orderDir;

      const result = await transactionService.getTransactions(userId, filters, options);
      
      return reply.send(result);
    }
  );

  // Get single transaction by ID
  fastify.get(
    '/transactions/:id',
    { preHandler: [authMiddleware] },
    async (request, reply) => {
      const userId = request.user!.userId;
      const { id } = request.params as { id: string };

      const transaction = await transactionService.getTransactionById(id, userId);
      
      return reply.send({ transaction });
    }
  );

  // Get transaction summary
  fastify.get(
    '/transactions/summary',
    { preHandler: [authMiddleware] },
    async (request, reply) => {
      const userId = request.user!.userId;
      const { accountId, startDate, endDate } = request.query as any;

      const filters: any = {};
      if (accountId) filters.accountId = accountId;
      if (startDate) filters.startDate = startDate;
      if (endDate) filters.endDate = endDate;

      const summary = await transactionService.getTransactionSummary(userId, filters);
      
      return reply.send(summary);
    }
  );

  // Create new transaction
  fastify.post(
    '/transactions',
    { preHandler: [authMiddleware] },
    async (request, reply) => {
      const userId = request.user!.userId;
      
      // Validate request body
      const validatedData = createTransactionSchema.parse(request.body);

      const transaction = await transactionService.createTransaction(userId, validatedData);
      
      return reply.status(201).send({ transaction });
    }
  );

  // Update transaction
  fastify.put(
    '/transactions/:id',
    { preHandler: [authMiddleware] },
    async (request, reply) => {
      const userId = request.user!.userId;
      const { id } = request.params as { id: string };

      // Validate request body
      const validatedData = updateTransactionSchema.parse(request.body);

      const transaction = await transactionService.updateTransaction(id, userId, validatedData);
      
      return reply.send({ transaction });
    }
  );

  // Delete transaction
  fastify.delete(
    '/transactions/:id',
    { preHandler: [authMiddleware] },
    async (request, reply) => {
      const userId = request.user!.userId;
      const { id } = request.params as { id: string };

      const result = await transactionService.deleteTransaction(id, userId);
      
      return reply.send(result);
    }
  );
}
