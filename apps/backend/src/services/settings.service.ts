import { prisma } from "../config/database.js";
import type { UpdateSettingsInput } from "@finplan/shared";

export const settingsService = {
  async getSettings(householdId: string) {
    const existing = await prisma.householdSettings.findUnique({
      where: { householdId },
    });
    if (existing) return existing;
    return prisma.householdSettings.create({ data: { householdId } });
  },

  async updateSettings(householdId: string, data: UpdateSettingsInput) {
    return prisma.householdSettings.upsert({
      where: { householdId },
      create: { householdId, ...data },
      update: data,
    });
  },
};
