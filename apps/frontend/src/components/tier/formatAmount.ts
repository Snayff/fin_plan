import { toGBP, toMonthlyAmount, toYearlyAmount } from "@finplan/shared";
import type { SpendType } from "@finplan/shared";
export type { SpendType };
import { formatCurrency } from "@/utils/format";
import { monthsElapsed, isStale as stalenessIsStale } from "@/utils/staleness";

export function formatItemAmount(
  amount: number,
  spendType: SpendType,
  showPence = false
): {
  primary: string;
  secondary: string | null;
  label: string | null;
} {
  if (spendType === "monthly") {
    return { primary: formatCurrency(toGBP(amount), showPence), secondary: null, label: null };
  }
  if (spendType === "weekly") {
    const monthly = showPence
      ? toMonthlyAmount(amount, "weekly")
      : Math.round(toMonthlyAmount(amount, "weekly"));
    return {
      primary: formatCurrency(toGBP(amount), showPence),
      secondary: `${formatCurrency(toGBP(monthly), showPence)}/mo`,
      label: null,
    };
  }
  if (spendType === "quarterly") {
    const monthly = showPence
      ? toMonthlyAmount(amount, "quarterly")
      : Math.round(toMonthlyAmount(amount, "quarterly"));
    return {
      primary: formatCurrency(toGBP(amount), showPence),
      secondary: `${formatCurrency(toGBP(monthly), showPence)}/mo`,
      label: null,
    };
  }
  if (spendType === "yearly") {
    const monthly = showPence
      ? toMonthlyAmount(amount, "yearly")
      : Math.round(toMonthlyAmount(amount, "yearly"));
    return {
      primary: formatCurrency(toGBP(amount), showPence),
      secondary: `${formatCurrency(toGBP(monthly), showPence)}/mo`,
      label: null,
    };
  }
  // one_off
  const monthly = showPence
    ? toMonthlyAmount(amount, "one_off")
    : Math.round(toMonthlyAmount(amount, "one_off"));
  return {
    primary: formatCurrency(toGBP(amount), showPence),
    secondary: `${formatCurrency(toGBP(monthly), showPence)}/mo`,
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
  weekly: "Weekly",
  monthly: "Monthly",
  quarterly: "Quarterly",
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

export function formatTwoLineAmount(
  amount: number,
  spendType: SpendType,
  showPence = false
): TwoLineAmount {
  if (spendType === "one_off") {
    return {
      monthly: { value: formatCurrency(toGBP(amount), showPence), bright: true },
      yearly: null,
    };
  }

  const monthlyAmt = showPence
    ? toMonthlyAmount(amount, spendType)
    : Math.round(toMonthlyAmount(amount, spendType));
  const yearlyAmt = toYearlyAmount(amount, spendType);

  return {
    monthly: {
      value: `${formatCurrency(toGBP(monthlyAmt), showPence)}/mo`,
      bright: true,
    },
    yearly: {
      value: `${formatCurrency(toGBP(yearlyAmt), showPence)}/yr`,
      bright: false,
    },
  };
}
