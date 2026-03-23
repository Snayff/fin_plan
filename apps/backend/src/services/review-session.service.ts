import { prisma } from "../config/database.js";
import type { UpdateReviewSessionInput } from "@finplan/shared";

export const reviewSessionService = {
  async getSession(householdId: string) {
    return prisma.reviewSession.findUnique({ where: { householdId } });
  },

  async createOrResetSession(householdId: string) {
    return prisma.reviewSession.upsert({
      where: { householdId },
      create: { householdId },
      update: { currentStep: 0, confirmedItems: {}, updatedItems: {}, startedAt: new Date() },
    });
  },

  async updateSession(householdId: string, data: UpdateReviewSessionInput) {
    return prisma.reviewSession.update({
      where: { householdId },
      data,
    });
  },

  async deleteSession(householdId: string) {
    await prisma.reviewSession.deleteMany({ where: { householdId } });
  },
};
