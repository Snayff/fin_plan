import { prisma } from "../config/database.js";
import { audited } from "./audit.service.js";
import type { ActorCtx } from "./audit.service.js";
import type { UpdateSetupSessionInput } from "@finplan/shared";

export const setupSessionService = {
  async getSession(householdId: string) {
    return prisma.waterfallSetupSession.findUnique({ where: { householdId } });
  },

  async createOrResetSession(householdId: string, ctx: ActorCtx) {
    return audited({
      db: prisma,
      ctx,
      action: "CREATE_SETUP_SESSION",
      resource: "setup-session",
      resourceId: householdId,
      beforeFetch: async (tx) =>
        tx.waterfallSetupSession.findUnique({ where: { householdId } }) as Promise<Record<
          string,
          unknown
        > | null>,
      mutation: async (tx) =>
        tx.waterfallSetupSession.upsert({
          where: { householdId },
          create: { householdId },
          update: { currentStep: 0, startedAt: new Date() },
        }),
    });
  },

  async updateSession(householdId: string, data: UpdateSetupSessionInput, ctx: ActorCtx) {
    return audited({
      db: prisma,
      ctx,
      action: "UPDATE_SETUP_SESSION",
      resource: "setup-session",
      resourceId: householdId,
      beforeFetch: async (tx) =>
        tx.waterfallSetupSession.findUnique({ where: { householdId } }) as Promise<Record<
          string,
          unknown
        > | null>,
      mutation: async (tx) =>
        tx.waterfallSetupSession.update({
          where: { householdId },
          data,
        }),
    });
  },

  async deleteSession(householdId: string) {
    await prisma.waterfallSetupSession.deleteMany({ where: { householdId } });
  },
};
