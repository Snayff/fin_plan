import type { FastifyInstance } from "fastify";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { settingsService } from "../services/settings.service.js";
import { updateSettingsSchema } from "@finplan/shared";
import { actorCtx } from "../lib/actor-ctx.js";

export async function settingsRoutes(fastify: FastifyInstance) {
  const pre = { preHandler: [authMiddleware] };

  fastify.get("/", pre, async (req, reply) => {
    const settings = await settingsService.getSettings(req.householdId!);
    return reply.send(settings);
  });

  fastify.patch("/", pre, async (req, reply) => {
    const data = updateSettingsSchema.parse(req.body);
    const settings = await settingsService.updateSettings(req.householdId!, data, actorCtx(req));
    return reply.send(settings);
  });
}
