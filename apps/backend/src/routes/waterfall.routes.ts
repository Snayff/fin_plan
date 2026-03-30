import type { FastifyInstance } from "fastify";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { waterfallService } from "../services/waterfall.service.js";
import { actorCtx } from "../lib/actor-ctx.js";
import { snapshotService } from "../services/snapshot.service.js";
import { subcategoryService } from "../services/subcategory.service.js";
import {
  createIncomeSourceSchema,
  updateIncomeSourceSchema,
  endIncomeSourceSchema,
  createCommittedItemSchema,
  updateCommittedItemSchema,
  createDiscretionaryItemSchema,
  updateDiscretionaryItemSchema,
  confirmBatchSchema,
  deleteAllWaterfallSchema,
  WaterfallTierEnum,
} from "@finplan/shared";

export async function waterfallRoutes(fastify: FastifyInstance) {
  const pre = { preHandler: [authMiddleware] };

  fastify.addHook("onResponse", async (request, reply) => {
    if (
      ["POST", "PATCH", "DELETE"].includes(request.method) &&
      reply.statusCode < 300 &&
      request.householdId
    ) {
      snapshotService.ensureTodayAutoSnapshot(request.householdId).catch(() => {});
    }
  });

  // ─── Summary + cashflow ───────────────────────────────────────────────────

  fastify.get("/", pre, async (req, reply) => {
    const householdId = req.householdId!;
    // Auto Jan 1 snapshot — fires once on first load of the new year
    snapshotService.ensureJan1Snapshot(householdId).catch(() => {});
    const summary = await waterfallService.getWaterfallSummary(householdId);
    return reply.send(summary);
  });

  fastify.get("/cashflow", pre, async (req, reply) => {
    const { year } = req.query as { year?: string };
    const y = year ? parseInt(year, 10) : new Date().getFullYear();
    if (!Number.isInteger(y) || y < 2000 || y > 2100) {
      return reply.status(400).send({ error: "Invalid year" });
    }
    const months = await waterfallService.getCashflow(req.householdId!, y);
    return reply.send(months);
  });

  fastify.get("/financial-summary", pre, async (req, reply) => {
    const summary = await snapshotService.getFinancialSummary(req.householdId!);
    return reply.send(summary);
  });

  // ─── Income ───────────────────────────────────────────────────────────────

  fastify.get("/income", pre, async (req, reply) => {
    const sources = await waterfallService.listIncome(req.householdId!);
    return reply.send(sources);
  });

  fastify.get("/income/ended", pre, async (req, reply) => {
    const sources = await waterfallService.listEndedIncome(req.householdId!);
    return reply.send(sources);
  });

  fastify.post("/income", pre, async (req, reply) => {
    const data = createIncomeSourceSchema.parse(req.body);
    const source = await waterfallService.createIncome(req.householdId!, data, actorCtx(req));
    return reply.status(201).send(source);
  });

  fastify.patch("/income/:id", pre, async (req, reply) => {
    const { id } = req.params as { id: string };
    const data = updateIncomeSourceSchema.parse(req.body);
    const source = await waterfallService.updateIncome(req.householdId!, id, data, actorCtx(req));
    return reply.send(source);
  });

  fastify.delete("/income/:id", pre, async (req, reply) => {
    const { id } = req.params as { id: string };
    await waterfallService.deleteIncome(req.householdId!, id, actorCtx(req));
    return reply.status(204).send();
  });

  fastify.post("/income/:id/end", pre, async (req, reply) => {
    const { id } = req.params as { id: string };
    const data = endIncomeSourceSchema.parse(req.body);
    const source = await waterfallService.endIncome(req.householdId!, id, data, actorCtx(req));
    return reply.send(source);
  });

  fastify.post("/income/:id/reactivate", pre, async (req, reply) => {
    const { id } = req.params as { id: string };
    const source = await waterfallService.reactivateIncome(req.householdId!, id, actorCtx(req));
    return reply.send(source);
  });

  fastify.post("/income/:id/confirm", pre, async (req, reply) => {
    const { id } = req.params as { id: string };
    const source = await waterfallService.confirmIncome(req.householdId!, id);
    return reply.send(source);
  });

  // ─── Committed bills ──────────────────────────────────────────────────────

  fastify.get("/committed", pre, async (req, reply) => {
    const bills = await waterfallService.listCommitted(req.householdId!);
    return reply.send(bills);
  });

  fastify.post("/committed", pre, async (req, reply) => {
    const data = createCommittedItemSchema.parse(req.body);
    const bill = await waterfallService.createCommitted(req.householdId!, data);
    return reply.status(201).send(bill);
  });

  fastify.patch("/committed/:id", pre, async (req, reply) => {
    const { id } = req.params as { id: string };
    const data = updateCommittedItemSchema.parse(req.body);
    const bill = await waterfallService.updateCommitted(req.householdId!, id, data);
    return reply.send(bill);
  });

  fastify.delete("/committed/:id", pre, async (req, reply) => {
    const { id } = req.params as { id: string };
    await waterfallService.deleteCommitted(req.householdId!, id);
    return reply.status(204).send();
  });

  fastify.post("/committed/:id/confirm", pre, async (req, reply) => {
    const { id } = req.params as { id: string };
    const bill = await waterfallService.confirmCommitted(req.householdId!, id);
    return reply.send(bill);
  });

  // ─── Yearly bills ─────────────────────────────────────────────────────────

  fastify.get("/yearly", pre, async (req, reply) => {
    const bills = await waterfallService.listYearly(req.householdId!);
    return reply.send(bills);
  });

  fastify.post("/yearly", pre, async (req, reply) => {
    const data = createCommittedItemSchema.parse(req.body);
    const bill = await waterfallService.createYearly(req.householdId!, data);
    return reply.status(201).send(bill);
  });

  fastify.patch("/yearly/:id", pre, async (req, reply) => {
    const { id } = req.params as { id: string };
    const data = updateCommittedItemSchema.parse(req.body);
    const bill = await waterfallService.updateYearly(req.householdId!, id, data);
    return reply.send(bill);
  });

  fastify.delete("/yearly/:id", pre, async (req, reply) => {
    const { id } = req.params as { id: string };
    await waterfallService.deleteYearly(req.householdId!, id);
    return reply.status(204).send();
  });

  fastify.post("/yearly/:id/confirm", pre, async (req, reply) => {
    const { id } = req.params as { id: string };
    const bill = await waterfallService.confirmYearly(req.householdId!, id);
    return reply.send(bill);
  });

  // ─── Discretionary ────────────────────────────────────────────────────────

  fastify.get("/discretionary", pre, async (req, reply) => {
    const cats = await waterfallService.listDiscretionary(req.householdId!);
    return reply.send(cats);
  });

  fastify.post("/discretionary", pre, async (req, reply) => {
    const data = createDiscretionaryItemSchema.parse(req.body);
    const cat = await waterfallService.createDiscretionary(req.householdId!, data);
    return reply.status(201).send(cat);
  });

  fastify.patch("/discretionary/:id", pre, async (req, reply) => {
    const { id } = req.params as { id: string };
    const data = updateDiscretionaryItemSchema.parse(req.body);
    const cat = await waterfallService.updateDiscretionary(req.householdId!, id, data);
    return reply.send(cat);
  });

  fastify.delete("/discretionary/:id", pre, async (req, reply) => {
    const { id } = req.params as { id: string };
    await waterfallService.deleteDiscretionary(req.householdId!, id);
    return reply.status(204).send();
  });

  fastify.post("/discretionary/:id/confirm", pre, async (req, reply) => {
    const { id } = req.params as { id: string };
    const cat = await waterfallService.confirmDiscretionary(req.householdId!, id);
    return reply.send(cat);
  });

  // ─── Savings allocations ──────────────────────────────────────────────────

  fastify.get("/savings", pre, async (req, reply) => {
    const allocs = await waterfallService.listSavings(req.householdId!);
    return reply.send(allocs);
  });

  fastify.post("/savings", pre, async (req, reply) => {
    const data = createDiscretionaryItemSchema.parse(req.body);
    const alloc = await waterfallService.createSavings(req.householdId!, data);
    return reply.status(201).send(alloc);
  });

  fastify.patch("/savings/:id", pre, async (req, reply) => {
    const { id } = req.params as { id: string };
    const data = updateDiscretionaryItemSchema.parse(req.body);
    const alloc = await waterfallService.updateSavings(req.householdId!, id, data);
    return reply.send(alloc);
  });

  fastify.delete("/savings/:id", pre, async (req, reply) => {
    const { id } = req.params as { id: string };
    await waterfallService.deleteSavings(req.householdId!, id);
    return reply.status(204).send();
  });

  fastify.post("/savings/:id/confirm", pre, async (req, reply) => {
    const { id } = req.params as { id: string };
    const alloc = await waterfallService.confirmSavings(req.householdId!, id);
    return reply.send(alloc);
  });

  // ─── History ──────────────────────────────────────────────────────────────

  fastify.get("/history/:type/:id", pre, async (req, reply) => {
    const { type, id } = req.params as { type: string; id: string };
    const history = await waterfallService.getHistory(req.householdId!, type, id);
    return reply.send(history);
  });

  // ─── Batch + rebuild ──────────────────────────────────────────────────────

  fastify.post("/confirm-batch", pre, async (req, reply) => {
    const data = confirmBatchSchema.parse(req.body);
    await waterfallService.confirmBatch(req.householdId!, data);
    return reply.status(204).send();
  });

  fastify.delete("/all", pre, async (req, reply) => {
    deleteAllWaterfallSchema.parse(req.body);
    await waterfallService.deleteAll(req.householdId!);
    return reply.status(204).send();
  });

  // ─── Subcategories ─────────────────────────────────────────────────────────

  fastify.get("/subcategories/:tier", pre, async (req, reply) => {
    const { tier } = req.params as { tier: string };
    const parsed = WaterfallTierEnum.safeParse(tier);
    if (!parsed.success) {
      return reply
        .status(400)
        .send({ error: "Invalid tier. Must be: income, committed, or discretionary" });
    }
    const householdId = req.householdId!;
    await subcategoryService.ensureSubcategories(householdId);
    const subcategories = await subcategoryService.listByTier(householdId, parsed.data);
    return reply.send(subcategories);
  });
}
