import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { transactionService } from '../services/transaction.service';
import { auditService } from '../services/audit.service';
import { authMiddleware } from '../middleware/auth.middleware';
import { createTransactionSchema, updateTransactionSchema } from '@finplan/shared';

const ALLOWED_ORDER_FIELDS = ['date', 'amount', 'name', 'type', 'createdAt'] as const;
const ALLOWED_ORDER_DIRS = ['asc', 'desc'] as const;

const transactionQuerySchema = z.object({
  accountId: z.string().optional(),
  type: z.string().optional(),
  categoryId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  minAmount: z.string().optional(),
  maxAmount: z.string().optional(),
  search: z.string().optional(),
  tags: z.union([z.string(), z.array(z.string())]).optional(),
  limit: z.string().optional(),
  offset: z.string().optional(),
  orderBy: z.enum(ALLOWED_ORDER_FIELDS).optional(),
  orderDir: z.enum(ALLOWED_ORDER_DIRS).optional(),
});

export async function transactionRoutes(fastify: FastifyInstance) {
  // Get transactions with filters and pagination
  fastify.get(
    '/transactions',
    { preHandler: [authMiddleware] },
    async (request, reply) => {
      const userId = request.user!.userId;
      const query = transactionQuerySchema.parse(request.query);

      const filters: any = {};
      if (query.accountId) filters.accountId = query.accountId;
      if (query.type) filters.type = query.type;
      if (query.categoryId) filters.categoryId = query.categoryId;
      if (query.startDate) filters.startDate = query.startDate;
      if (query.endDate) filters.endDate = query.endDate;
      if (query.minAmount) filters.minAmount = Number(query.minAmount);
      if (query.maxAmount) filters.maxAmount = Number(query.maxAmount);
      if (query.search) filters.search = query.search;
      if (query.tags) filters.tags = Array.isArray(query.tags) ? query.tags : [query.tags];

      const options: any = {};
      if (query.limit) options.limit = Number(query.limit);
      if (query.offset) options.offset = Number(query.offset);
      if (query.orderBy) options.orderBy = query.orderBy;
      if (query.orderDir) options.orderDir = query.orderDir;

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

      auditService.log({ userId, action: 'TRANSACTION_CREATED', resource: 'transaction', resourceId: transaction.id, ipAddress: request.ip });

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

      auditService.log({ userId, action: 'TRANSACTION_DELETED', resource: 'transaction', resourceId: id, ipAddress: request.ip });

      return reply.send(result);
    }
  );
}
