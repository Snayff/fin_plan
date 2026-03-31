import { prisma } from "../config/database.js";
import { waterfallService } from "./waterfall.service.js";
import type { ForecastProjection, ForecastHorizon } from "@finplan/shared";

function effectiveRate(
  account: { growthRatePct: number | null; assetClass: string },
  settings: { savingsRatePct: number; investmentRatePct: number; pensionRatePct: number }
): number {
  if (account.growthRatePct != null) return account.growthRatePct / 100;
  switch (account.assetClass) {
    case "savings":
      return settings.savingsRatePct / 100;
    case "stocksAndShares":
      return settings.investmentRatePct / 100;
    case "pension":
      return settings.pensionRatePct / 100;
    default:
      return 0;
  }
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

function sumAccountSeries(
  accounts: {
    balance: number;
    monthlyContribution: number | null;
    growthRatePct: number | null;
    assetClass: string;
  }[],
  settings: { savingsRatePct: number; investmentRatePct: number; pensionRatePct: number },
  years: number
): number[] {
  const sums = Array.from({ length: years + 1 }, () => 0);
  for (const acc of accounts) {
    const rate = effectiveRate(acc, settings);
    const series = projectBalanceSeries(acc.balance, acc.monthlyContribution ?? 0, rate, years);
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

export const forecastService = {
  async getProjections(
    householdId: string,
    horizonYears: ForecastHorizon
  ): Promise<ForecastProjection> {
    const [accounts, settingsRow, members, waterfallSummary] = await Promise.all([
      (prisma as any).wealthAccount.findMany({ where: { householdId } }),
      prisma.householdSettings.findUnique({ where: { householdId } }),
      prisma.householdMember.findMany({
        where: { householdId },
        include: { user: { select: { id: true, name: true } } },
      }),
      waterfallService.getWaterfallSummary(householdId),
    ]);

    const settings = settingsRow ?? DEFAULT_SETTINGS;
    const currentYear = new Date().getFullYear();

    // ── Net worth (non-pension accounts) ─────────────────────────────────────
    const netWorthAccounts = (accounts as any[]).filter((a) => a.assetClass !== "pension");
    const netWorthSums = sumAccountSeries(netWorthAccounts, settings as any, horizonYears);

    const netWorth = Array.from({ length: horizonYears + 1 }, (_, y) => {
      const nominal = Math.round(netWorthSums[y] ?? 0);
      const real = Math.round(nominal / Math.pow(1 + (settings as any).inflationRatePct / 100, y));
      return { year: currentYear + y, nominal, real };
    });

    // ── Surplus accumulation (constant monthly surplus, no growth) ────────────
    const monthlySurplus = waterfallSummary.surplus.amount;
    const surplus = Array.from({ length: horizonYears + 1 }, (_, y) => ({
      year: currentYear + y,
      cumulative: Math.round(monthlySurplus * 12 * y),
    }));

    // ── Retirement (per member: own pensions + shared savings + shared S&S) ──
    const savingsAccounts = (accounts as any[]).filter((a) => a.assetClass === "savings");
    const ssAccounts = (accounts as any[]).filter((a) => a.assetClass === "stocksAndShares");

    const savingsSums = sumAccountSeries(savingsAccounts, settings as any, horizonYears);
    const ssSums = sumAccountSeries(ssAccounts, settings as any, horizonYears);

    const retirement = (members as any[]).map((member) => {
      const pensionAccounts = (accounts as any[]).filter(
        (a) => a.assetClass === "pension" && a.memberId === member.userId
      );
      const pensionSums = sumAccountSeries(pensionAccounts, settings as any, horizonYears);

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
