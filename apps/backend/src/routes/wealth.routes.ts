import type { FastifyInstance } from "fastify";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { wealthService } from "../services/wealth.service.js";
import { actorCtx } from "../lib/actor-ctx.js";
import {
  createWealthAccountSchema,
  updateWealthAccountSchema,
  updateValuationSchema,
  confirmBatchWealthSchema,
} from "@finplan/shared";

export async function wealthRoutes(fastify: FastifyInstance) {
  const pre = { preHandler: [authMiddleware] };

  fastify.get("/", pre, async (req, reply) => {
    const summary = await wealthService.getWealthSummary(req.householdId!);
    return reply.send(summary);
  });

  fastify.get("/isa-allowance", pre, async (req, reply) => {
    const allowance = await wealthService.getIsaAllowance(req.householdId!);
    return reply.send(allowance);
  });

  fastify.get("/accounts", pre, async (req, reply) => {
    const accounts = await wealthService.listAccounts(req.householdId!);
    return reply.send(accounts);
  });

  fastify.post("/accounts/confirm-batch", pre, async (req, reply) => {
    const data = confirmBatchWealthSchema.parse(req.body);
    await wealthService.confirmBatch(req.householdId!, data);
    return reply.status(204).send();
  });

  fastify.get("/accounts/:id", pre, async (req, reply) => {
    const { id } = req.params as { id: string };
    const account = await wealthService.getAccount(req.householdId!, id);
    return reply.send(account);
  });

  fastify.post("/accounts", pre, async (req, reply) => {
    const data = createWealthAccountSchema.parse(req.body);
    const account = await wealthService.createAccount(req.householdId!, data, actorCtx(req));
    return reply.status(201).send(account);
  });

  fastify.patch("/accounts/:id", pre, async (req, reply) => {
    const { id } = req.params as { id: string };
    const data = updateWealthAccountSchema.parse(req.body);
    const account = await wealthService.updateAccount(req.householdId!, id, data, actorCtx(req));
    return reply.send(account);
  });

  fastify.delete("/accounts/:id", pre, async (req, reply) => {
    const { id } = req.params as { id: string };
    await wealthService.deleteAccount(req.householdId!, id, actorCtx(req));
    return reply.status(204).send();
  });

  fastify.post("/accounts/:id/valuation", pre, async (req, reply) => {
    const { id } = req.params as { id: string };
    const data = updateValuationSchema.parse(req.body);
    const account = await wealthService.updateValuation(req.householdId!, id, data);
    return reply.send(account);
  });

  fastify.post("/accounts/:id/confirm", pre, async (req, reply) => {
    const { id } = req.params as { id: string };
    const account = await wealthService.confirmAccount(req.householdId!, id);
    return reply.send(account);
  });

  fastify.get("/accounts/:id/history", pre, async (req, reply) => {
    const { id } = req.params as { id: string };
    const history = await wealthService.getHistory(req.householdId!, id);
    return reply.send(history);
  });
}
