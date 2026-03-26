import { prisma } from "../config/database.js";
import { NotFoundError, ConflictError } from "../utils/errors.js";
import { toGBP } from "@finplan/shared";
import type {
  CreateWealthAccountInput,
  UpdateWealthAccountInput,
  UpdateValuationInput,
  ConfirmBatchWealthInput,
  WealthSummary,
  AssetClass,
  IsaAllowance,
} from "@finplan/shared";

function assertOwned(item: { householdId: string } | null, householdId: string, label: string) {
  if (!item) throw new NotFoundError(`${label} not found`);
  if (item.householdId !== householdId) throw new NotFoundError(`${label} not found`);
}

const LIQUIDITY_CASH = new Set(["savings"]);
const LIQUIDITY_INV = new Set(["investments", "pensions"]);
const LIQUIDITY_PROP = new Set(["property", "vehicles"]);

export const wealthService = {
  // ─── Summary ──────────────────────────────────────────────────────────────

  async getWealthSummary(householdId: string): Promise<WealthSummary> {
    const accounts = await prisma.wealthAccount.findMany({ where: { householdId } });

    const nonTrust = accounts.filter((a) => !a.isTrust);
    const trust = accounts.filter((a) => a.isTrust);

    const netWorth = nonTrust.reduce((s, a) => s + a.balance, 0);

    // ytd change: compare current netWorth to the sum of Jan 1 balances from history
    const jan1 = new Date(new Date().getFullYear(), 0, 1);
    const histories = await Promise.all(
      nonTrust.map((a) =>
        prisma.wealthAccountHistory.findFirst({
          where: { wealthAccountId: a.id, valuationDate: { lte: jan1 } },
          orderBy: { valuationDate: "desc" },
        })
      )
    );
    const jan1Total = histories.reduce((s, h) => s + (h?.balance ?? 0), 0);
    const ytdChange = netWorth - jan1Total;

    const byClass: Record<string, number> = {
      savings: 0,
      pensions: 0,
      investments: 0,
      property: 0,
      vehicles: 0,
      other: 0,
    };
    const byLiquidity = { cashAndSavings: 0, investmentsAndPensions: 0, propertyAndVehicles: 0 };

    for (const a of nonTrust) {
      byClass[a.assetClass] = (byClass[a.assetClass] ?? 0) + a.balance;
      if (LIQUIDITY_CASH.has(a.assetClass)) byLiquidity.cashAndSavings += a.balance;
      else if (LIQUIDITY_INV.has(a.assetClass)) byLiquidity.investmentsAndPensions += a.balance;
      else if (LIQUIDITY_PROP.has(a.assetClass)) byLiquidity.propertyAndVehicles += a.balance;
    }

    const trustTotal = trust.reduce((s, a) => s + a.balance, 0);
    const beneficiaryMap = new Map<string, number>();
    for (const a of trust) {
      const name = a.trustBeneficiaryName ?? "Unknown";
      beneficiaryMap.set(name, (beneficiaryMap.get(name) ?? 0) + a.balance);
    }

    return {
      netWorth,
      ytdChange,
      byLiquidity,
      byClass: byClass as Record<AssetClass, number>,
      trust: {
        total: trustTotal,
        beneficiaries: Array.from(beneficiaryMap.entries()).map(([name, total]) => ({
          name,
          total,
        })),
      },
    };
  },

  // ─── Account list ─────────────────────────────────────────────────────────

  async listAccounts(householdId: string) {
    return prisma.wealthAccount.findMany({
      where: { householdId },
      orderBy: [{ assetClass: "asc" }, { name: "asc" }],
    });
  },

  // ─── Single account with history + projection ─────────────────────────────

  async getAccount(householdId: string, id: string) {
    const account = await prisma.wealthAccount.findUnique({ where: { id } });
    assertOwned(account, householdId, "Wealth account");

    const cutoff = new Date();
    cutoff.setMonth(cutoff.getMonth() - 24);
    const history = await prisma.wealthAccountHistory.findMany({
      where: { wealthAccountId: id, valuationDate: { gte: cutoff } },
      orderBy: { valuationDate: "asc" },
    });

    // Projection to Dec 31 (savings only)
    let projection: number | null = null;
    if (account!.assetClass === "savings" && account!.interestRate != null) {
      const now = new Date();
      const dec31 = new Date(now.getFullYear(), 11, 31);
      const months = Math.max(
        0,
        (dec31.getFullYear() - now.getFullYear()) * 12 + (dec31.getMonth() - now.getMonth())
      );
      const monthlyRate = account!.interestRate / 12 / 100;

      // Linked savings allocations (discretionary items with wealthAccountId set)
      const allocations = await prisma.discretionaryItem.findMany({
        where: { householdId, wealthAccountId: id },
      });
      const monthlyContrib = allocations.reduce((s, a) => s + a.amount, 0);

      if (monthlyRate === 0) {
        projection = account!.balance + monthlyContrib * months;
      } else {
        const factor = Math.pow(1 + monthlyRate, months);
        projection = account!.balance * factor + monthlyContrib * ((factor - 1) / monthlyRate);
      }
    }

    return { ...account!, history, projection };
  },

  // ─── CRUD ─────────────────────────────────────────────────────────────────

  async createAccount(householdId: string, data: CreateWealthAccountInput) {
    const account = await prisma.wealthAccount.create({
      data: { ...data, householdId, lastReviewedAt: new Date() },
    });
    // Record initial valuation
    await prisma.wealthAccountHistory.create({
      data: {
        wealthAccountId: account.id,
        balance: account.balance,
        valuationDate: account.valuationDate,
      },
    });
    return account;
  },

  async updateAccount(householdId: string, id: string, data: UpdateWealthAccountInput) {
    const existing = await prisma.wealthAccount.findUnique({ where: { id } });
    assertOwned(existing, householdId, "Wealth account");
    return prisma.wealthAccount.update({
      where: { id },
      data: { ...data, lastReviewedAt: new Date() },
    });
  },

  async deleteAccount(householdId: string, id: string) {
    const existing = await prisma.wealthAccount.findUnique({ where: { id } });
    assertOwned(existing, householdId, "Wealth account");

    const linked = await prisma.discretionaryItem.count({ where: { wealthAccountId: id } });
    if (linked > 0) {
      throw new ConflictError(
        "This account has linked savings allocations. Remove them before deleting."
      );
    }

    await prisma.wealthAccount.delete({ where: { id } });
  },

  // ─── Valuation ────────────────────────────────────────────────────────────

  async updateValuation(householdId: string, id: string, data: UpdateValuationInput) {
    const existing = await prisma.wealthAccount.findUnique({ where: { id } });
    assertOwned(existing, householdId, "Wealth account");

    const valuationDate = data.valuationDate ?? new Date();
    const updated = await prisma.wealthAccount.update({
      where: { id },
      data: { balance: data.balance, valuationDate, lastReviewedAt: new Date() },
    });

    await prisma.wealthAccountHistory.create({
      data: { wealthAccountId: id, balance: data.balance, valuationDate },
    });

    return updated;
  },

  // ─── Confirm ──────────────────────────────────────────────────────────────

  async confirmAccount(householdId: string, id: string) {
    const existing = await prisma.wealthAccount.findUnique({ where: { id } });
    assertOwned(existing, householdId, "Wealth account");
    return prisma.wealthAccount.update({ where: { id }, data: { lastReviewedAt: new Date() } });
  },

  async confirmBatch(householdId: string, data: ConfirmBatchWealthInput) {
    const now = new Date();
    await prisma.wealthAccount.updateMany({
      where: { id: { in: data.ids }, householdId },
      data: { lastReviewedAt: now },
    });
  },

  // ─── History ──────────────────────────────────────────────────────────────

  async getHistory(householdId: string, id: string) {
    const account = await prisma.wealthAccount.findUnique({ where: { id } });
    assertOwned(account, householdId, "Wealth account");

    const cutoff = new Date();
    cutoff.setMonth(cutoff.getMonth() - 24);
    return prisma.wealthAccountHistory.findMany({
      where: { wealthAccountId: id, valuationDate: { gte: cutoff } },
      orderBy: { valuationDate: "asc" },
    });
  },

  // ─── ISA allowance ────────────────────────────────────────────────────────

  async getIsaAllowance(householdId: string, now: Date = new Date()): Promise<IsaAllowance> {
    const [settings, isaAccounts] = await Promise.all([
      prisma.householdSettings.findUnique({ where: { householdId } }),
      prisma.wealthAccount.findMany({
        where: { householdId, isISA: true },
      }),
    ]);

    const limit = settings?.isaAnnualLimit ?? 20000;
    const startMonth = (settings?.isaYearStartMonth ?? 4) - 1; // 0-indexed
    const startDay = settings?.isaYearStartDay ?? 6;
    let taxYearStartYear = now.getFullYear();
    const yearStart = new Date(taxYearStartYear, startMonth, startDay);
    if (now < yearStart) taxYearStartYear -= 1;

    const taxYearStart = new Date(taxYearStartYear, startMonth, startDay);
    const taxYearEnd = new Date(taxYearStartYear + 1, startMonth, startDay - 1);

    // Group by ownerId — look up names
    const ownerIds = [...new Set(isaAccounts.map((a) => a.ownerId).filter(Boolean))] as string[];
    const users = ownerIds.length
      ? await prisma.user.findMany({
          where: { id: { in: ownerIds } },
          select: { id: true, name: true },
        })
      : [];
    const nameMap = new Map(users.map((u) => [u.id, u.name]));

    // Accounts without ownerId grouped under 'household'
    const groups = new Map<string, { label: string; used: number }>();

    for (const account of isaAccounts) {
      const key = account.ownerId ?? "__household__";
      const label = account.ownerId
        ? (nameMap.get(account.ownerId) ?? account.ownerId)
        : "Household";
      const existing = groups.get(key) ?? { label, used: 0 };
      existing.used += account.isaYearContribution ?? 0;
      groups.set(key, existing);
    }

    const byPerson = Array.from(groups.entries()).map(([ownerId, { label, used }]) => ({
      ownerId,
      name: label,
      used: toGBP(used),
      remaining: toGBP(Math.max(0, limit - used)),
    }));

    return {
      taxYearStart: taxYearStart.toISOString(),
      taxYearEnd: taxYearEnd.toISOString(),
      annualLimit: limit,
      byPerson,
    };
  },
};
