import { prisma } from "../config/database.js";
import { NotFoundError } from "../utils/errors.js";
import { audited } from "./audit.service.js";
import type { ActorCtx } from "./audit.service.js";
import type {
  CreatePurchaseInput,
  UpdatePurchaseInput,
  UpsertYearBudgetInput,
} from "@finplan/shared";

function assertOwned(item: { householdId: string } | null, householdId: string, label: string) {
  if (!item) throw new NotFoundError(`${label} not found`);
  if (item.householdId !== householdId) throw new NotFoundError(`${label} not found`);
}

export const plannerService = {
  // ─── Purchases ────────────────────────────────────────────────────────────

  async listPurchases(householdId: string, year: number) {
    return prisma.purchaseItem.findMany({
      where: { householdId, yearAdded: year },
      orderBy: [{ scheduledThisYear: "desc" }, { priority: "desc" }, { createdAt: "asc" }],
    });
  },

  async createPurchase(householdId: string, data: CreatePurchaseInput, ctx?: ActorCtx) {
    if (ctx) {
      return audited({
        db: prisma,
        ctx,
        action: "CREATE_PLANNER_GOAL",
        resource: "planner-goal",
        resourceId: "",
        beforeFetch: async () => null,
        mutation: async (tx) =>
          tx.purchaseItem.create({
            data: { ...data, householdId, yearAdded: new Date().getFullYear() },
          }),
      });
    }
    return prisma.purchaseItem.create({
      data: { ...data, householdId, yearAdded: new Date().getFullYear() },
    });
  },

  async updatePurchase(householdId: string, id: string, data: UpdatePurchaseInput, ctx?: ActorCtx) {
    const existing = await prisma.purchaseItem.findUnique({ where: { id } });
    assertOwned(existing, householdId, "Purchase");
    if (ctx) {
      return audited({
        db: prisma,
        ctx,
        action: "UPDATE_PLANNER_GOAL",
        resource: "planner-goal",
        resourceId: id,
        beforeFetch: async (tx) =>
          tx.purchaseItem.findUnique({ where: { id } }) as Promise<Record<string, unknown> | null>,
        mutation: async (tx) => tx.purchaseItem.update({ where: { id }, data }),
      });
    }
    return prisma.purchaseItem.update({ where: { id }, data });
  },

  async deletePurchase(householdId: string, id: string, ctx?: ActorCtx) {
    const existing = await prisma.purchaseItem.findUnique({ where: { id } });
    assertOwned(existing, householdId, "Purchase");
    if (ctx) {
      await audited({
        db: prisma,
        ctx,
        action: "DELETE_PLANNER_GOAL",
        resource: "planner-goal",
        resourceId: id,
        beforeFetch: async (tx) =>
          tx.purchaseItem.findUnique({ where: { id } }) as Promise<Record<string, unknown> | null>,
        mutation: async (tx) => {
          await tx.purchaseItem.delete({ where: { id } });
          return null;
        },
      });
      return;
    }
    await prisma.purchaseItem.delete({ where: { id } });
  },

  // ─── Year budget ──────────────────────────────────────────────────────────

  async getYearBudget(householdId: string, year: number) {
    const existing = await prisma.plannerYearBudget.findUnique({
      where: { householdId_year: { householdId, year } },
    });
    if (existing) return existing;
    // Auto-create with defaults
    return prisma.plannerYearBudget.create({ data: { householdId, year } });
  },

  async upsertYearBudget(householdId: string, year: number, data: UpsertYearBudgetInput) {
    return prisma.plannerYearBudget.upsert({
      where: { householdId_year: { householdId, year } },
      create: { householdId, year, ...data },
      update: data,
    });
  },
};
