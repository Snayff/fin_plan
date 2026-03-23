import type { FastifyInstance } from "fastify";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { plannerService } from "../services/planner.service.js";
import {
  createPurchaseSchema,
  updatePurchaseSchema,
  upsertYearBudgetSchema,
  createGiftPersonSchema,
  updateGiftPersonSchema,
  createGiftEventSchema,
  updateGiftEventSchema,
  upsertGiftYearRecordSchema,
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
    const purchase = await plannerService.createPurchase(req.householdId!, data);
    return reply.status(201).send(purchase);
  });

  fastify.patch("/purchases/:id", pre, async (req, reply) => {
    const { id } = req.params as { id: string };
    const data = updatePurchaseSchema.parse(req.body);
    const purchase = await plannerService.updatePurchase(req.householdId!, id, data);
    return reply.send(purchase);
  });

  fastify.delete("/purchases/:id", pre, async (req, reply) => {
    const { id } = req.params as { id: string };
    await plannerService.deletePurchase(req.householdId!, id);
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
      data
    );
    return reply.send(budget);
  });

  // ─── Upcoming gifts ───────────────────────────────────────────────────────

  fastify.get("/gifts/upcoming", pre, async (req, reply) => {
    const { year } = req.query as { year?: string };
    const y = year ? parseInt(year, 10) : new Date().getFullYear();
    const upcoming = await plannerService.getUpcomingGifts(req.householdId!, y);
    return reply.send(upcoming);
  });

  // ─── Gift persons ─────────────────────────────────────────────────────────

  fastify.get("/gifts/persons", pre, async (req, reply) => {
    const { year } = req.query as { year?: string };
    const y = year ? parseInt(year, 10) : new Date().getFullYear();
    const persons = await plannerService.listGiftPersons(req.householdId!, y);
    return reply.send(persons);
  });

  fastify.post("/gifts/persons", pre, async (req, reply) => {
    const data = createGiftPersonSchema.parse(req.body);
    const person = await plannerService.createGiftPerson(req.householdId!, data);
    return reply.status(201).send(person);
  });

  fastify.get("/gifts/persons/:id", pre, async (req, reply) => {
    const { id } = req.params as { id: string };
    const { year } = req.query as { year?: string };
    const y = year ? parseInt(year, 10) : new Date().getFullYear();
    const person = await plannerService.getGiftPerson(req.householdId!, id, y);
    return reply.send(person);
  });

  fastify.patch("/gifts/persons/:id", pre, async (req, reply) => {
    const { id } = req.params as { id: string };
    const data = updateGiftPersonSchema.parse(req.body);
    const person = await plannerService.updateGiftPerson(req.householdId!, id, data);
    return reply.send(person);
  });

  fastify.delete("/gifts/persons/:id", pre, async (req, reply) => {
    const { id } = req.params as { id: string };
    await plannerService.deleteGiftPerson(req.householdId!, id);
    return reply.status(204).send();
  });

  // ─── Gift events ──────────────────────────────────────────────────────────

  fastify.post("/gifts/persons/:id/events", pre, async (req, reply) => {
    const { id } = req.params as { id: string };
    const data = createGiftEventSchema.parse(req.body);
    const event = await plannerService.createGiftEvent(req.householdId!, id, data);
    return reply.status(201).send(event);
  });

  fastify.patch("/gifts/events/:id", pre, async (req, reply) => {
    const { id } = req.params as { id: string };
    const data = updateGiftEventSchema.parse(req.body);
    const event = await plannerService.updateGiftEvent(req.householdId!, id, data);
    return reply.send(event);
  });

  fastify.delete("/gifts/events/:id", pre, async (req, reply) => {
    const { id } = req.params as { id: string };
    await plannerService.deleteGiftEvent(req.householdId!, id);
    return reply.status(204).send();
  });

  // ─── Gift year records ────────────────────────────────────────────────────

  fastify.put("/gifts/events/:id/year/:year", pre, async (req, reply) => {
    const { id, year } = req.params as { id: string; year: string };
    const data = upsertGiftYearRecordSchema.parse(req.body);
    const record = await plannerService.upsertGiftYearRecord(
      req.householdId!,
      id,
      parseInt(year, 10),
      data
    );
    return reply.send(record);
  });
}
