import { prisma } from "../config/database.js";
import { NotFoundError } from "../utils/errors.js";
import { subcategoryService } from "./subcategory.service.js";
import { toGBP } from "@finplan/shared";
import { audited } from "./audit.service.js";
import type { ActorCtx } from "./audit.service.js";
import type {
  CreateIncomeSourceInput,
  UpdateIncomeSourceInput,
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
  WaterfallTier,
  SubcategoryTotal,
} from "@finplan/shared";
import { computeLifecycleState, findEffectivePeriod } from "./period.service.js";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function assertOwned(item: { householdId: string } | null, householdId: string, label: string) {
  if (!item) throw new NotFoundError(`${label} not found`);
  if (item.householdId !== householdId) throw new NotFoundError(`${label} not found`);
}

async function validateSubcategoryOwnership(
  householdId: string,
  subcategoryId: string,
  tier: WaterfallTier
) {
  const sub = await prisma.subcategory.findFirst({
    where: { id: subcategoryId, householdId, tier },
  });
  if (!sub) throw new NotFoundError("Subcategory not found");
}

async function validateMemberOwnership(householdId: string, memberId: string) {
  const member = await prisma.householdMember.findFirst({
    where: { householdId, userId: memberId },
  });
  if (!member) throw new NotFoundError("Household member not found");
}

// ─── Period enrichment helper ────────────────────────────────────────────────

async function enrichItemsWithPeriods<T extends { id: string }>(
  items: T[],
  itemType: string
): Promise<Array<T & { amount: number; lifecycleState: string; periods: any[] }>> {
  if (items.length === 0) return [];

  const now = new Date();
  const allPeriods = await prisma.itemAmountPeriod.findMany({
    where: {
      itemType: itemType as any,
      itemId: { in: items.map((i) => i.id) },
    },
    orderBy: { startDate: "asc" },
  });

  const periodsByItem = new Map<string, typeof allPeriods>();
  for (const period of allPeriods) {
    const existing = periodsByItem.get(period.itemId) ?? [];
    existing.push(period);
    periodsByItem.set(period.itemId, existing);
  }

  return items.map((item) => {
    const periods = periodsByItem.get(item.id) ?? [];
    let amount = 0;
    for (let i = periods.length - 1; i >= 0; i--) {
      const p = periods[i]!;
      if (p.startDate <= now && (p.endDate === null || p.endDate > now)) {
        amount = p.amount;
        break;
      }
    }
    const lifecycleState = computeLifecycleState(periods, now);
    return { ...item, amount, lifecycleState, periods };
  });
}

// ─── Subcategory totals helper ────────────────────────────────────────────────

function buildSubcategoryTotals(
  subcategories: Array<{ id: string; name: string; sortOrder: number }>,
  items: Array<{
    subcategoryId: string | null;
    amount: number;
    spendType?: string;
    frequency?: string;
    lastReviewedAt: Date;
  }>,
  otherSubcategoryId: string | null
): SubcategoryTotal[] {
  const map = new Map<string, { total: number; oldest: Date | null; count: number }>();

  for (const sub of subcategories) {
    map.set(sub.id, { total: 0, oldest: null, count: 0 });
  }

  for (const item of items) {
    const subId = item.subcategoryId ?? otherSubcategoryId;
    if (!subId || !map.has(subId)) continue;
    const entry = map.get(subId)!;

    let monthlyAmount = item.amount;
    if (item.spendType === "yearly" || item.frequency === "annual") {
      monthlyAmount = item.amount / 12;
    }

    entry.total += monthlyAmount;
    entry.count += 1;

    const reviewDate = new Date(item.lastReviewedAt);
    if (!entry.oldest || reviewDate < entry.oldest) {
      entry.oldest = reviewDate;
    }
  }

  return subcategories.map((sub) => {
    const entry = map.get(sub.id)!;
    return {
      id: sub.id,
      name: sub.name,
      sortOrder: sub.sortOrder,
      monthlyTotal: toGBP(entry.total),
      oldestReviewedAt: entry.oldest,
      itemCount: entry.count,
    };
  });
}

// ─── Summary ─────────────────────────────────────────────────────────────────

export const waterfallService = {
  async getWaterfallSummary(householdId: string): Promise<WaterfallSummary> {
    const now = new Date();

    const [incomeSources, committedItems, discretionaryItems, allSubcategories] = await Promise.all(
      [
        prisma.incomeSource.findMany({
          where: { householdId },
          orderBy: { sortOrder: "asc" },
        }),
        prisma.committedItem.findMany({ where: { householdId }, orderBy: { sortOrder: "asc" } }),
        prisma.discretionaryItem.findMany({
          where: { householdId },
          orderBy: { sortOrder: "asc" },
        }),
        prisma.subcategory.findMany({
          where: { householdId },
          orderBy: { sortOrder: "asc" },
        }),
      ]
    );

    const allItemIds = [
      ...incomeSources.map((s) => ({ type: "income_source" as const, id: s.id })),
      ...committedItems.map((s) => ({ type: "committed_item" as const, id: s.id })),
      ...discretionaryItems.map((s) => ({ type: "discretionary_item" as const, id: s.id })),
    ];

    const allPeriods =
      allItemIds.length > 0
        ? await prisma.itemAmountPeriod.findMany({
            where: {
              OR: allItemIds.map((item) => ({ itemType: item.type, itemId: item.id })),
            },
            orderBy: { startDate: "asc" },
          })
        : [];

    const periodsByItem = new Map<string, typeof allPeriods>();
    for (const period of allPeriods) {
      const key = `${period.itemType}:${period.itemId}`;
      const existing = periodsByItem.get(key) ?? [];
      existing.push(period);
      periodsByItem.set(key, existing);
    }

    function getCurrentAmountFromPeriods(periods: typeof allPeriods, now: Date): number {
      for (let i = periods.length - 1; i >= 0; i--) {
        const p = periods[i]!;
        if (p.startDate <= now && (p.endDate === null || p.endDate > now)) {
          return p.amount;
        }
      }
      return 0;
    }

    // Enrich items with period-derived amounts and filter by lifecycle
    const enrichedIncome = incomeSources.map((s) => {
      const periods = periodsByItem.get(`income_source:${s.id}`) ?? [];
      const amount = getCurrentAmountFromPeriods(periods, now);
      const lifecycleState = computeLifecycleState(periods, now);
      return { ...s, amount, lifecycleState };
    });
    const activeIncome = enrichedIncome.filter((s) => s.lifecycleState === "active");

    const enrichedCommitted = committedItems.map((s) => {
      const periods = periodsByItem.get(`committed_item:${s.id}`) ?? [];
      const amount = getCurrentAmountFromPeriods(periods, now);
      const lifecycleState = computeLifecycleState(periods, now);
      return { ...s, amount, lifecycleState };
    });
    const activeCommitted = enrichedCommitted.filter((s) => s.lifecycleState === "active");

    const enrichedDiscretionary = discretionaryItems.map((s) => {
      const periods = periodsByItem.get(`discretionary_item:${s.id}`) ?? [];
      const amount = getCurrentAmountFromPeriods(periods, now);
      const lifecycleState = computeLifecycleState(periods, now);
      return { ...s, amount, lifecycleState };
    });
    const activeDiscretionary = enrichedDiscretionary.filter((s) => s.lifecycleState === "active");

    const monthlyIncome = activeIncome.filter((s) => s.frequency === "monthly");
    const annualIncome = activeIncome.filter((s) => s.frequency === "annual");
    const oneOffIncome = activeIncome.filter((s) => s.frequency === "one_off");

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
    const monthlyCommitted = activeCommitted.filter((i) => i.spendType === "monthly");
    const yearlyCommitted = activeCommitted.filter((i) => i.spendType === "yearly");

    const committedMonthlyTotal = monthlyCommitted.reduce((s, b) => s + b.amount, 0);
    const yearlyMonthlyAvg = toGBP(yearlyCommitted.reduce((s, b) => s + b.amount, 0) / 12);

    // Detect savings subcategory to split discretionary items
    const savingsSubcategory =
      allSubcategories.find((s) => s.tier === "discretionary" && s.name === "Savings") ?? null;

    const savingsItems = savingsSubcategory
      ? activeDiscretionary.filter((i) => i.subcategoryId === savingsSubcategory.id)
      : [];
    const categoryItems = savingsSubcategory
      ? activeDiscretionary.filter((i) => i.subcategoryId !== savingsSubcategory.id)
      : activeDiscretionary;

    // Discretionary: all items summed for waterfall total
    const discretionaryTotal = activeDiscretionary.reduce((s, c) => s + c.amount, 0);
    const savingsTotal = savingsItems.reduce((s, a) => s + a.amount, 0);

    const surplusAmount = toGBP(
      incomeTotal - committedMonthlyTotal - yearlyMonthlyAvg - discretionaryTotal
    );
    const percentOfIncome = toGBP(incomeTotal > 0 ? (surplusAmount / incomeTotal) * 100 : 0);

    // Build subcategory totals per tier
    const incomeSubs = allSubcategories.filter((s) => s.tier === "income");
    const committedSubs = allSubcategories.filter((s) => s.tier === "committed");
    const discretionarySubs = allSubcategories.filter((s) => s.tier === "discretionary");

    const incomeOtherId = incomeSubs.find((s) => s.name === "Other")?.id ?? null;
    const committedOtherId = committedSubs.find((s) => s.name === "Other")?.id ?? null;
    const discretionaryOtherId = discretionarySubs.find((s) => s.name === "Other")?.id ?? null;

    // Exclude one-off income (consistent with incomeTotal calculation)
    const incomeForSubcategories = enrichedIncome.filter((s) => s.frequency !== "one_off");

    const incomeBySubcategory = buildSubcategoryTotals(
      incomeSubs,
      incomeForSubcategories,
      incomeOtherId
    );
    const committedBySubcategory = buildSubcategoryTotals(
      committedSubs,
      enrichedCommitted,
      committedOtherId
    );
    const discretionaryBySubcategory = buildSubcategoryTotals(
      discretionarySubs,
      enrichedDiscretionary,
      discretionaryOtherId
    );

    return {
      income: {
        total: incomeTotal,
        byType,
        bySubcategory: incomeBySubcategory,
        monthly: monthlyIncome,
        annual: annualWithMonthly,
        oneOff: oneOffIncome,
      },
      committed: {
        monthlyTotal: committedMonthlyTotal,
        monthlyAvg12: yearlyMonthlyAvg,
        bySubcategory: committedBySubcategory,
        bills: monthlyCommitted,
        yearlyBills: yearlyCommitted.map((b) => ({ ...b, dueMonth: b.dueMonth ?? 1 })),
      },
      discretionary: {
        total: discretionaryTotal,
        bySubcategory: discretionaryBySubcategory,
        categories: categoryItems.map((c) => ({ ...c, monthlyBudget: c.amount })),
        savings: {
          total: savingsTotal,
          allocations: savingsItems.map((a) => ({ ...a, monthlyAmount: a.amount })),
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
      prisma.incomeSource.findMany({ where: { householdId, frequency: "one_off" } }),
    ]);

    // Fetch periods for these items
    const itemRefs = [
      ...yearlyCommittedItems.map((i) => ({
        type: "committed_item" as const,
        id: i.id,
      })),
      ...oneOffSources.map((i) => ({ type: "income_source" as const, id: i.id })),
    ];

    const periods =
      itemRefs.length > 0
        ? await prisma.itemAmountPeriod.findMany({
            where: {
              OR: itemRefs.map((r) => ({ itemType: r.type, itemId: r.id })),
            },
            orderBy: { startDate: "asc" },
          })
        : [];

    const periodMap = new Map<string, typeof periods>();
    for (const p of periods) {
      const key = `${p.itemType}:${p.itemId}`;
      const arr = periodMap.get(key) ?? [];
      arr.push(p);
      periodMap.set(key, arr);
    }

    function getAmountForMonth(
      itemType: string,
      itemId: string,
      year: number,
      month: number
    ): number {
      const ps = periodMap.get(`${itemType}:${itemId}`) ?? [];
      const refDate = new Date(year, month - 1, 1);
      const effective = findEffectivePeriod(ps, refDate);
      return effective?.amount ?? 0;
    }

    // Monthly contribution = sum of yearly committed amounts / 12 (using current amounts)
    const now = new Date();
    const activeYearly = yearlyCommittedItems.filter((i) => {
      const ps = periodMap.get(`committed_item:${i.id}`) ?? [];
      return computeLifecycleState(ps, now) === "active";
    });
    const monthlyContribution =
      activeYearly.reduce((s, b) => {
        const ps = periodMap.get(`committed_item:${b.id}`) ?? [];
        const current = findEffectivePeriod(ps, now);
        return s + (current?.amount ?? 0);
      }, 0) / 12;

    const months: CashflowMonth[] = [];
    let pot = 0;

    for (let month = 1; month <= 12; month++) {
      const bills = yearlyCommittedItems
        .filter((b) => b.dueMonth === month)
        .map((b) => ({
          id: b.id,
          name: b.name,
          amount: getAmountForMonth("committed_item", b.id, year, month),
        }))
        .filter((b) => b.amount > 0);

      const oneOffIncome = oneOffSources
        .filter((s) => s.expectedMonth === month)
        .map((s) => ({
          id: s.id,
          name: s.name,
          amount: getAmountForMonth("income_source", s.id, year, month),
        }))
        .filter((s) => s.amount > 0);

      const potBefore = pot;
      pot += monthlyContribution;
      pot += oneOffIncome.reduce((s, i) => s + i.amount, 0);
      pot -= bills.reduce((s, b) => s + b.amount, 0);

      months.push({
        month,
        year,
        contribution: monthlyContribution,
        bills,
        oneOffIncome,
        potBefore,
        potAfter: pot,
        shortfall: pot < 0,
      });
    }

    return months;
  },

  // ─── Income sources ──────────────────────────────────────────────────────────

  async listIncome(householdId: string) {
    const items = await prisma.incomeSource.findMany({
      where: { householdId },
      orderBy: { sortOrder: "asc" },
    });
    return enrichItemsWithPeriods(items, "income_source");
  },

  async createIncome(householdId: string, data: CreateIncomeSourceInput, ctx?: ActorCtx) {
    const subcategoryId =
      data.subcategoryId ??
      (await subcategoryService.getDefaultSubcategoryId(householdId, "income"));
    if (data.subcategoryId) {
      await validateSubcategoryOwnership(householdId, data.subcategoryId, "income");
    }
    if (data.ownerId) {
      await validateMemberOwnership(householdId, data.ownerId);
    }
    const { amount: _amount, startDate: _startDate, endDate: _endDate, ...itemData } = data as any;
    if (ctx) {
      const source = await audited({
        db: prisma,
        ctx,
        action: "CREATE_INCOME_SOURCE",
        resource: "income-source",
        resourceId: "",
        beforeFetch: async () => null,
        mutation: async (tx) => {
          const s = await tx.incomeSource.create({
            data: { ...itemData, subcategoryId, householdId, lastReviewedAt: new Date() },
          });
          return s;
        },
      });
      return source;
    }
    const source = await prisma.incomeSource.create({
      data: { ...itemData, subcategoryId, householdId, lastReviewedAt: new Date() },
    });
    return source;
  },

  async updateIncome(
    householdId: string,
    id: string,
    data: UpdateIncomeSourceInput,
    ctx?: ActorCtx
  ) {
    const existing = await prisma.incomeSource.findUnique({ where: { id } });
    assertOwned(existing, householdId, "Income source");
    if (data.subcategoryId) {
      await validateSubcategoryOwnership(householdId, data.subcategoryId, "income");
    }
    if (data.ownerId) {
      await validateMemberOwnership(householdId, data.ownerId);
    }

    if (ctx) {
      return audited({
        db: prisma,
        ctx,
        action: "UPDATE_INCOME_SOURCE",
        resource: "income-source",
        resourceId: id,
        beforeFetch: async (tx) =>
          tx.incomeSource.findUnique({ where: { id } }) as Promise<Record<string, unknown> | null>,
        mutation: async (tx) => {
          const updated = await tx.incomeSource.update({
            where: { id },
            data: { ...data, lastReviewedAt: new Date() },
          });
          return updated;
        },
      });
    }

    const updated = await prisma.incomeSource.update({
      where: { id },
      data: { ...data, lastReviewedAt: new Date() },
    });

    return updated;
  },

  async deleteIncome(householdId: string, id: string, ctx?: ActorCtx) {
    const existing = await prisma.incomeSource.findUnique({ where: { id } });
    assertOwned(existing, householdId, "Income source");
    if (ctx) {
      await audited({
        db: prisma,
        ctx,
        action: "DELETE_INCOME_SOURCE",
        resource: "income-source",
        resourceId: id,
        beforeFetch: async (tx) =>
          tx.incomeSource.findUnique({ where: { id } }) as Promise<Record<string, unknown> | null>,
        mutation: async (tx) => {
          await tx.incomeSource.delete({ where: { id } });
          return null;
        },
      });
      return;
    }
    await prisma.incomeSource.delete({ where: { id } });
  },

  async confirmIncome(householdId: string, id: string) {
    const existing = await prisma.incomeSource.findUnique({ where: { id } });
    assertOwned(existing, householdId, "Income source");
    return prisma.incomeSource.update({ where: { id }, data: { lastReviewedAt: new Date() } });
  },

  // ─── Committed items ──────────────────────────────────────────────────────────

  async listCommitted(householdId: string) {
    const items = await prisma.committedItem.findMany({
      where: { householdId },
      orderBy: { sortOrder: "asc" },
    });
    return enrichItemsWithPeriods(items, "committed_item");
  },

  async createCommitted(householdId: string, data: CreateCommittedItemInput, ctx?: ActorCtx) {
    await validateSubcategoryOwnership(householdId, data.subcategoryId, "committed");
    if (data.ownerId) {
      await validateMemberOwnership(householdId, data.ownerId);
    }
    const { amount: _amount, startDate: _startDate, endDate: _endDate, ...itemData } = data as any;
    if (ctx) {
      return audited({
        db: prisma,
        ctx,
        action: "CREATE_COMMITTED_ITEM",
        resource: "committed-item",
        resourceId: "",
        beforeFetch: async () => null,
        mutation: async (tx) => {
          const item = await tx.committedItem.create({
            data: {
              ...itemData,
              householdId,
              spendType: data.spendType ?? "monthly",
              lastReviewedAt: new Date(),
            },
          });
          return item;
        },
      });
    }
    const item = await prisma.committedItem.create({
      data: {
        ...itemData,
        householdId,
        spendType: data.spendType ?? "monthly",
        lastReviewedAt: new Date(),
      },
    });
    return item;
  },

  async updateCommitted(
    householdId: string,
    id: string,
    data: UpdateCommittedItemInput,
    ctx?: ActorCtx
  ) {
    const existing = await prisma.committedItem.findUnique({ where: { id } });
    assertOwned(existing, householdId, "Committed item");
    if (data.subcategoryId) {
      await validateSubcategoryOwnership(householdId, data.subcategoryId, "committed");
    }
    if (data.ownerId) {
      await validateMemberOwnership(householdId, data.ownerId);
    }

    if (ctx) {
      return audited({
        db: prisma,
        ctx,
        action: "UPDATE_COMMITTED_ITEM",
        resource: "committed-item",
        resourceId: id,
        beforeFetch: async (tx) =>
          tx.committedItem.findUnique({ where: { id } }) as Promise<Record<string, unknown> | null>,
        mutation: async (tx) => {
          const updated = await tx.committedItem.update({
            where: { id },
            data: { ...data, lastReviewedAt: new Date() },
          });
          return updated;
        },
      });
    }

    const updated = await prisma.committedItem.update({
      where: { id },
      data: { ...data, lastReviewedAt: new Date() },
    });

    return updated;
  },

  async deleteCommitted(householdId: string, id: string, ctx?: ActorCtx) {
    const existing = await prisma.committedItem.findUnique({ where: { id } });
    assertOwned(existing, householdId, "Committed item");
    if (ctx) {
      await audited({
        db: prisma,
        ctx,
        action: "DELETE_COMMITTED_ITEM",
        resource: "committed-item",
        resourceId: id,
        beforeFetch: async (tx) =>
          tx.committedItem.findUnique({ where: { id } }) as Promise<Record<string, unknown> | null>,
        mutation: async (tx) => {
          await tx.committedItem.delete({ where: { id } });
          return null;
        },
      });
      return;
    }
    await prisma.committedItem.delete({ where: { id } });
  },

  async confirmCommitted(householdId: string, id: string) {
    const existing = await prisma.committedItem.findUnique({ where: { id } });
    assertOwned(existing, householdId, "Committed item");
    return prisma.committedItem.update({ where: { id }, data: { lastReviewedAt: new Date() } });
  },

  // ─── Yearly items (CommittedItem with spendType=yearly) ─────────────────────

  async listYearly(householdId: string) {
    const items = await prisma.committedItem.findMany({
      where: { householdId, spendType: "yearly" },
      orderBy: { sortOrder: "asc" },
    });
    return enrichItemsWithPeriods(items, "committed_item");
  },

  async createYearly(householdId: string, data: CreateCommittedItemInput, ctx?: ActorCtx) {
    await validateSubcategoryOwnership(householdId, data.subcategoryId, "committed");
    const { amount: _amount, startDate: _startDate, endDate: _endDate, ...itemData } = data as any;
    if (ctx) {
      return audited({
        db: prisma,
        ctx,
        action: "CREATE_COMMITTED_ITEM",
        resource: "committed-item",
        resourceId: "",
        beforeFetch: async () => null,
        mutation: async (tx) => {
          const item = await tx.committedItem.create({
            data: {
              ...itemData,
              householdId,
              spendType: "yearly",
              lastReviewedAt: new Date(),
            },
          });
          return item;
        },
      });
    }
    const item = await prisma.committedItem.create({
      data: {
        ...itemData,
        householdId,
        spendType: "yearly",
        lastReviewedAt: new Date(),
      },
    });
    return item;
  },

  async updateYearly(
    householdId: string,
    id: string,
    data: UpdateCommittedItemInput,
    ctx?: ActorCtx
  ) {
    const existing = await prisma.committedItem.findUnique({ where: { id } });
    assertOwned(existing, householdId, "Committed item");
    if (data.subcategoryId) {
      await validateSubcategoryOwnership(householdId, data.subcategoryId, "committed");
    }

    if (ctx) {
      return audited({
        db: prisma,
        ctx,
        action: "UPDATE_COMMITTED_ITEM",
        resource: "committed-item",
        resourceId: id,
        beforeFetch: async (tx) =>
          tx.committedItem.findUnique({ where: { id } }) as Promise<Record<string, unknown> | null>,
        mutation: async (tx) => {
          const updated = await tx.committedItem.update({
            where: { id },
            data: { ...data, lastReviewedAt: new Date() },
          });
          return updated;
        },
      });
    }

    const updated = await prisma.committedItem.update({
      where: { id },
      data: { ...data, lastReviewedAt: new Date() },
    });

    return updated;
  },

  async deleteYearly(householdId: string, id: string, ctx?: ActorCtx) {
    const existing = await prisma.committedItem.findUnique({ where: { id } });
    assertOwned(existing, householdId, "Committed item");
    if (ctx) {
      await audited({
        db: prisma,
        ctx,
        action: "DELETE_COMMITTED_ITEM",
        resource: "committed-item",
        resourceId: id,
        beforeFetch: async (tx) =>
          tx.committedItem.findUnique({ where: { id } }) as Promise<Record<string, unknown> | null>,
        mutation: async (tx) => {
          await tx.committedItem.delete({ where: { id } });
          return null;
        },
      });
      return;
    }
    await prisma.committedItem.delete({ where: { id } });
  },

  async confirmYearly(householdId: string, id: string) {
    const existing = await prisma.committedItem.findUnique({ where: { id } });
    assertOwned(existing, householdId, "Committed item");
    return prisma.committedItem.update({ where: { id }, data: { lastReviewedAt: new Date() } });
  },

  // ─── Discretionary items ─────────────────────────────────────────────────────

  async listDiscretionary(householdId: string) {
    const items = await prisma.discretionaryItem.findMany({
      where: { householdId },
      orderBy: { sortOrder: "asc" },
    });
    return enrichItemsWithPeriods(items, "discretionary_item");
  },

  async createDiscretionary(
    householdId: string,
    data: CreateDiscretionaryItemInput,
    ctx?: ActorCtx
  ) {
    await validateSubcategoryOwnership(householdId, data.subcategoryId, "discretionary");
    const { amount: _amount, startDate: _startDate, endDate: _endDate, ...itemData } = data as any;
    if (ctx) {
      return audited({
        db: prisma,
        ctx,
        action: "CREATE_DISCRETIONARY_ITEM",
        resource: "discretionary-item",
        resourceId: "",
        beforeFetch: async () => null,
        mutation: async (tx) => {
          const item = await tx.discretionaryItem.create({
            data: {
              ...itemData,
              householdId,
              spendType: data.spendType ?? "monthly",
              lastReviewedAt: new Date(),
            },
          });
          return item;
        },
      });
    }
    const item = await prisma.discretionaryItem.create({
      data: {
        ...itemData,
        householdId,
        spendType: data.spendType ?? "monthly",
        lastReviewedAt: new Date(),
      },
    });
    return item;
  },

  async updateDiscretionary(
    householdId: string,
    id: string,
    data: UpdateDiscretionaryItemInput,
    ctx?: ActorCtx
  ) {
    const existing = await prisma.discretionaryItem.findUnique({ where: { id } });
    assertOwned(existing, householdId, "Discretionary item");
    if (data.subcategoryId) {
      await validateSubcategoryOwnership(householdId, data.subcategoryId, "discretionary");
    }

    if (ctx) {
      return audited({
        db: prisma,
        ctx,
        action: "UPDATE_DISCRETIONARY_ITEM",
        resource: "discretionary-item",
        resourceId: id,
        beforeFetch: async (tx) =>
          tx.discretionaryItem.findUnique({ where: { id } }) as Promise<Record<
            string,
            unknown
          > | null>,
        mutation: async (tx) => {
          const updated = await tx.discretionaryItem.update({
            where: { id },
            data: { ...data, lastReviewedAt: new Date() },
          });
          return updated;
        },
      });
    }

    const updated = await prisma.discretionaryItem.update({
      where: { id },
      data: { ...data, lastReviewedAt: new Date() },
    });

    return updated;
  },

  async deleteDiscretionary(householdId: string, id: string, ctx?: ActorCtx) {
    const existing = await prisma.discretionaryItem.findUnique({ where: { id } });
    assertOwned(existing, householdId, "Discretionary item");
    if (ctx) {
      await audited({
        db: prisma,
        ctx,
        action: "DELETE_DISCRETIONARY_ITEM",
        resource: "discretionary-item",
        resourceId: id,
        beforeFetch: async (tx) =>
          tx.discretionaryItem.findUnique({ where: { id } }) as Promise<Record<
            string,
            unknown
          > | null>,
        mutation: async (tx) => {
          await tx.discretionaryItem.delete({ where: { id } });
          return null;
        },
      });
      return;
    }
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

  // ─── Savings (DiscretionaryItem in Savings subcategory) ─────────────────────

  async listSavings(householdId: string) {
    const savingsSubcategory = await prisma.subcategory.findFirst({
      where: { householdId, tier: "discretionary", name: "Savings" },
    });
    if (!savingsSubcategory) return [];
    const items = await prisma.discretionaryItem.findMany({
      where: { householdId, subcategoryId: savingsSubcategory.id },
      orderBy: { sortOrder: "asc" },
    });
    return enrichItemsWithPeriods(items, "discretionary_item");
  },

  async createSavings(householdId: string, data: CreateDiscretionaryItemInput, ctx?: ActorCtx) {
    await validateSubcategoryOwnership(householdId, data.subcategoryId, "discretionary");
    const { amount: _amount, startDate: _startDate, endDate: _endDate, ...itemData } = data as any;
    if (ctx) {
      return audited({
        db: prisma,
        ctx,
        action: "CREATE_DISCRETIONARY_ITEM",
        resource: "discretionary-item",
        resourceId: "",
        beforeFetch: async () => null,
        mutation: async (tx) => {
          const item = await tx.discretionaryItem.create({
            data: {
              ...itemData,
              householdId,
              spendType: data.spendType ?? "monthly",
              lastReviewedAt: new Date(),
            },
          });
          return item;
        },
      });
    }
    const item = await prisma.discretionaryItem.create({
      data: {
        ...itemData,
        householdId,
        spendType: data.spendType ?? "monthly",
        lastReviewedAt: new Date(),
      },
    });
    return item;
  },

  async updateSavings(
    householdId: string,
    id: string,
    data: UpdateDiscretionaryItemInput,
    ctx?: ActorCtx
  ) {
    const existing = await prisma.discretionaryItem.findUnique({ where: { id } });
    assertOwned(existing, householdId, "Savings allocation");
    if (data.subcategoryId) {
      await validateSubcategoryOwnership(householdId, data.subcategoryId, "discretionary");
    }

    if (ctx) {
      return audited({
        db: prisma,
        ctx,
        action: "UPDATE_DISCRETIONARY_ITEM",
        resource: "discretionary-item",
        resourceId: id,
        beforeFetch: async (tx) =>
          tx.discretionaryItem.findUnique({ where: { id } }) as Promise<Record<
            string,
            unknown
          > | null>,
        mutation: async (tx) => {
          const updated = await tx.discretionaryItem.update({
            where: { id },
            data: { ...data, lastReviewedAt: new Date() },
          });
          return updated;
        },
      });
    }

    const updated = await prisma.discretionaryItem.update({
      where: { id },
      data: { ...data, lastReviewedAt: new Date() },
    });

    return updated;
  },

  async deleteSavings(householdId: string, id: string, ctx?: ActorCtx) {
    const existing = await prisma.discretionaryItem.findUnique({ where: { id } });
    assertOwned(existing, householdId, "Savings allocation");
    if (ctx) {
      await audited({
        db: prisma,
        ctx,
        action: "DELETE_DISCRETIONARY_ITEM",
        resource: "discretionary-item",
        resourceId: id,
        beforeFetch: async (tx) =>
          tx.discretionaryItem.findUnique({ where: { id } }) as Promise<Record<
            string,
            unknown
          > | null>,
        mutation: async (tx) => {
          await tx.discretionaryItem.delete({ where: { id } });
          return null;
        },
      });
      return;
    }
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
      // Get all item IDs first to clean up periods
      const [incomes, committed, discretionary] = await Promise.all([
        tx.incomeSource.findMany({ where: { householdId }, select: { id: true } }),
        tx.committedItem.findMany({ where: { householdId }, select: { id: true } }),
        tx.discretionaryItem.findMany({ where: { householdId }, select: { id: true } }),
      ]);
      const allIds = [
        ...incomes.map((i) => i.id),
        ...committed.map((i) => i.id),
        ...discretionary.map((i) => i.id),
      ];
      if (allIds.length > 0) {
        await tx.itemAmountPeriod.deleteMany({ where: { itemId: { in: allIds } } });
      }
      await tx.incomeSource.deleteMany({ where: { householdId } });
      await tx.committedItem.deleteMany({ where: { householdId } });
      await tx.discretionaryItem.deleteMany({ where: { householdId } });
      await tx.subcategory.deleteMany({ where: { householdId } });
    });
  },
};
