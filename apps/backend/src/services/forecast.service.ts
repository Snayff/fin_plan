import { prisma } from "../config/database.js";
import { waterfallService } from "./waterfall.service.js";
import { toMonthlyAmount } from "@finplan/shared";
import type { ForecastProjection, ForecastHorizon } from "@finplan/shared";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function accountEffectiveRate(
  account: { growthRatePct: number | null; type: string },
  settings: {
    currentRatePct: number;
    savingsRatePct: number;
    investmentRatePct: number;
    pensionRatePct: number;
  }
): number {
  if (account.growthRatePct != null) return account.growthRatePct / 100;
  switch (account.type) {
    case "Current":
      return settings.currentRatePct / 100;
    case "Savings":
      return settings.savingsRatePct / 100;
    case "StocksAndShares":
      return settings.investmentRatePct / 100;
    case "Pension":
      return settings.pensionRatePct / 100;
    default:
      return 0;
  }
}

function assetEffectiveRate(asset: { growthRatePct: number | null }): number {
  return asset.growthRatePct != null ? asset.growthRatePct / 100 : 0;
}

function projectBalanceSeries(
  initialBalance: number,
  monthlyContribution: number,
  annualRate: number,
  years: number
): number[] {
  const series = [initialBalance];
  for (let y = 1; y <= years; y++) {
    const prev = series[y - 1]!;
    series.push(prev * (1 + annualRate) + monthlyContribution * 12);
  }
  return series;
}

type ProjectableAccount = {
  balance: number;
  monthlyContribution: number;
  growthRatePct: number | null;
  type: string;
};

type ProjectableAsset = {
  balance: number;
  growthRatePct: number | null;
};

function sumAccountSeries(
  accounts: ProjectableAccount[],
  settings: {
    currentRatePct: number;
    savingsRatePct: number;
    investmentRatePct: number;
    pensionRatePct: number;
  },
  years: number
): number[] {
  const sums = Array.from({ length: years + 1 }, () => 0);
  for (const acc of accounts) {
    const rate = accountEffectiveRate(acc, settings);
    const series = projectBalanceSeries(acc.balance, acc.monthlyContribution, rate, years);
    for (let y = 0; y <= years; y++) {
      sums[y] = (sums[y] ?? 0) + (series[y] ?? 0);
    }
  }
  return sums;
}

function sumAssetSeries(assets: ProjectableAsset[], years: number): number[] {
  const sums = Array.from({ length: years + 1 }, () => 0);
  for (const asset of assets) {
    const rate = assetEffectiveRate(asset);
    const series = projectBalanceSeries(asset.balance, 0, rate, years);
    for (let y = 0; y <= years; y++) {
      sums[y] = (sums[y] ?? 0) + (series[y] ?? 0);
    }
  }
  return sums;
}

const DEFAULT_SETTINGS = {
  currentRatePct: 0,
  savingsRatePct: 4,
  investmentRatePct: 7,
  pensionRatePct: 6,
  inflationRatePct: 2.5,
};

// ─── Service ─────────────────────────────────────────────────────────────────

export const forecastService = {
  async getProjections(
    householdId: string,
    horizonYears: ForecastHorizon
  ): Promise<ForecastProjection> {
    const balanceInclude = { balances: { orderBy: { date: "desc" as const }, take: 1 } };
    const linkedItemsInclude = { linkedItems: { select: { id: true, spendType: true } } };

    const [accounts, assets, settingsRow, members, waterfallSummary] = await Promise.all([
      prisma.account.findMany({
        where: { householdId },
        include: { ...balanceInclude, ...linkedItemsInclude },
      }),
      prisma.asset.findMany({ where: { householdId }, include: balanceInclude }),
      prisma.householdSettings.findUnique({ where: { householdId } }),
      prisma.member.findMany({
        where: { householdId },
        include: { user: { select: { id: true, name: true } } },
      }),
      waterfallService.getWaterfallSummary(householdId),
    ]);

    // Derive monthly contributions per account from linked discretionary items
    const allLinkedItemIds = accounts.flatMap((a) => a.linkedItems.map((i) => i.id));
    const now = new Date();
    const activePeriods =
      allLinkedItemIds.length > 0
        ? await prisma.itemAmountPeriod.findMany({
            where: {
              itemType: "discretionary_item",
              itemId: { in: allLinkedItemIds },
              startDate: { lte: now },
              OR: [{ endDate: null }, { endDate: { gt: now } }],
            },
          })
        : [];
    const amountByItemId = new Map<string, number>();
    for (const period of activePeriods) {
      amountByItemId.set(period.itemId, period.amount);
    }
    const monthlyContributionByAccountId = new Map<string, number>();
    for (const acc of accounts) {
      const total = acc.linkedItems.reduce(
        (sum, item) => sum + toMonthlyAmount(amountByItemId.get(item.id) ?? 0, item.spendType),
        0
      );
      monthlyContributionByAccountId.set(acc.id, total);
    }

    const settings = {
      currentRatePct: settingsRow?.currentRatePct ?? DEFAULT_SETTINGS.currentRatePct,
      savingsRatePct: settingsRow?.savingsRatePct ?? DEFAULT_SETTINGS.savingsRatePct,
      investmentRatePct: settingsRow?.investmentRatePct ?? DEFAULT_SETTINGS.investmentRatePct,
      pensionRatePct: settingsRow?.pensionRatePct ?? DEFAULT_SETTINGS.pensionRatePct,
      inflationRatePct: settingsRow?.inflationRatePct ?? DEFAULT_SETTINGS.inflationRatePct,
    };
    const currentYear = new Date().getFullYear();

    // Normalise to projectable shapes
    const toProjectableAccount = (acc: (typeof accounts)[number]): ProjectableAccount => ({
      balance: acc.balances[0]?.value ?? 0,
      monthlyContribution: monthlyContributionByAccountId.get(acc.id) ?? 0,
      growthRatePct: acc.growthRatePct,
      type: acc.type,
    });

    const toProjectableAsset = (a: (typeof assets)[number]): ProjectableAsset => ({
      balance: a.balances[0]?.value ?? 0,
      growthRatePct: a.growthRatePct,
    });

    // ── Net worth (non-pension accounts + all assets) ─────────────────────────
    const netWorthAccounts = accounts.filter((a) => a.type !== "Pension").map(toProjectableAccount);
    const allAssets = assets.map(toProjectableAsset);

    const accountSums = sumAccountSeries(netWorthAccounts, settings, horizonYears);
    const assetSums = sumAssetSeries(allAssets, horizonYears);

    const netWorth = Array.from({ length: horizonYears + 1 }, (_, y) => {
      const nominal = Math.round((accountSums[y] ?? 0) + (assetSums[y] ?? 0));
      const real = Math.round(nominal / Math.pow(1 + settings.inflationRatePct / 100, y));
      return { year: currentYear + y, nominal, real };
    });

    // ── Surplus accumulation ──────────────────────────────────────────────────
    const monthlySurplus = waterfallSummary.surplus.amount;
    const surplus = Array.from({ length: horizonYears + 1 }, (_, y) => ({
      year: currentYear + y,
      cumulative: Math.round(monthlySurplus * 12 * y),
    }));

    // ── Retirement (per member: own pensions + shared savings + shared S&S) ──
    // Savings and S&S are household-shared — both members see the full household
    // amount, representing their joint pool (intentional, not a double-count).
    const savingsAccounts = accounts.filter((a) => a.type === "Savings").map(toProjectableAccount);
    const ssAccounts = accounts
      .filter((a) => a.type === "StocksAndShares")
      .map(toProjectableAccount);

    const savingsSums = sumAccountSeries(savingsAccounts, settings, horizonYears);
    const ssSums = sumAccountSeries(ssAccounts, settings, horizonYears);

    const retirement = members.map((member) => {
      const pensionAccounts = accounts
        .filter((a) => a.type === "Pension" && a.memberId === member.id)
        .map(toProjectableAccount);
      const pensionSums = sumAccountSeries(pensionAccounts, settings, horizonYears);

      const series = Array.from({ length: horizonYears + 1 }, (_, y) => ({
        year: currentYear + y,
        pension: Math.round(pensionSums[y] ?? 0),
        savings: Math.round(savingsSums[y] ?? 0),
        stocksAndShares: Math.round(ssSums[y] ?? 0),
      }));

      return {
        memberId: member.id,
        memberName: member.user?.name ?? member.name,
        retirementYear: member.retirementYear ?? null,
        series,
      };
    });

    // ── Monthly contributions by scope ────────────────────────────────────────
    // netWorth = all non-pension accounts; retirement = pension accounts only
    const monthlyContributionsByScope = {
      netWorth: accounts
        .filter((a) => a.type !== "Pension")
        .reduce((sum, a) => sum + (monthlyContributionByAccountId.get(a.id) ?? 0), 0),
      retirement: accounts
        .filter((a) => a.type === "Pension")
        .reduce((sum, a) => sum + (monthlyContributionByAccountId.get(a.id) ?? 0), 0),
    };

    return { netWorth, surplus, retirement, monthlyContributionsByScope };
  },
};
