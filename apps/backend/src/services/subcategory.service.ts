import type {
  WaterfallTier,
  BatchSaveSubcategoriesInput,
  ResetSubcategoriesInput,
} from "@finplan/shared";
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

  async getItemCounts(householdId: string, tier: WaterfallTier): Promise<Record<string, number>> {
    const model =
      tier === "income"
        ? prisma.incomeSource
        : tier === "committed"
          ? prisma.committedItem
          : prisma.discretionaryItem;

    const groups = await (model as any).groupBy({
      by: ["subcategoryId"],
      where: { householdId },
      _count: { id: true },
    });

    const counts: Record<string, number> = {};
    for (const g of groups) {
      counts[g.subcategoryId] = g._count.id;
    }
    return counts;
  },

  async batchSave(householdId: string, tier: WaterfallTier, input: BatchSaveSubcategoriesInput) {
    const { subcategories: desired, reassignments } = input;

    // ── Validation ────────────────────────────────────────────────────────────
    if (desired.length > 7) {
      throw new Error("Maximum 7 subcategories per tier");
    }

    // Other must be present
    const otherEntry = desired.find((s) => s.name === "Other");
    if (!otherEntry) {
      throw new Error("'Other' subcategory must be present in every tier");
    }

    // Other must be last by sortOrder
    const maxSort = Math.max(...desired.map((s) => s.sortOrder));
    if (otherEntry.sortOrder !== maxSort) {
      throw new Error("'Other' must be last in sort order");
    }

    // No new subcategory named "Other" (case-insensitive) besides the existing one
    const otherDuplicates = desired.filter(
      (s) => s.name.toLowerCase() === "other" && s !== otherEntry
    );
    if (otherDuplicates.length > 0) {
      throw new Error("The name 'Other' is reserved");
    }

    // Unique names (case-insensitive)
    const lowerNames = desired.map((s) => s.name.toLowerCase());
    if (new Set(lowerNames).size !== lowerNames.length) {
      throw new Error("Subcategory names must be unique within a tier");
    }

    // Fetch current state
    const existing = await prisma.subcategory.findMany({
      where: { householdId, tier },
    });
    const existingById = new Map(existing.map((s) => [s.id, s]));

    // Check locked subcategories are not renamed or removed
    for (const ex of existing) {
      if (!ex.isLocked) continue;
      const match = desired.find((d) => d.id === ex.id);
      if (!match) {
        throw new Error(`Cannot remove locked subcategory "${ex.name}"`);
      }
      if (match.name !== ex.name) {
        throw new Error(`Cannot rename locked subcategory "${ex.name}"`);
      }
    }

    // Validate reassignment IDs belong to this household's tier
    const existingIds = new Set(existing.map((s) => s.id));
    const desiredIds = new Set(desired.filter((d) => d.id).map((d) => d.id!));
    for (const r of reassignments) {
      if (!existingIds.has(r.fromSubcategoryId)) {
        throw new Error(`Reassignment source "${r.fromSubcategoryId}" not found in household`);
      }
      if (!desiredIds.has(r.toSubcategoryId) && !existingIds.has(r.toSubcategoryId)) {
        throw new Error(`Reassignment destination "${r.toSubcategoryId}" not found`);
      }
    }

    // ── Apply in transaction ──────────────────────────────────────────────────
    await prisma.$transaction(async (tx) => {
      const itemModel =
        tier === "income"
          ? tx.incomeSource
          : tier === "committed"
            ? tx.committedItem
            : tx.discretionaryItem;

      // 1. Reassign items from removed subcategories
      for (const r of reassignments) {
        await (itemModel as any).updateMany({
          where: { subcategoryId: r.fromSubcategoryId, householdId },
          data: { subcategoryId: r.toSubcategoryId },
        });
      }

      // 2. Delete removed subcategories
      const removedIds = existing
        .filter((ex) => !desired.some((d) => d.id === ex.id))
        .map((ex) => ex.id);
      for (const id of removedIds) {
        await tx.subcategory.delete({ where: { id } });
      }

      // 3. Update existing subcategories
      for (const d of desired) {
        if (d.id && existingById.has(d.id)) {
          await tx.subcategory.update({
            where: { id: d.id },
            data: { name: d.name, sortOrder: d.sortOrder },
          });
        }
      }

      // 4. Create new subcategories
      for (const d of desired) {
        if (!d.id) {
          await tx.subcategory.create({
            data: {
              householdId,
              tier,
              name: d.name,
              sortOrder: d.sortOrder,
              isLocked: false,
              isDefault: false,
            },
          });
        }
      }
    });
  },

  getDefaults() {
    return DEFAULT_SUBCATEGORIES;
  },

  async resetToDefaults(householdId: string, input: ResetSubcategoriesInput) {
    const { reassignments } = input;
    const tiers = ["income", "committed", "discretionary"] as const;

    // Fetch all existing subcategories across all tiers
    const allExisting: Array<{ id: string; tier: string; householdId: string }> = [];
    for (const tier of tiers) {
      const subs = await prisma.subcategory.findMany({
        where: { householdId, tier },
      });
      allExisting.push(...subs);
    }
    const existingIds = new Set(allExisting.map((s) => s.id));

    // Validate reassignment source IDs
    for (const r of reassignments) {
      if (!existingIds.has(r.fromSubcategoryId)) {
        throw new Error(`Reassignment source "${r.fromSubcategoryId}" not found in household`);
      }
    }

    await prisma.$transaction(async (tx) => {
      // 1. Reassign items for each reassignment
      for (const r of reassignments) {
        const source = allExisting.find((s) => s.id === r.fromSubcategoryId);
        if (!source) continue;
        const tier = source.tier as WaterfallTier;
        const itemModel =
          tier === "income"
            ? tx.incomeSource
            : tier === "committed"
              ? tx.committedItem
              : tx.discretionaryItem;

        await (itemModel as any).updateMany({
          where: { subcategoryId: r.fromSubcategoryId, householdId },
          data: { subcategoryId: r.toSubcategoryId },
        });
      }

      // 2. Delete all existing subcategories across all tiers
      await tx.subcategory.deleteMany({ where: { householdId } });

      // 3. Re-seed defaults
      const rows: Array<{
        householdId: string;
        tier: "income" | "committed" | "discretionary";
        name: string;
        sortOrder: number;
        isLocked: boolean;
        isDefault: boolean;
      }> = [];
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
      await tx.subcategory.createMany({ data: rows });
    });
  },
};
