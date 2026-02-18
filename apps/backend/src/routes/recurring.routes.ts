import { FastifyInstance } from 'fastify';
import { recurringService } from '../services/recurring.service';
import { auditService } from '../services/audit.service';
import { authMiddleware } from '../middleware/auth.middleware';
import {
  createRecurringRuleSchema,
  updateRecurringRuleSchema,
  previewOccurrencesSchema,
} from '@finplan/shared';

export async function recurringRoutes(fastify: FastifyInstance) {
  // Get all recurring rules for current user
  fastify.get(
    '/recurring-rules',
    { preHandler: [authMiddleware] },
    async (request, reply) => {
      const userId = request.user!.userId;
      const rules = await recurringService.getRecurringRules(userId);
      return reply.send({ recurringRules: rules });
    }
  );

  // Get single recurring rule by ID
  fastify.get(
    '/recurring-rules/:id',
    { preHandler: [authMiddleware] },
    async (request, reply) => {
      const userId = request.user!.userId;
      const { id } = request.params as { id: string };
      const rule = await recurringService.getRecurringRuleById(id, userId);
      return reply.send({ recurringRule: rule });
    }
  );

  // Preview occurrences for a recurring rule configuration
  fastify.post(
    '/recurring-rules/preview',
    { preHandler: [authMiddleware] },
    async (request, reply) => {
      const validatedData = previewOccurrencesSchema.parse(request.body);
      const dates = await recurringService.previewOccurrences(
        validatedData.frequency,
        validatedData.interval,
        validatedData.startDate,
        validatedData.endDate ?? null,
        validatedData.occurrences ?? null,
        validatedData.limit
      );
      return reply.send({ occurrences: dates });
    }
  );

  // Create new recurring rule
  fastify.post(
    '/recurring-rules',
    { preHandler: [authMiddleware] },
    async (request, reply) => {
      const userId = request.user!.userId;
      const validatedData = createRecurringRuleSchema.parse(request.body);
      const rule = await recurringService.createRecurringRule(userId, validatedData);

      auditService.log({
        userId,
        action: 'RECURRING_RULE_CREATED',
        resource: 'recurring_rule',
        resourceId: rule.id,
        ipAddress: request.ip,
      });

      return reply.status(201).send({ recurringRule: rule });
    }
  );

  // Update recurring rule
  fastify.put(
    '/recurring-rules/:id',
    { preHandler: [authMiddleware] },
    async (request, reply) => {
      const userId = request.user!.userId;
      const { id } = request.params as { id: string };
      const validatedData = updateRecurringRuleSchema.parse(request.body);
      const rule = await recurringService.updateRecurringRule(id, userId, validatedData);

      auditService.log({
        userId,
        action: 'RECURRING_RULE_UPDATED',
        resource: 'recurring_rule',
        resourceId: id,
        ipAddress: request.ip,
      });

      return reply.send({ recurringRule: rule });
    }
  );

  // Delete recurring rule
  fastify.delete(
    '/recurring-rules/:id',
    { preHandler: [authMiddleware] },
    async (request, reply) => {
      const userId = request.user!.userId;
      const { id } = request.params as { id: string };
      const result = await recurringService.deleteRecurringRule(id, userId);

      auditService.log({
        userId,
        action: 'RECURRING_RULE_DELETED',
        resource: 'recurring_rule',
        resourceId: id,
        ipAddress: request.ip,
      });

      return reply.send(result);
    }
  );

  // Materialize today's transactions for all active rules
  fastify.post(
    '/recurring-rules/materialize',
    { preHandler: [authMiddleware] },
    async (request, reply) => {
      const userId = request.user!.userId;
      const count = await recurringService.materializeAllToday(userId);
      return reply.send({ message: `Materialized ${count} transactions`, count });
    }
  );
}
