import type { FastifyInstance } from "fastify";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { reviewSessionService } from "../services/review-session.service.js";
import { updateReviewSessionSchema } from "@finplan/shared";

export async function reviewRoutes(fastify: FastifyInstance) {
  const pre = { preHandler: [authMiddleware] };

  fastify.get("/", pre, async (req, reply) => {
    const session = await reviewSessionService.getSession(req.householdId!);
    return reply.send(session ?? null);
  });

  fastify.post("/", pre, async (req, reply) => {
    const session = await reviewSessionService.createOrResetSession(req.householdId!);
    return reply.status(201).send(session);
  });

  fastify.patch("/", pre, async (req, reply) => {
    const data = updateReviewSessionSchema.parse(req.body);
    const session = await reviewSessionService.updateSession(req.householdId!, data);
    return reply.send(session);
  });

  fastify.delete("/", pre, async (req, reply) => {
    await reviewSessionService.deleteSession(req.householdId!);
    return reply.status(204).send();
  });
}
