import type { FastifyInstance } from "fastify";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { prisma } from "../config/database.js";
import { queryAuditLog } from "../services/audit-log.service.js";
import { AuditLogQuerySchema } from "@finplan/shared";

export async function auditLogRoutes(app: FastifyInstance) {
  app.get("/audit-log", { preHandler: [authMiddleware] }, async (request, reply) => {
    const userId = request.user!.userId;
    const householdId = request.householdId!;

    // Verify caller is owner or admin
    const membership = await prisma.householdMember.findUnique({
      where: {
        householdId_userId: { householdId, userId },
      },
    });

    if (!membership || (membership.role !== "owner" && membership.role !== "admin")) {
      return reply.status(403).send({ error: "Forbidden" });
    }

    const query = AuditLogQuerySchema.safeParse(request.query);
    if (!query.success) {
      return reply.status(400).send({ error: query.error.flatten() });
    }

    const result = await queryAuditLog(prisma, {
      householdId,
      ...query.data,
    });

    return reply.send(result);
  });
}
