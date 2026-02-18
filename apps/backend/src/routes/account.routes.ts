import { FastifyInstance } from 'fastify';
import { accountService } from '../services/account.service';
import { auditService } from '../services/audit.service';
import { authMiddleware } from '../middleware/auth.middleware';
import { createAccountSchema, updateAccountSchema } from '@finplan/shared';

export async function accountRoutes(fastify: FastifyInstance) {
  // Get all accounts for current user with enhanced data (balance, history, flow)
  fastify.get(
    '/accounts',
    { preHandler: [authMiddleware] },
    async (request, reply) => {
      const userId = request.user!.userId;
      
      // Always return enhanced data for consistency and simplicity
      const accounts = await accountService.getUserAccountsWithEnhancedData(userId);
      return reply.send({ accounts });
    }
  );

  // Get single account by ID
  fastify.get(
    '/accounts/:id',
    { preHandler: [authMiddleware] },
    async (request, reply) => {
      const userId = request.user!.userId;
      const { id } = request.params as { id: string };

      const account = await accountService.getAccountById(id, userId);
      
      return reply.send({ account });
    }
  );

  // Get account summary (with transactions)
  fastify.get(
    '/accounts/:id/summary',
    { preHandler: [authMiddleware] },
    async (request, reply) => {
      const userId = request.user!.userId;
      const { id } = request.params as { id: string };

      const summary = await accountService.getAccountSummary(id, userId);
      
      return reply.send(summary);
    }
  );

  // Create new account
  fastify.post(
    '/accounts',
    { preHandler: [authMiddleware] },
    async (request, reply) => {
      const userId = request.user!.userId;
      
      // Validate request body
      const validatedData = createAccountSchema.parse(request.body);

      const account = await accountService.createAccount(userId, validatedData);

      auditService.log({ userId, action: 'ACCOUNT_CREATED', resource: 'account', resourceId: account.id, ipAddress: request.ip });

      return reply.status(201).send({ account });
    }
  );

  // Update account
  fastify.put(
    '/accounts/:id',
    { preHandler: [authMiddleware] },
    async (request, reply) => {
      const userId = request.user!.userId;
      const { id } = request.params as { id: string };

      // Validate request body
      const validatedData = updateAccountSchema.parse(request.body);

      const account = await accountService.updateAccount(id, userId, validatedData);
      
      return reply.send({ account });
    }
  );

  // Delete account
  fastify.delete(
    '/accounts/:id',
    { preHandler: [authMiddleware] },
    async (request, reply) => {
      const userId = request.user!.userId;
      const { id } = request.params as { id: string };

      const result = await accountService.deleteAccount(id, userId);

      auditService.log({ userId, action: 'ACCOUNT_DELETED', resource: 'account', resourceId: id, ipAddress: request.ip });

      return reply.send(result);
    }
  );
}
