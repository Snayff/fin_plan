import { prisma } from "../config/database.js";
import type { UpdateSetupSessionInput } from "@finplan/shared";

export const setupSessionService = {
  async getSession(householdId: string) {
    return prisma.waterfallSetupSession.findUnique({ where: { householdId } });
  },

  async createOrResetSession(householdId: string) {
    return prisma.waterfallSetupSession.upsert({
      where: { householdId },
      create: { householdId },
      update: { currentStep: 0, startedAt: new Date() },
    });
  },

  async updateSession(householdId: string, data: UpdateSetupSessionInput) {
    return prisma.waterfallSetupSession.update({
      where: { householdId },
      data,
    });
  },

  async deleteSession(householdId: string) {
    await prisma.waterfallSetupSession.deleteMany({ where: { householdId } });
  },
};
