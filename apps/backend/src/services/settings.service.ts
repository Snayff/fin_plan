import { prisma } from "../config/database.js";
import type { UpdateSettingsInput } from "@finplan/shared";
import { audited } from "./audit.service.js";
import type { ActorCtx } from "./audit.service.js";

export const settingsService = {
  async getSettings(householdId: string) {
    const existing = await prisma.householdSettings.findUnique({
      where: { householdId },
    });
    if (existing) return existing;
    return prisma.householdSettings.create({ data: { householdId } });
  },

  async updateSettings(householdId: string, data: UpdateSettingsInput, ctx: ActorCtx) {
    return audited({
      db: prisma,
      ctx,
      action: "UPDATE_HOUSEHOLD_SETTINGS",
      resource: "household-settings",
      resourceId: householdId,
      beforeFetch: async (tx) =>
        tx.householdSettings.findUnique({ where: { householdId } }) as Promise<Record<
          string,
          unknown
        > | null>,
      mutation: async (tx) =>
        tx.householdSettings.upsert({
          where: { householdId },
          create: { householdId, ...data },
          update: data,
        }),
    });
  },
};
