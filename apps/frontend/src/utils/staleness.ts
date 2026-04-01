import { differenceInMonths, parseISO } from "date-fns";

function toDate(value: Date | string): Date {
  return value instanceof Date ? value : parseISO(value);
}

export function monthsElapsed(lastReviewedAt: Date | string, now: Date = new Date()): number {
  return differenceInMonths(now, toDate(lastReviewedAt));
}

export function isStale(
  lastReviewedAt: Date | string,
  thresholdMonths: number,
  now: Date = new Date()
): boolean {
  return monthsElapsed(lastReviewedAt, now) >= thresholdMonths;
}

export function stalenessLabel(lastReviewedAt: Date | string, now: Date = new Date()): string {
  const months = monthsElapsed(lastReviewedAt, now);
  if (months === 0) return "Last reviewed: this month";
  if (months === 1) return "Last reviewed: 1 month ago";
  return `Last reviewed: ${months} months ago`;
}
