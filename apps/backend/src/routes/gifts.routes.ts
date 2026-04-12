import type { FastifyInstance } from "fastify";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { giftsService } from "../services/gifts.service.js";
import { actorCtx } from "../lib/actor-ctx.js";
import {
  createGiftPersonSchema,
  updateGiftPersonSchema,
  createGiftEventSchema,
  updateGiftEventSchema,
  upsertGiftAllocationSchema,
  bulkUpsertAllocationsSchema,
  setGiftBudgetSchema,
  setGiftPlannerModeSchema,
} from "@finplan/shared";

export async function giftsRoutes(fastify: FastifyInstance) {
  const pre = { preHandler: [authMiddleware] };

  // ─── Reads ──────────────────────────────────────────────────────────────────

  fastify.get("/state", pre, async (req, reply) => {
    const { year } = req.query as { year?: string };
    const y = year ? parseInt(year, 10) : new Date().getFullYear();
    await giftsService.seedLockedEventsIfMissing(req.householdId!);
    await giftsService.runRolloverIfNeeded(req.householdId!, y);
    const state = await giftsService.getPlannerState(req.householdId!, y, req.user!.userId);
    return reply.send(state);
  });

  fastify.get("/people/:id", pre, async (req, reply) => {
    const { id } = req.params as { id: string };
    const { year } = req.query as { year?: string };
    const y = year ? parseInt(year, 10) : new Date().getFullYear();
    const detail = await giftsService.getPersonDetail(req.householdId!, id, y);
    return reply.send(detail);
  });

  fastify.get("/upcoming", pre, async (req, reply) => {
    const { year } = req.query as { year?: string };
    const y = year ? parseInt(year, 10) : new Date().getFullYear();
    const view = await giftsService.getUpcoming(req.householdId!, y);
    return reply.send(view);
  });

  fastify.get("/years", pre, async (req, reply) => {
    const years = await giftsService.listYearsWithData(req.householdId!);
    return reply.send(years);
  });

  fastify.get("/config/people", pre, async (req, reply) => {
    const { filter } = req.query as { filter?: "all" | "household" | "non-household" };
    const list = await giftsService.listPeopleForConfig(req.householdId!, filter ?? "all");
    return reply.send(list);
  });

  fastify.get("/config/events", pre, async (req, reply) => {
    const list = await giftsService.listEventsForConfig(req.householdId!);
    return reply.send(list);
  });

  // ─── People mutations ───────────────────────────────────────────────────────

  fastify.post("/people", pre, async (req, reply) => {
    const data = createGiftPersonSchema.parse(req.body);
    const person = await giftsService.createPerson(req.householdId!, data);
    return reply.status(201).send(person);
  });

  fastify.patch("/people/:id", pre, async (req, reply) => {
    const { id } = req.params as { id: string };
    const data = updateGiftPersonSchema.parse(req.body);
    const person = await giftsService.updatePerson(req.householdId!, id, data);
    return reply.send(person);
  });

  fastify.delete("/people/:id", pre, async (req, reply) => {
    const { id } = req.params as { id: string };
    await giftsService.deletePerson(req.householdId!, id);
    return reply.status(204).send();
  });

  // ─── Event mutations ────────────────────────────────────────────────────────

  fastify.post("/events", pre, async (req, reply) => {
    const data = createGiftEventSchema.parse(req.body);
    const event = await giftsService.createEvent(req.householdId!, data);
    return reply.status(201).send(event);
  });

  fastify.patch("/events/:id", pre, async (req, reply) => {
    const { id } = req.params as { id: string };
    const data = updateGiftEventSchema.parse(req.body);
    const event = await giftsService.updateEvent(req.householdId!, id, data);
    return reply.send(event);
  });

  fastify.delete("/events/:id", pre, async (req, reply) => {
    const { id } = req.params as { id: string };
    await giftsService.deleteEvent(req.householdId!, id);
    return reply.status(204).send();
  });

  // ─── Allocation mutations ───────────────────────────────────────────────────

  fastify.put("/allocations/:personId/:eventId/:year", pre, async (req, reply) => {
    const { personId, eventId, year } = req.params as {
      personId: string;
      eventId: string;
      year: string;
    };
    const data = upsertGiftAllocationSchema.parse(req.body);
    const result = await giftsService.upsertAllocation(
      req.householdId!,
      personId,
      eventId,
      parseInt(year, 10),
      data
    );
    return reply.send(result);
  });

  fastify.post("/allocations/bulk", pre, async (req, reply) => {
    const data = bulkUpsertAllocationsSchema.parse(req.body);
    const result = await giftsService.bulkUpsertAllocations(req.householdId!, data);
    return reply.send(result);
  });

  // ─── Budget + mode ──────────────────────────────────────────────────────────

  fastify.put("/budget/:year", pre, async (req, reply) => {
    const { year } = req.params as { year: string };
    const data = setGiftBudgetSchema.parse(req.body);
    const result = await giftsService.setAnnualBudget(req.householdId!, parseInt(year, 10), data);
    return reply.send(result);
  });

  fastify.put("/mode", pre, async (req, reply) => {
    const data = setGiftPlannerModeSchema.parse(req.body);
    const result = await giftsService.setMode(req.householdId!, data, actorCtx(req));
    return reply.send(result);
  });

  // ─── Rollover banner ────────────────────────────────────────────────────────

  fastify.delete("/rollover-banner/:year", pre, async (req, reply) => {
    const { year } = req.params as { year: string };
    await giftsService.dismissRolloverNotification(
      req.householdId!,
      req.user!.userId,
      parseInt(year, 10)
    );
    return reply.status(204).send();
  });
}
