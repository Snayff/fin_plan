import type { IncomeFrequency, SpendType } from "../schemas/waterfall.schemas";

export const MONTHS_PER_YEAR = 12;
export const WEEKS_PER_YEAR = 52;

type AllFrequency = IncomeFrequency | SpendType | "weekly" | "quarterly";

export function toMonthlyAmount(amount: number, freq: AllFrequency): number {
  switch (freq) {
    case "monthly":
      return amount;
    case "weekly":
      return (amount * WEEKS_PER_YEAR) / MONTHS_PER_YEAR;
    case "quarterly":
      return amount / 3;
    case "annual":
    case "yearly":
      return amount / MONTHS_PER_YEAR;
    case "one_off":
      return 0;
  }
}

export function toYearlyAmount(amount: number, freq: AllFrequency): number {
  switch (freq) {
    case "monthly":
      return amount * MONTHS_PER_YEAR;
    case "weekly":
      return amount * WEEKS_PER_YEAR;
    case "quarterly":
      return amount * 4;
    case "annual":
    case "yearly":
      return amount;
    case "one_off":
      return 0;
  }
}

export function isRecurring(freq: AllFrequency): boolean {
  return freq !== "one_off";
}
