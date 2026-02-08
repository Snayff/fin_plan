import { FastifyInstance } from 'fastify';
import { accountService } from '../services/account.service';
import { authMiddleware } from '../middleware/auth.middleware';
import { z } from 'zod';
import { AccountType } from '@prisma/client';

const createAccountSchema = z.object({
  name: z.string().min(1, 'Account name is required'),
  type: z.nativeEnum(AccountType),
  subtype: z.string().optional(),
  openingBalance: z.number().optional().default(0),
  currency: z.string().min(1, 'Currency is required'),
  description: z.string().optional(),
  metadata: z
    .object({
      institution: z.string().optional(),
      accountNumber: z.string().optional(),
      interestRate: z.number().optional(),
      creditLimit: z.number().optional(),
    })
    .optional(),
});

const updateAccountSchema = z.object({
  name: z.string().min(1).optional(),
  type: z.nativeEnum(AccountType).optional(),
  subtype: z.string().optional(),
  balance: z.number().optional(),
  currency: z.string().min(1).optional(),
  isActive: z.boolean().optional(),
  metadata: z
    .object({
      institution: z.string().optional(),
      accountNumber: z.string().optional(),
      interestRate: z.number().optional(),
      creditLimit: z.number().optional(),
    })
    .optional(),
});

export async function accountRoutes(fastify: FastifyInstance) {
  // Get all accounts for current user with enhanced data
  fastify.get(
    '/accounts',
    { preHandler: [authMiddleware] },
    async (request, reply) => {
      const userId = request.user!.userId;
      const { enhanced } = request.query as { enhanced?: string };
      
      // If enhanced=true is in query params, return enhanced data
      if (enhanced === 'true') {
        const accounts = await accountService.getUserAccountsWithEnhancedData(userId);
        return reply.send({ accounts });
      }
      
      // Otherwise return basic data
      const accounts = await accountService.getUserAccounts(userId);
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
      
      return reply.send(result);
    }
  );
}
