import { prisma } from "../config/database.js";
import { NotFoundError } from "../utils/errors.js";
import { toGBP } from "@finplan/shared";
import type {
  CreateIncomeSourceInput,
  UpdateIncomeSourceInput,
  EndIncomeSourceInput,
  ConfirmBatchInput,
  WaterfallSummary,
  CashflowMonth,
  IncomeType,
  IncomeByType,
  IncomeSourceRow,
  CreateCommittedItemInput,
  UpdateCommittedItemInput,
  CreateDiscretionaryItemInput,
  UpdateDiscretionaryItemInput,
} from "@finplan/shared";

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function recordHistory(itemType: string, itemId: string, value: number) {
  await prisma.waterfallHistory.create({
    data: {
      itemType: itemType as any,
      itemId,
      value,
      recordedAt: new Date(),
    },
  });
}

function assertOwned(item: { householdId: string } | null, householdId: string, label: string) {
  if (!item) throw new NotFoundError(`${label} not found`);
  if (item.householdId !== householdId) throw new NotFoundError(`${label} not found`);
}

// ─── Summary ─────────────────────────────────────────────────────────────────

export const waterfallService = {
  async getWaterfallSummary(householdId: string): Promise<WaterfallSummary> {
    const now = new Date();

    const [incomeSources, committedItems, discretionaryItems] = await Promise.all([
      prisma.incomeSource.findMany({
        where: { householdId, OR: [{ endedAt: null }, { endedAt: { gt: now } }] },
        orderBy: { sortOrder: "asc" },
      }),
      prisma.committedItem.findMany({ where: { householdId }, orderBy: { sortOrder: "asc" } }),
      prisma.discretionaryItem.findMany({ where: { householdId }, orderBy: { sortOrder: "asc" } }),
    ]);

    const monthlyIncome = incomeSources.filter((s) => s.frequency === "monthly");
    const annualIncome = incomeSources.filter((s) => s.frequency === "annual");
    const oneOffIncome = incomeSources.filter((s) => s.frequency === "one_off");

    const incomeTotal = toGBP(
      monthlyIncome.reduce((s, i) => s + i.amount, 0) +
        annualIncome.reduce((s, i) => s + i.amount / 12, 0)
    );

    // Group active non-oneOff sources by incomeType for left panel navigation
    const INCOME_TYPE_LABELS: Record<IncomeType, string> = {
      salary: "Salary",
      dividends: "Dividends",
      freelance: "Freelance",
      rental: "Rental",
      benefits: "Benefits",
      other: "Other",
    };

    const annualWithMonthly = annualIncome.map((s) => ({ ...s, monthlyAmount: s.amount / 12 }));
    const activeNonOneOff: IncomeSourceRow[] = [...monthlyIncome, ...annualWithMonthly];
    const typeMap = new Map<IncomeType, IncomeSourceRow[]>();
    for (const src of activeNonOneOff) {
      const group = typeMap.get(src.incomeType) ?? [];
      group.push(src);
      typeMap.set(src.incomeType, group);
    }

    const byType: IncomeByType[] = Array.from(typeMap.entries()).map(([type, sources]) => ({
      type,
      label: INCOME_TYPE_LABELS[type],
      monthlyTotal: sources.reduce((sum, src) => {
        if (src.frequency === "annual") {
          return sum + src.amount / 12;
        }
        return sum + src.amount;
      }, 0),
      sources,
    }));

    // Committed: monthly items at face value, yearly items averaged over 12
    const monthlyCommitted = committedItems.filter((i) => i.spendType === "monthly");
    const yearlyCommitted = committedItems.filter((i) => i.spendType === "yearly");

    const committedMonthlyTotal = monthlyCommitted.reduce((s, b) => s + b.amount, 0);
    const yearlyMonthlyAvg = toGBP(yearlyCommitted.reduce((s, b) => s + b.amount, 0) / 12);

    // Detect savings subcategory to split discretionary items
    const savingsSubcategory = await prisma.subcategory.findFirst({
      where: { householdId, tier: "discretionary", name: "Savings" },
    });

    const savingsItems = savingsSubcategory
      ? discretionaryItems.filter((i) => i.subcategoryId === savingsSubcategory.id)
      : [];
    const categoryItems = savingsSubcategory
      ? discretionaryItems.filter((i) => i.subcategoryId !== savingsSubcategory.id)
      : discretionaryItems;

    // Discretionary: all items summed for waterfall total
    const discretionaryTotal = discretionaryItems.reduce((s, c) => s + c.amount, 0);
    const savingsTotal = savingsItems.reduce((s, a) => s + a.amount, 0);

    const surplusAmount = toGBP(
      incomeTotal - committedMonthlyTotal - yearlyMonthlyAvg - discretionaryTotal
    );
    const percentOfIncome = toGBP(incomeTotal > 0 ? (surplusAmount / incomeTotal) * 100 : 0);

    return {
      income: {
        total: incomeTotal,
        byType,
        monthly: monthlyIncome,
        annual: annualWithMonthly,
        oneOff: oneOffIncome,
      },
      committed: {
        monthlyTotal: committedMonthlyTotal,
        monthlyAvg12: yearlyMonthlyAvg,
        bills: monthlyCommitted,
        yearlyBills: yearlyCommitted,
      },
      discretionary: {
        total: discretionaryTotal,
        categories: categoryItems,
        savings: {
          total: savingsTotal,
          allocations: savingsItems,
        },
      },
      surplus: {
        amount: surplusAmount,
        percentOfIncome,
      },
    };
  },

  // ─── Cashflow ───────────────────────────────────────────────────────────────

  async getCashflow(householdId: string, year: number): Promise<CashflowMonth[]> {
    const [yearlyCommittedItems, oneOffSources] = await Promise.all([
      prisma.committedItem.findMany({ where: { householdId, spendType: "yearly" } }),
      prisma.incomeSource.findMany({
        where: { householdId, frequency: "one_off", endedAt: null },
      }),
    ]);

    const monthlyContribution = yearlyCommittedItems.reduce((s, b) => s + b.amount, 0) / 12;
    const months: CashflowMonth[] = [];
    let pot = 0;

    for (let month = 1; month <= 12; month++) {
      const bills = yearlyCommittedItems
        .filter((b) => b.dueMonth === month)
        .map((b) => ({ id: b.id, name: b.name, amount: b.amount }));

      const oneOffIncome = oneOffSources
        .filter((s) => s.expectedMonth === month)
        .map((s) => ({ id: s.id, name: s.name, amount: s.amount }));

      pot += monthlyContribution;
      pot += oneOffIncome.reduce((s, i) => s + i.amount, 0);
      pot -= bills.reduce((s, b) => s + b.amount, 0);

      months.push({
        month,
        year,
        contribution: monthlyContribution,
        bills,
        oneOffIncome,
        potAfter: pot,
        shortfall: pot < 0,
      });
    }

    return months;
  },

  // ─── Income sources ──────────────────────────────────────────────────────────

  async listIncome(householdId: string) {
    const now = new Date();
    return prisma.incomeSource.findMany({
      where: { householdId, OR: [{ endedAt: null }, { endedAt: { gt: now } }] },
      orderBy: { sortOrder: "asc" },
    });
  },

  async listEndedIncome(householdId: string) {
    const now = new Date();
    return prisma.incomeSource.findMany({
      where: { householdId, endedAt: { lte: now } },
      orderBy: { endedAt: "desc" },
    });
  },

  async createIncome(householdId: string, data: CreateIncomeSourceInput) {
    const source = await prisma.incomeSource.create({
      data: { ...data, householdId, lastReviewedAt: new Date() },
    });
    await recordHistory("income_source", source.id, source.amount);
    return source;
  },

  async updateIncome(householdId: string, id: string, data: UpdateIncomeSourceInput) {
    const existing = await prisma.incomeSource.findUnique({ where: { id } });
    assertOwned(existing, householdId, "Income source");

    const updated = await prisma.incomeSource.update({
      where: { id },
      data: { ...data, lastReviewedAt: new Date() },
    });

    if (data.amount !== undefined && data.amount !== existing!.amount) {
      await recordHistory("income_source", id, updated.amount);
    }

    return updated;
  },

  async deleteIncome(householdId: string, id: string) {
    const existing = await prisma.incomeSource.findUnique({ where: { id } });
    assertOwned(existing, householdId, "Income source");
    await prisma.incomeSource.delete({ where: { id } });
  },

  async endIncome(householdId: string, id: string, data: EndIncomeSourceInput) {
    const existing = await prisma.incomeSource.findUnique({ where: { id } });
    assertOwned(existing, householdId, "Income source");
    return prisma.incomeSource.update({
      where: { id },
      data: { endedAt: data.endedAt ?? new Date() },
    });
  },

  async reactivateIncome(householdId: string, id: string) {
    const existing = await prisma.incomeSource.findUnique({ where: { id } });
    assertOwned(existing, householdId, "Income source");
    return prisma.incomeSource.update({
      where: { id },
      data: { endedAt: null, lastReviewedAt: new Date() },
    });
  },

  async confirmIncome(householdId: string, id: string) {
    const existing = await prisma.incomeSource.findUnique({ where: { id } });
    assertOwned(existing, householdId, "Income source");
    return prisma.incomeSource.update({ where: { id }, data: { lastReviewedAt: new Date() } });
  },

  // ─── Committed items ──────────────────────────────────────────────────────────

  async listCommitted(householdId: string) {
    return prisma.committedItem.findMany({
      where: { householdId, spendType: "monthly" },
      orderBy: { sortOrder: "asc" },
    });
  },

  async createCommitted(householdId: string, data: CreateCommittedItemInput) {
    const item = await prisma.committedItem.create({
      data: {
        ...data,
        householdId,
        spendType: data.spendType ?? "monthly",
        lastReviewedAt: new Date(),
      },
    });
    await recordHistory("committed_item", item.id, item.amount);
    return item;
  },

  async updateCommitted(householdId: string, id: string, data: UpdateCommittedItemInput) {
    const existing = await prisma.committedItem.findUnique({ where: { id } });
    assertOwned(existing, householdId, "Committed item");

    const updated = await prisma.committedItem.update({
      where: { id },
      data: { ...data, lastReviewedAt: new Date() },
    });

    if (data.amount !== undefined && data.amount !== existing!.amount) {
      await recordHistory("committed_item", id, updated.amount);
    }

    return updated;
  },

  async deleteCommitted(householdId: string, id: string) {
    const existing = await prisma.committedItem.findUnique({ where: { id } });
    assertOwned(existing, householdId, "Committed item");
    await prisma.committedItem.delete({ where: { id } });
  },

  async confirmCommitted(householdId: string, id: string) {
    const existing = await prisma.committedItem.findUnique({ where: { id } });
    assertOwned(existing, householdId, "Committed item");
    return prisma.committedItem.update({ where: { id }, data: { lastReviewedAt: new Date() } });
  },

  // ─── Yearly items (CommittedItem with spendType=yearly) ─────────────────────

  async listYearly(householdId: string) {
    return prisma.committedItem.findMany({
      where: { householdId, spendType: "yearly" },
      orderBy: { sortOrder: "asc" },
    });
  },

  async createYearly(householdId: string, data: CreateCommittedItemInput) {
    const item = await prisma.committedItem.create({
      data: {
        ...data,
        householdId,
        spendType: "yearly",
        lastReviewedAt: new Date(),
      },
    });
    await recordHistory("committed_item", item.id, item.amount);
    return item;
  },

  async updateYearly(householdId: string, id: string, data: UpdateCommittedItemInput) {
    const existing = await prisma.committedItem.findUnique({ where: { id } });
    assertOwned(existing, householdId, "Committed item");

    const updated = await prisma.committedItem.update({
      where: { id },
      data: { ...data, lastReviewedAt: new Date() },
    });

    if (data.amount !== undefined && data.amount !== existing!.amount) {
      await recordHistory("committed_item", id, updated.amount);
    }

    return updated;
  },

  async deleteYearly(householdId: string, id: string) {
    const existing = await prisma.committedItem.findUnique({ where: { id } });
    assertOwned(existing, householdId, "Committed item");
    await prisma.committedItem.delete({ where: { id } });
  },

  async confirmYearly(householdId: string, id: string) {
    const existing = await prisma.committedItem.findUnique({ where: { id } });
    assertOwned(existing, householdId, "Committed item");
    return prisma.committedItem.update({ where: { id }, data: { lastReviewedAt: new Date() } });
  },

  // ─── Discretionary items ─────────────────────────────────────────────────────

  async listDiscretionary(householdId: string) {
    // Exclude savings-subcategory items (those are returned by listSavings)
    const savingsSubcategory = await prisma.subcategory.findFirst({
      where: { householdId, tier: "discretionary", name: "Savings" },
    });
    return prisma.discretionaryItem.findMany({
      where: {
        householdId,
        ...(savingsSubcategory ? { subcategoryId: { not: savingsSubcategory.id } } : {}),
      },
      orderBy: { sortOrder: "asc" },
    });
  },

  async createDiscretionary(householdId: string, data: CreateDiscretionaryItemInput) {
    const item = await prisma.discretionaryItem.create({
      data: {
        ...data,
        householdId,
        spendType: data.spendType ?? "monthly",
        lastReviewedAt: new Date(),
      },
    });
    await recordHistory("discretionary_item", item.id, item.amount);
    return item;
  },

  async updateDiscretionary(householdId: string, id: string, data: UpdateDiscretionaryItemInput) {
    const existing = await prisma.discretionaryItem.findUnique({ where: { id } });
    assertOwned(existing, householdId, "Discretionary item");

    const updated = await prisma.discretionaryItem.update({
      where: { id },
      data: { ...data, lastReviewedAt: new Date() },
    });

    if (data.amount !== undefined && data.amount !== existing!.amount) {
      await recordHistory("discretionary_item", id, updated.amount);
    }

    return updated;
  },

  async deleteDiscretionary(householdId: string, id: string) {
    const existing = await prisma.discretionaryItem.findUnique({ where: { id } });
    assertOwned(existing, householdId, "Discretionary item");
    await prisma.discretionaryItem.delete({ where: { id } });
  },

  async confirmDiscretionary(householdId: string, id: string) {
    const existing = await prisma.discretionaryItem.findUnique({ where: { id } });
    assertOwned(existing, householdId, "Discretionary item");
    return prisma.discretionaryItem.update({
      where: { id },
      data: { lastReviewedAt: new Date() },
    });
  },

  // ─── Savings (DiscretionaryItem with wealthAccountId) ───────────────────────

  async listSavings(householdId: string) {
    const savingsSubcategory = await prisma.subcategory.findFirst({
      where: { householdId, tier: "discretionary", name: "Savings" },
    });
    if (!savingsSubcategory) return [];
    return prisma.discretionaryItem.findMany({
      where: { householdId, subcategoryId: savingsSubcategory.id },
      orderBy: { sortOrder: "asc" },
    });
  },

  async createSavings(householdId: string, data: CreateDiscretionaryItemInput) {
    const item = await prisma.discretionaryItem.create({
      data: {
        ...data,
        householdId,
        spendType: data.spendType ?? "monthly",
        lastReviewedAt: new Date(),
      },
    });
    await recordHistory("discretionary_item", item.id, item.amount);
    return item;
  },

  async updateSavings(householdId: string, id: string, data: UpdateDiscretionaryItemInput) {
    const existing = await prisma.discretionaryItem.findUnique({ where: { id } });
    assertOwned(existing, householdId, "Savings allocation");

    const updated = await prisma.discretionaryItem.update({
      where: { id },
      data: { ...data, lastReviewedAt: new Date() },
    });

    if (data.amount !== undefined && data.amount !== existing!.amount) {
      await recordHistory("discretionary_item", id, updated.amount);
    }

    return updated;
  },

  async deleteSavings(householdId: string, id: string) {
    const existing = await prisma.discretionaryItem.findUnique({ where: { id } });
    assertOwned(existing, householdId, "Savings allocation");
    await prisma.discretionaryItem.delete({ where: { id } });
  },

  async confirmSavings(householdId: string, id: string) {
    const existing = await prisma.discretionaryItem.findUnique({ where: { id } });
    assertOwned(existing, householdId, "Savings allocation");
    return prisma.discretionaryItem.update({
      where: { id },
      data: { lastReviewedAt: new Date() },
    });
  },

  // ─── History ──────────────────────────────────────────────────────────────────

  async getHistory(householdId: string, type: string, id: string) {
    // Verify ownership
    switch (type) {
      case "income_source": {
        const item = await prisma.incomeSource.findUnique({ where: { id } });
        assertOwned(item, householdId, "Income source");
        break;
      }
      case "committed_item": {
        const item = await prisma.committedItem.findUnique({ where: { id } });
        assertOwned(item, householdId, "Committed item");
        break;
      }
      case "discretionary_item": {
        const item = await prisma.discretionaryItem.findUnique({ where: { id } });
        assertOwned(item, householdId, "Discretionary item");
        break;
      }
      default:
        throw new NotFoundError("Unknown item type");
    }

    const cutoff = new Date();
    cutoff.setMonth(cutoff.getMonth() - 24);

    return prisma.waterfallHistory.findMany({
      where: { itemType: type as any, itemId: id, recordedAt: { gte: cutoff } },
      orderBy: { recordedAt: "asc" },
    });
  },

  // ─── Batch confirm ────────────────────────────────────────────────────────────

  async confirmBatch(householdId: string, data: ConfirmBatchInput) {
    const now = new Date();

    await prisma.$transaction(async (tx) => {
      for (const item of data.items) {
        switch (item.type) {
          case "income_source":
            await tx.incomeSource.updateMany({
              where: { id: item.id, householdId },
              data: { lastReviewedAt: now },
            });
            break;
          case "committed_bill":
          case "yearly_bill":
          case "committed_item":
            await tx.committedItem.updateMany({
              where: { id: item.id, householdId },
              data: { lastReviewedAt: now },
            });
            break;
          case "discretionary_category":
          case "savings_allocation":
          case "discretionary_item":
            await tx.discretionaryItem.updateMany({
              where: { id: item.id, householdId },
              data: { lastReviewedAt: now },
            });
            break;
        }
      }
    });
  },

  // ─── Delete all ───────────────────────────────────────────────────────────────

  async deleteAll(householdId: string) {
    await prisma.$transaction(async (tx) => {
      await tx.incomeSource.deleteMany({ where: { householdId } });
      await tx.committedItem.deleteMany({ where: { householdId } });
      await tx.discretionaryItem.deleteMany({ where: { householdId } });
      await tx.subcategory.deleteMany({ where: { householdId } });
    });
  },
};
