import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { cashflowService } from "../services/cashflow.service.js";
import { actorCtx } from "../lib/actor-ctx.js";
import {
  cashflowProjectionQuerySchema,
  cashflowMonthDetailQuerySchema,
  updateLinkedAccountSchema,
  bulkUpdateLinkedAccountsSchema,
} from "@finplan/shared";

const accountIdParamSchema = z.object({
  accountId: z.string().min(1).max(64),
});

export async function cashflowRoutes(fastify: FastifyInstance) {
  const pre = { preHandler: [authMiddleware] };

  // Reads can be heavy (projection arithmetic across up to 24 months) — rate
  // limit them to prevent CPU exhaustion from a single authenticated client.
  const preRead = {
    ...pre,
    config: { rateLimit: { max: 60, timeWindow: "1 minute" } },
  };

  const preMutation = {
    ...pre,
    config: { rateLimit: { max: 30, timeWindow: "15 minutes" } },
  };

  // ─── Projection ───────────────────────────────────────────────────────────

  fastify.get("/projection", preRead, async (req, reply) => {
    const query = cashflowProjectionQuerySchema.parse(req.query);
    const projection = await cashflowService.getProjection(req.householdId!, query);
    return reply.send(projection);
  });

  fastify.get("/month", preRead, async (req, reply) => {
    const query = cashflowMonthDetailQuerySchema.parse(req.query);
    const detail = await cashflowService.getMonthDetail(req.householdId!, query.year, query.month);
    return reply.send(detail);
  });

  // ─── Linkable accounts ────────────────────────────────────────────────────

  fastify.get("/linkable-accounts", pre, async (req, reply) => {
    const accounts = await cashflowService.listLinkableAccounts(req.householdId!);
    return reply.send(accounts);
  });

  fastify.patch("/linkable-accounts/:accountId", preMutation, async (req, reply) => {
    const { accountId } = accountIdParamSchema.parse(req.params);
    const data = updateLinkedAccountSchema.parse(req.body);
    const updated = await cashflowService.updateAccountCashflowLink(
      req.householdId!,
      accountId,
      data.isCashflowLinked,
      actorCtx(req)
    );
    return reply.send(updated);
  });

  fastify.post("/linkable-accounts/bulk", preMutation, async (req, reply) => {
    const data = bulkUpdateLinkedAccountsSchema.parse(req.body);
    const result = await cashflowService.bulkUpdateLinkedAccounts(
      req.householdId!,
      data,
      actorCtx(req)
    );
    return reply.send(result);
  });
}
