import { prisma } from "../config/database.js";
import { confirmedItemsSchema, updatedItemsSchema } from "@finplan/shared";
import type { UpdateReviewSessionInput } from "@finplan/shared";
import { ValidationError } from "../utils/errors.js";
import { audited } from "./audit.service.js";
import type { ActorCtx } from "./audit.service.js";

export const reviewSessionService = {
  async getSession(householdId: string) {
    const session = await prisma.reviewSession.findUnique({ where: { householdId } });
    if (!session) return null;

    const confirmedResult = confirmedItemsSchema.safeParse(session.confirmedItems);
    if (!confirmedResult.success) {
      throw new ValidationError(
        `ReviewSession confirmedItems failed validation: ${confirmedResult.error.message}`
      );
    }

    const updatedResult = updatedItemsSchema.safeParse(session.updatedItems);
    if (!updatedResult.success) {
      throw new ValidationError(
        `ReviewSession updatedItems failed validation: ${updatedResult.error.message}`
      );
    }

    return {
      ...session,
      confirmedItems: confirmedResult.data,
      updatedItems: updatedResult.data,
    };
  },

  async createOrResetSession(householdId: string, ctx?: ActorCtx) {
    if (ctx) {
      return audited({
        db: prisma,
        ctx,
        action: "CREATE_REVIEW_SESSION",
        resource: "review-session",
        resourceId: householdId,
        beforeFetch: async (tx) =>
          tx.reviewSession.findUnique({ where: { householdId } }) as Promise<Record<
            string,
            unknown
          > | null>,
        mutation: async (tx) =>
          tx.reviewSession.upsert({
            where: { householdId },
            create: { householdId },
            update: { currentStep: 0, confirmedItems: {}, updatedItems: {}, startedAt: new Date() },
          }),
      });
    }
    return prisma.reviewSession.upsert({
      where: { householdId },
      create: { householdId },
      update: { currentStep: 0, confirmedItems: {}, updatedItems: {}, startedAt: new Date() },
    });
  },

  async updateSession(householdId: string, data: UpdateReviewSessionInput, ctx?: ActorCtx) {
    if (ctx) {
      return audited({
        db: prisma,
        ctx,
        action: "UPDATE_REVIEW_SESSION",
        resource: "review-session",
        resourceId: householdId,
        beforeFetch: async (tx) =>
          tx.reviewSession.findUnique({ where: { householdId } }) as Promise<Record<
            string,
            unknown
          > | null>,
        mutation: async (tx) =>
          tx.reviewSession.update({
            where: { householdId },
            data,
          }),
      });
    }
    return prisma.reviewSession.update({
      where: { householdId },
      data,
    });
  },

  async deleteSession(householdId: string) {
    await prisma.reviewSession.deleteMany({ where: { householdId } });
  },
};
