import type { FastifyInstance } from "fastify";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { setupSessionService } from "../services/setup-session.service.js";
import { updateSetupSessionSchema } from "@finplan/shared";

export async function setupRoutes(fastify: FastifyInstance) {
  const pre = { preHandler: [authMiddleware] };

  fastify.get("/", pre, async (req, reply) => {
    const session = await setupSessionService.getSession(req.householdId!);
    return reply.send(session ?? null);
  });

  fastify.post("/", pre, async (req, reply) => {
    const session = await setupSessionService.createOrResetSession(req.householdId!);
    return reply.status(201).send(session);
  });

  fastify.patch("/", pre, async (req, reply) => {
    const data = updateSetupSessionSchema.parse(req.body);
    const session = await setupSessionService.updateSession(req.householdId!, data);
    return reply.send(session);
  });

  fastify.delete("/", pre, async (req, reply) => {
    await setupSessionService.deleteSession(req.householdId!);
    return reply.status(204).send();
  });
}
