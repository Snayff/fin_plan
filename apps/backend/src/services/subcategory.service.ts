import type { WaterfallTier } from "@finplan/shared";
import { prisma } from "../config/database.js";

const DEFAULT_SUBCATEGORIES = {
  income: [
    { name: "Salary", sortOrder: 0 },
    { name: "Dividends", sortOrder: 1 },
    { name: "Other", sortOrder: 2 },
  ],
  committed: [
    { name: "Housing", sortOrder: 0 },
    { name: "Utilities", sortOrder: 1 },
    { name: "Services", sortOrder: 2 },
    { name: "Charity", sortOrder: 3 },
    { name: "Childcare", sortOrder: 4 },
    { name: "Vehicles", sortOrder: 5 },
    { name: "Other", sortOrder: 6 },
  ],
  discretionary: [
    { name: "Food", sortOrder: 0 },
    { name: "Fun", sortOrder: 1 },
    { name: "Clothes", sortOrder: 2 },
    { name: "Gifts", sortOrder: 3, isLocked: true },
    { name: "Savings", sortOrder: 4 },
    { name: "Other", sortOrder: 5 },
  ],
} as const;

export const subcategoryService = {
  async seedDefaults(householdId: string) {
    const rows: {
      householdId: string;
      tier: "income" | "committed" | "discretionary";
      name: string;
      sortOrder: number;
      isLocked: boolean;
      isDefault: boolean;
    }[] = [];

    for (const [tier, subs] of Object.entries(DEFAULT_SUBCATEGORIES)) {
      for (const sub of subs) {
        rows.push({
          householdId,
          tier: tier as "income" | "committed" | "discretionary",
          name: sub.name,
          sortOrder: sub.sortOrder,
          isLocked: "isLocked" in sub ? sub.isLocked : false,
          isDefault: true,
        });
      }
    }

    await prisma.subcategory.createMany({ data: rows, skipDuplicates: true });
  },

  async ensureSubcategories(householdId: string) {
    const count = await prisma.subcategory.count({ where: { householdId } });
    if (count === 0) {
      await this.seedDefaults(householdId);
    }
  },

  async listByTier(householdId: string, tier: WaterfallTier) {
    return prisma.subcategory.findMany({
      where: { householdId, tier },
      orderBy: { sortOrder: "asc" },
    });
  },

  async getDefaultSubcategoryId(householdId: string, tier: WaterfallTier): Promise<string> {
    const sub = await prisma.subcategory.findFirst({
      where: { householdId, tier, name: "Other" },
    });
    if (!sub) {
      throw new Error(`Default subcategory not found for tier "${tier}"`);
    }
    return sub.id;
  },

  async getSubcategoryIdByName(
    householdId: string,
    tier: WaterfallTier,
    name: string
  ): Promise<string | null> {
    const sub = await prisma.subcategory.findFirst({
      where: { householdId, tier, name },
    });
    return sub?.id ?? null;
  },
};
