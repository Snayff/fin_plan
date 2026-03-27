import { toGBP } from "@finplan/shared";
import { formatCurrency } from "@/utils/format";
import { monthsElapsed, isStale as stalenessIsStale } from "@/utils/staleness";

export type SpendType = "monthly" | "yearly" | "one_off";

export function formatItemAmount(
  amount: number,
  spendType: SpendType
): {
  primary: string;
  secondary: string | null;
  label: string | null;
} {
  if (spendType === "monthly") {
    return { primary: formatCurrency(toGBP(amount)), secondary: null, label: null };
  }
  if (spendType === "yearly") {
    const monthly = Math.round(amount / 12);
    return {
      primary: formatCurrency(toGBP(amount)),
      secondary: `${formatCurrency(toGBP(monthly))}/mo`,
      label: null,
    };
  }
  // one_off
  const monthly = Math.round(amount / 12);
  return {
    primary: formatCurrency(toGBP(amount)),
    secondary: `${formatCurrency(toGBP(monthly))}/mo`,
    label: "One-off",
  };
}

/** Returns whole calendar months elapsed since lastReviewedAt (uses date-fns). */
export function getMonthsAgo(lastReviewedAt: Date, now: Date): number {
  return monthsElapsed(lastReviewedAt, now);
}

/** Returns true when lastReviewedAt is at least thresholdMonths calendar months before now. */
export function isStale(lastReviewedAt: Date, now: Date, thresholdMonths: number): boolean {
  return stalenessIsStale(lastReviewedAt, thresholdMonths, now);
}

export const SPEND_TYPE_LABELS: Record<SpendType, string> = {
  monthly: "Monthly",
  yearly: "Yearly",
  one_off: "One-off",
};

interface AmountLine {
  value: string;
  bright: boolean;
}

export interface TwoLineAmount {
  monthly: AmountLine;
  yearly: AmountLine | null;
}

export function formatTwoLineAmount(amount: number, spendType: SpendType): TwoLineAmount {
  if (spendType === "one_off") {
    return {
      monthly: { value: formatCurrency(toGBP(amount)), bright: true },
      yearly: null,
    };
  }

  const isMonthly = spendType === "monthly";
  const monthlyAmt = isMonthly ? amount : Math.round(amount / 12);
  const yearlyAmt = isMonthly ? amount * 12 : amount;

  return {
    monthly: {
      value: `${formatCurrency(toGBP(monthlyAmt))}/mo`,
      bright: isMonthly,
    },
    yearly: {
      value: `${formatCurrency(toGBP(yearlyAmt))}/yr`,
      bright: !isMonthly,
    },
  };
}
