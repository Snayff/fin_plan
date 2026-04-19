import type { FastifyInstance } from "fastify";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { prisma } from "../config/database.js";
import { querySecurityActivity } from "../services/security-activity.service.js";
import { SecurityActivityQuerySchema } from "@finplan/shared";

export async function securityActivityRoutes(app: FastifyInstance) {
  app.get("/security-activity", { preHandler: [authMiddleware] }, async (request, reply) => {
    const userId = request.user!.userId;
    const query = SecurityActivityQuerySchema.safeParse(request.query);
    if (!query.success) {
      return reply.status(400).send({ error: query.error.flatten() });
    }
    const result = await querySecurityActivity(prisma, { userId, ...query.data });
    return reply.send(result);
  });
}
