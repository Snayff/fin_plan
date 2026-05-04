import type { FastifyInstance } from "fastify";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { settingsService } from "../services/settings.service.js";
import { updateSettingsSchema } from "@finplan/shared";
import { actorCtx } from "../lib/actor-ctx.js";
import { prisma } from "../config/database.js";
import { assertOwnerOrAdmin } from "../services/household.service.js";

export async function settingsRoutes(fastify: FastifyInstance) {
  const pre = { preHandler: [authMiddleware] };

  fastify.get("/", pre, async (req, reply) => {
    const settings = await settingsService.getSettings(req.householdId!);
    return reply.send(settings);
  });

  fastify.patch("/", pre, async (req, reply) => {
    const data = updateSettingsSchema.parse(req.body);
    const growthRateFields = [
      "currentRatePct",
      "savingsRatePct",
      "investmentRatePct",
      "pensionRatePct",
      "inflationRatePct",
      "propertyRatePct",
      "vehicleRatePct",
      "otherAssetRatePct",
    ] as const;
    const hasGrowthRateChange = growthRateFields.some((f) => f in (req.body as object));
    if (hasGrowthRateChange) {
      const callerId = req.user!.userId;
      const member = await prisma.member.findFirst({
        where: { householdId: req.householdId!, userId: callerId },
        select: { role: true },
      });
      assertOwnerOrAdmin(member?.role ?? "member");
    }
    const settings = await settingsService.updateSettings(req.householdId!, data, actorCtx(req));
    return reply.send(settings);
  });
}
