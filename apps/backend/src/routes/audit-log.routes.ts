import type { FastifyInstance } from "fastify";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { prisma } from "../config/database.js";
import { queryAuditLog } from "../services/audit-log.service.js";
import { AuthorizationError } from "../utils/errors.js";
import { AuditLogQuerySchema } from "@finplan/shared";

export async function auditLogRoutes(app: FastifyInstance) {
  app.get("/audit-log", { preHandler: [authMiddleware] }, async (request, reply) => {
    const userId = request.user!.userId;
    const householdId = request.householdId!;

    // Verify caller is owner or admin
    const membership = await prisma.member.findFirst({
      where: { householdId, userId },
    });

    if (!membership || (membership.role !== "owner" && membership.role !== "admin")) {
      throw new AuthorizationError("Forbidden");
    }

    const query = AuditLogQuerySchema.parse(request.query);

    const result = await queryAuditLog(prisma, {
      householdId,
      ...query,
    });

    return reply.send(result);
  });
}
