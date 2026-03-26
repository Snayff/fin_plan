import { toGBP } from "@finplan/shared";
import { formatCurrency } from "@/utils/format";

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

export function getMonthsAgo(lastReviewedAt: Date, now: Date): number {
  const diffMs = now.getTime() - new Date(lastReviewedAt).getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24 * 30.44));
}

export function isStale(lastReviewedAt: Date, now: Date, thresholdMonths: number): boolean {
  return getMonthsAgo(lastReviewedAt, now) >= thresholdMonths;
}
