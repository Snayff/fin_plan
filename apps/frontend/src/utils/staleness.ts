import { differenceInMonths, parseISO } from "date-fns";

function toDate(value: Date | string): Date {
  return value instanceof Date ? value : parseISO(value);
}

export function monthsElapsed(lastReviewedAt: Date | string): number {
  return differenceInMonths(new Date(), toDate(lastReviewedAt));
}

export function isStale(lastReviewedAt: Date | string, thresholdMonths: number): boolean {
  return monthsElapsed(lastReviewedAt) >= thresholdMonths;
}

export function stalenessLabel(lastReviewedAt: Date | string): string {
  const months = monthsElapsed(lastReviewedAt);
  if (months === 0) return "Last reviewed: this month";
  if (months === 1) return "Last reviewed: 1 month ago";
  return `Last reviewed: ${months} months ago`;
}
