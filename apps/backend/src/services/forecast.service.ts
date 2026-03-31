import { prisma } from "../config/database.js";
import { waterfallService } from "./waterfall.service.js";
import type { ForecastProjection, ForecastHorizon } from "@finplan/shared";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function accountEffectiveRate(
  account: { growthRatePct: number | null; type: string },
  settings: { savingsRatePct: number; investmentRatePct: number; pensionRatePct: number }
): number {
  if (account.growthRatePct != null) return account.growthRatePct / 100;
  switch (account.type) {
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
  settings: { savingsRatePct: number; investmentRatePct: number; pensionRatePct: number },
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

    const [accounts, assets, settingsRow, members, waterfallSummary] = await Promise.all([
      prisma.account.findMany({ where: { householdId }, include: balanceInclude }),
      prisma.asset.findMany({ where: { householdId }, include: balanceInclude }),
      prisma.householdSettings.findUnique({ where: { householdId } }),
      prisma.householdMember.findMany({
        where: { householdId },
        include: { user: { select: { id: true, name: true } } },
      }),
      waterfallService.getWaterfallSummary(householdId),
    ]);

    const settings = {
      savingsRatePct: settingsRow?.savingsRatePct ?? DEFAULT_SETTINGS.savingsRatePct,
      investmentRatePct: settingsRow?.investmentRatePct ?? DEFAULT_SETTINGS.investmentRatePct,
      pensionRatePct: settingsRow?.pensionRatePct ?? DEFAULT_SETTINGS.pensionRatePct,
      inflationRatePct: settingsRow?.inflationRatePct ?? DEFAULT_SETTINGS.inflationRatePct,
    };
    const currentYear = new Date().getFullYear();

    // Normalise to projectable shapes
    const toProjectableAccount = (acc: (typeof accounts)[number]): ProjectableAccount => ({
      balance: acc.balances[0]?.value ?? 0,
      monthlyContribution: acc.monthlyContribution,
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
    const savingsAccounts = accounts.filter((a) => a.type === "Savings").map(toProjectableAccount);
    const ssAccounts = accounts
      .filter((a) => a.type === "StocksAndShares")
      .map(toProjectableAccount);

    const savingsSums = sumAccountSeries(savingsAccounts, settings, horizonYears);
    const ssSums = sumAccountSeries(ssAccounts, settings, horizonYears);

    const retirement = members.map((member) => {
      const pensionAccounts = accounts
        .filter((a) => a.type === "Pension" && a.memberUserId === member.userId)
        .map(toProjectableAccount);
      const pensionSums = sumAccountSeries(pensionAccounts, settings, horizonYears);

      const series = Array.from({ length: horizonYears + 1 }, (_, y) => ({
        year: currentYear + y,
        pension: Math.round(pensionSums[y] ?? 0),
        savings: Math.round(savingsSums[y] ?? 0),
        stocksAndShares: Math.round(ssSums[y] ?? 0),
      }));

      return {
        memberId: member.userId,
        memberName: member.user.name,
        retirementYear: member.retirementYear ?? null,
        series,
      };
    });

    return { netWorth, surplus, retirement };
  },
};
