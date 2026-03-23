import { prisma } from "../config/database.js";
import { NotFoundError } from "../utils/errors.js";
import type {
  CreateIncomeSourceInput,
  UpdateIncomeSourceInput,
  EndIncomeSourceInput,
  CreateCommittedBillInput,
  UpdateCommittedBillInput,
  CreateYearlyBillInput,
  UpdateYearlyBillInput,
  CreateDiscretionaryCategoryInput,
  UpdateDiscretionaryCategoryInput,
  CreateSavingsAllocationInput,
  UpdateSavingsAllocationInput,
  ConfirmBatchInput,
  WaterfallSummary,
  CashflowMonth,
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

    const [incomeSources, committedBills, yearlyBills, discretionary, savings] = await Promise.all([
      prisma.incomeSource.findMany({
        where: { householdId, OR: [{ endedAt: null }, { endedAt: { gt: now } }] },
        orderBy: { sortOrder: "asc" },
      }),
      prisma.committedBill.findMany({ where: { householdId }, orderBy: { sortOrder: "asc" } }),
      prisma.yearlyBill.findMany({ where: { householdId }, orderBy: { sortOrder: "asc" } }),
      prisma.discretionaryCategory.findMany({
        where: { householdId },
        orderBy: { sortOrder: "asc" },
      }),
      prisma.savingsAllocation.findMany({ where: { householdId }, orderBy: { sortOrder: "asc" } }),
    ]);

    const monthlyIncome = incomeSources.filter((s) => s.frequency === "monthly");
    const annualIncome = incomeSources.filter((s) => s.frequency === "annual");
    const oneOffIncome = incomeSources.filter((s) => s.frequency === "one_off");

    const incomeTotal =
      monthlyIncome.reduce((s, i) => s + i.amount, 0) +
      annualIncome.reduce((s, i) => s + i.amount / 12, 0);

    const committedMonthlyTotal = committedBills.reduce((s, b) => s + b.amount, 0);
    const yearlyMonthlyAvg = yearlyBills.reduce((s, b) => s + b.amount, 0) / 12;

    const discretionaryTotal = discretionary.reduce((s, c) => s + c.monthlyBudget, 0);
    const savingsTotal = savings.reduce((s, a) => s + a.monthlyAmount, 0);

    const surplusAmount =
      incomeTotal - committedMonthlyTotal - yearlyMonthlyAvg - discretionaryTotal - savingsTotal;
    const percentOfIncome = incomeTotal > 0 ? (surplusAmount / incomeTotal) * 100 : 0;

    return {
      income: {
        total: incomeTotal,
        monthly: monthlyIncome,
        annual: annualIncome.map((s) => ({ ...s, monthlyAmount: s.amount / 12 })),
        oneOff: oneOffIncome,
      },
      committed: {
        monthlyTotal: committedMonthlyTotal,
        monthlyAvg12: yearlyMonthlyAvg,
        bills: committedBills,
        yearlyBills,
      },
      discretionary: {
        total: discretionaryTotal + savingsTotal,
        categories: discretionary,
        savings: { total: savingsTotal, allocations: savings },
      },
      surplus: {
        amount: surplusAmount,
        percentOfIncome,
      },
    };
  },

  // ─── Cashflow ───────────────────────────────────────────────────────────────

  async getCashflow(householdId: string, year: number): Promise<CashflowMonth[]> {
    const [yearlyBills, oneOffSources] = await Promise.all([
      prisma.yearlyBill.findMany({ where: { householdId } }),
      prisma.incomeSource.findMany({
        where: { householdId, frequency: "one_off", endedAt: null },
      }),
    ]);

    const monthlyContribution = yearlyBills.reduce((s, b) => s + b.amount, 0) / 12;
    const months: CashflowMonth[] = [];
    let pot = 0;

    for (let month = 1; month <= 12; month++) {
      const bills = yearlyBills
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

  // ─── Committed bills ─────────────────────────────────────────────────────────

  async listCommitted(householdId: string) {
    return prisma.committedBill.findMany({ where: { householdId }, orderBy: { sortOrder: "asc" } });
  },

  async createCommitted(householdId: string, data: CreateCommittedBillInput) {
    const bill = await prisma.committedBill.create({
      data: { ...data, householdId, lastReviewedAt: new Date() },
    });
    await recordHistory("committed_bill", bill.id, bill.amount);
    return bill;
  },

  async updateCommitted(householdId: string, id: string, data: UpdateCommittedBillInput) {
    const existing = await prisma.committedBill.findUnique({ where: { id } });
    assertOwned(existing, householdId, "Committed bill");

    const updated = await prisma.committedBill.update({
      where: { id },
      data: { ...data, lastReviewedAt: new Date() },
    });

    if (data.amount !== undefined && data.amount !== existing!.amount) {
      await recordHistory("committed_bill", id, updated.amount);
    }

    return updated;
  },

  async deleteCommitted(householdId: string, id: string) {
    const existing = await prisma.committedBill.findUnique({ where: { id } });
    assertOwned(existing, householdId, "Committed bill");
    await prisma.committedBill.delete({ where: { id } });
  },

  async confirmCommitted(householdId: string, id: string) {
    const existing = await prisma.committedBill.findUnique({ where: { id } });
    assertOwned(existing, householdId, "Committed bill");
    return prisma.committedBill.update({ where: { id }, data: { lastReviewedAt: new Date() } });
  },

  // ─── Yearly bills ────────────────────────────────────────────────────────────

  async listYearly(householdId: string) {
    return prisma.yearlyBill.findMany({ where: { householdId }, orderBy: { sortOrder: "asc" } });
  },

  async createYearly(householdId: string, data: CreateYearlyBillInput) {
    const bill = await prisma.yearlyBill.create({
      data: { ...data, householdId, lastReviewedAt: new Date() },
    });
    await recordHistory("yearly_bill", bill.id, bill.amount);
    return bill;
  },

  async updateYearly(householdId: string, id: string, data: UpdateYearlyBillInput) {
    const existing = await prisma.yearlyBill.findUnique({ where: { id } });
    assertOwned(existing, householdId, "Yearly bill");

    const updated = await prisma.yearlyBill.update({
      where: { id },
      data: { ...data, lastReviewedAt: new Date() },
    });

    if (data.amount !== undefined && data.amount !== existing!.amount) {
      await recordHistory("yearly_bill", id, updated.amount);
    }

    return updated;
  },

  async deleteYearly(householdId: string, id: string) {
    const existing = await prisma.yearlyBill.findUnique({ where: { id } });
    assertOwned(existing, householdId, "Yearly bill");
    await prisma.yearlyBill.delete({ where: { id } });
  },

  async confirmYearly(householdId: string, id: string) {
    const existing = await prisma.yearlyBill.findUnique({ where: { id } });
    assertOwned(existing, householdId, "Yearly bill");
    return prisma.yearlyBill.update({ where: { id }, data: { lastReviewedAt: new Date() } });
  },

  // ─── Discretionary ───────────────────────────────────────────────────────────

  async listDiscretionary(householdId: string) {
    return prisma.discretionaryCategory.findMany({
      where: { householdId },
      orderBy: { sortOrder: "asc" },
    });
  },

  async createDiscretionary(householdId: string, data: CreateDiscretionaryCategoryInput) {
    const cat = await prisma.discretionaryCategory.create({
      data: { ...data, householdId, lastReviewedAt: new Date() },
    });
    await recordHistory("discretionary_category", cat.id, cat.monthlyBudget);
    return cat;
  },

  async updateDiscretionary(
    householdId: string,
    id: string,
    data: UpdateDiscretionaryCategoryInput
  ) {
    const existing = await prisma.discretionaryCategory.findUnique({ where: { id } });
    assertOwned(existing, householdId, "Discretionary category");

    const updated = await prisma.discretionaryCategory.update({
      where: { id },
      data: { ...data, lastReviewedAt: new Date() },
    });

    if (data.monthlyBudget !== undefined && data.monthlyBudget !== existing!.monthlyBudget) {
      await recordHistory("discretionary_category", id, updated.monthlyBudget);
    }

    return updated;
  },

  async deleteDiscretionary(householdId: string, id: string) {
    const existing = await prisma.discretionaryCategory.findUnique({ where: { id } });
    assertOwned(existing, householdId, "Discretionary category");
    await prisma.discretionaryCategory.delete({ where: { id } });
  },

  async confirmDiscretionary(householdId: string, id: string) {
    const existing = await prisma.discretionaryCategory.findUnique({ where: { id } });
    assertOwned(existing, householdId, "Discretionary category");
    return prisma.discretionaryCategory.update({
      where: { id },
      data: { lastReviewedAt: new Date() },
    });
  },

  // ─── Savings allocations ─────────────────────────────────────────────────────

  async listSavings(householdId: string) {
    return prisma.savingsAllocation.findMany({
      where: { householdId },
      orderBy: { sortOrder: "asc" },
    });
  },

  async createSavings(householdId: string, data: CreateSavingsAllocationInput) {
    const alloc = await prisma.savingsAllocation.create({
      data: { ...data, householdId, lastReviewedAt: new Date() },
    });
    await recordHistory("savings_allocation", alloc.id, alloc.monthlyAmount);
    return alloc;
  },

  async updateSavings(householdId: string, id: string, data: UpdateSavingsAllocationInput) {
    const existing = await prisma.savingsAllocation.findUnique({ where: { id } });
    assertOwned(existing, householdId, "Savings allocation");

    const updated = await prisma.savingsAllocation.update({
      where: { id },
      data: { ...data, lastReviewedAt: new Date() },
    });

    if (data.monthlyAmount !== undefined && data.monthlyAmount !== existing!.monthlyAmount) {
      await recordHistory("savings_allocation", id, updated.monthlyAmount);
    }

    return updated;
  },

  async deleteSavings(householdId: string, id: string) {
    const existing = await prisma.savingsAllocation.findUnique({ where: { id } });
    assertOwned(existing, householdId, "Savings allocation");
    await prisma.savingsAllocation.delete({ where: { id } });
  },

  async confirmSavings(householdId: string, id: string) {
    const existing = await prisma.savingsAllocation.findUnique({ where: { id } });
    assertOwned(existing, householdId, "Savings allocation");
    return prisma.savingsAllocation.update({
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
      case "committed_bill": {
        const item = await prisma.committedBill.findUnique({ where: { id } });
        assertOwned(item, householdId, "Committed bill");
        break;
      }
      case "yearly_bill": {
        const item = await prisma.yearlyBill.findUnique({ where: { id } });
        assertOwned(item, householdId, "Yearly bill");
        break;
      }
      case "discretionary_category": {
        const item = await prisma.discretionaryCategory.findUnique({ where: { id } });
        assertOwned(item, householdId, "Discretionary category");
        break;
      }
      case "savings_allocation": {
        const item = await prisma.savingsAllocation.findUnique({ where: { id } });
        assertOwned(item, householdId, "Savings allocation");
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
            await tx.committedBill.updateMany({
              where: { id: item.id, householdId },
              data: { lastReviewedAt: now },
            });
            break;
          case "yearly_bill":
            await tx.yearlyBill.updateMany({
              where: { id: item.id, householdId },
              data: { lastReviewedAt: now },
            });
            break;
          case "discretionary_category":
            await tx.discretionaryCategory.updateMany({
              where: { id: item.id, householdId },
              data: { lastReviewedAt: now },
            });
            break;
          case "savings_allocation":
            await tx.savingsAllocation.updateMany({
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
    await prisma.$transaction([
      prisma.incomeSource.deleteMany({ where: { householdId } }),
      prisma.committedBill.deleteMany({ where: { householdId } }),
      prisma.yearlyBill.deleteMany({ where: { householdId } }),
      prisma.discretionaryCategory.deleteMany({ where: { householdId } }),
      prisma.savingsAllocation.deleteMany({ where: { householdId } }),
    ]);
  },
};
