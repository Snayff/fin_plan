import type { FastifyInstance } from "fastify";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { plannerService } from "../services/planner.service.js";
import { actorCtx } from "../lib/actor-ctx.js";
import {
  createPurchaseSchema,
  updatePurchaseSchema,
  upsertYearBudgetSchema,
} from "@finplan/shared";

export async function plannerRoutes(fastify: FastifyInstance) {
  const pre = { preHandler: [authMiddleware] };

  // ─── Purchases ────────────────────────────────────────────────────────────

  fastify.get("/purchases", pre, async (req, reply) => {
    const { year } = req.query as { year?: string };
    const y = year ? parseInt(year, 10) : new Date().getFullYear();
    const purchases = await plannerService.listPurchases(req.householdId!, y);
    return reply.send(purchases);
  });

  fastify.post("/purchases", pre, async (req, reply) => {
    const data = createPurchaseSchema.parse(req.body);
    const purchase = await plannerService.createPurchase(req.householdId!, data, actorCtx(req));
    return reply.status(201).send(purchase);
  });

  fastify.patch("/purchases/:id", pre, async (req, reply) => {
    const { id } = req.params as { id: string };
    const data = updatePurchaseSchema.parse(req.body);
    const purchase = await plannerService.updatePurchase(req.householdId!, id, data, actorCtx(req));
    return reply.send(purchase);
  });

  fastify.delete("/purchases/:id", pre, async (req, reply) => {
    const { id } = req.params as { id: string };
    await plannerService.deletePurchase(req.householdId!, id, actorCtx(req));
    return reply.status(204).send();
  });

  // ─── Year budget ──────────────────────────────────────────────────────────

  fastify.get("/budget/:year", pre, async (req, reply) => {
    const { year } = req.params as { year: string };
    const budget = await plannerService.getYearBudget(req.householdId!, parseInt(year, 10));
    return reply.send(budget);
  });

  fastify.put("/budget/:year", pre, async (req, reply) => {
    const { year } = req.params as { year: string };
    const data = upsertYearBudgetSchema.parse(req.body);
    const budget = await plannerService.upsertYearBudget(
      req.householdId!,
      parseInt(year, 10),
      data,
      actorCtx(req)
    );
    return reply.send(budget);
  });
}
