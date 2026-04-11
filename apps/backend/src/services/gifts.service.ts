import { prisma } from "../config/database.js";
import { NotFoundError, ConflictError } from "../utils/errors.js";
import type { CreateGiftPersonInput, UpdateGiftPersonInput } from "@finplan/shared";

function assertOwned(item: { householdId: string } | null, householdId: string, label: string) {
  if (!item) throw new NotFoundError(`${label} not found`);
  if (item.householdId !== householdId) throw new NotFoundError(`${label} not found`);
}

export const giftsService = {
  async getOrCreateSettings(householdId: string) {
    const existing = await prisma.giftPlannerSettings.findUnique({
      where: { householdId },
    });
    if (existing) return existing;
    return prisma.giftPlannerSettings.create({
      data: { householdId, mode: "synced" },
    });
  },

  // ─── People ─────────────────────────────────────────────────────────────────
  async listPeople(householdId: string) {
    return prisma.giftPerson.findMany({
      where: { householdId },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    });
  },

  async createPerson(householdId: string, data: CreateGiftPersonInput) {
    try {
      return await prisma.giftPerson.create({ data: { householdId, ...data } });
    } catch (err: any) {
      if (err?.code === "P2002") {
        throw new ConflictError("A gift person with that name already exists");
      }
      throw err;
    }
  },

  async updatePerson(householdId: string, id: string, data: UpdateGiftPersonInput) {
    const existing = await prisma.giftPerson.findUnique({ where: { id } });
    assertOwned(existing, householdId, "Gift person");
    try {
      return await prisma.giftPerson.update({ where: { id }, data });
    } catch (err: any) {
      if (err?.code === "P2002") {
        throw new ConflictError("A gift person with that name already exists");
      }
      throw err;
    }
  },

  async deletePerson(householdId: string, id: string) {
    const existing = await prisma.giftPerson.findUnique({ where: { id } });
    assertOwned(existing, householdId, "Gift person");
    await prisma.giftPerson.delete({ where: { id } });
  },
};
